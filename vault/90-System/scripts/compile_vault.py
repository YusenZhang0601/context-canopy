#!/usr/bin/env python3
"""Read-only compiler/auditor for the Second Brain canonical graph.

The default mode is ``--check`` and never writes.  ``--write-derived`` has an
explicit two-file allowlist: ``90-System/INDEX.md`` and
``90-System/SOURCE-COVERAGE.md``.  Canonical pages are never created, changed,
moved, or deleted by this program.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sys
import tempfile
from collections import Counter, defaultdict, deque
from dataclasses import asdict, dataclass, field
from pathlib import Path, PurePosixPath
from typing import Any, Iterable, Sequence
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

try:
    import yaml
except ImportError as exc:  # pragma: no cover - environment failure path
    raise SystemExit("compile_vault.py requires PyYAML (python module 'yaml')") from exc


SCRIPT_ROOT = Path(__file__).resolve().parents[2]
CANONICAL_DIRS = ("01-Knowledge", "02-Insights", "03-Personal")
REQUIRED_FIELDS = (
    "type",
    "created",
    "updated",
    "status",
    "summary",
    "confidence",
    "aliases",
    "freshness",
    "last_checked",
    "sources",
    "tags",
)
ENUMS = {
    "type": {"knowledge", "insight", "personal"},
    "status": {"seed", "active", "stable", "deprecated"},
    "confidence": {"low", "medium", "high"},
    "freshness": {"timeless", "current", "stale", "blocked"},
    "privacy": {"private", "sensitive", "shareable"},
}
TYPE_DIR = {
    "01-Knowledge": "knowledge",
    "02-Insights": "insight",
    "03-Personal": "personal",
}
ALLOWED_RELATIONS = {
    "上位概念",
    "组成部分",
    "支撑",
    "反例或限制",
    "应用场景",
    "相关人物或偏好",
}
ALLOWED_COVERAGE_STATUSES = {"已编译", "仅供参考", "重复快照", "敏感保留", "延期"}
MANUAL_DISPOSITION_STATUSES = ALLOWED_COVERAGE_STATUSES - {"已编译"}
FORBIDDEN_CANONICAL_SOURCE_PATHS = {
    "90-System/ATOMICITY-REVIEW.json",
    "90-System/INDEX.md",
    "90-System/LINT.md",
    "90-System/LOG.md",
    "90-System/SOURCE-COVERAGE.md",
    "90-System/SOURCE-DISPOSITIONS.json",
}
PLACEHOLDER_REASONS = {
    "-",
    "n/a",
    "tbd",
    "todo",
    "unknown",
    "仅供参考",
    "以后处理",
    "占位理由",
    "延期",
    "待处理",
    "待定",
    "敏感保留",
    "尚未处理",
    "尚未由 canonical 页面声明",
    "稍后处理",
    "重复快照",
}
ATOMIC_FORMS = {"atomic", "entity"}
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
URL_SCHEMES = {"http", "https"}
SENSITIVE_TEXT_SUFFIXES = {".md", ".txt", ".json", ".yaml", ".yml", ".csv", ".tsv", ".env"}
SECRET_PATTERNS = (
    re.compile(rb"gh[pousr]_[A-Za-z0-9]{20,}"),
    re.compile(rb"(?<![A-Za-z])sk-[A-Za-z0-9_-]{20,}"),
    re.compile(rb"AKIA[0-9A-Z]{16}"),
    re.compile(rb"BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY"),
    re.compile(rb"(?i:(?:password|passwd|sudo\s*\xe5\xaf\x86\xe7\xa0\x81|\xe5\xaf\x86\xe7\xa0\x81)\s*[:=\xef\xbc\x9a]\s*[\"']?[^\s\"']{4,})"),
)
WIKILINK_RE = re.compile(r"(?<!!)\[\[([^\]\n]+)\]\]")
H1_RE = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)
H2_RE = re.compile(r"^##\s+(.+?)\s*$", re.MULTILINE)
RELATION_LINE_RE = re.compile(r"^-\s+\*\*(.+?)\*\*\s*[：:]", re.MULTILINE)
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
INDEX_PATH_RE = re.compile(
    r"`((?:01-Knowledge|02-Insights|03-Personal)/[^`\n]+?\.md)`"
)
CODE_PATH_RE = re.compile(r"`([^`\n]+?\.md)`")
BLOCKING_DERIVED_PHASES = {"metadata", "identity", "graph", "source", "atomicity"}
ATOMICITY_REVIEW_PATH = "90-System/ATOMICITY-REVIEW.json"
SOURCE_DISPOSITIONS_PATH = "90-System/SOURCE-DISPOSITIONS.json"
MANAGED_ATOMIC_SECTIONS = {"关系", "来源双链", "更新记录"}
MANUAL_REPORT_HEADINGS = {
    "api reference",
    "changelog",
    "configuration",
    "installation",
    "quick start",
    "usage",
    "会议记录",
    "变更日志",
    "命令清单",
    "安装",
    "完整指南",
    "快速开始",
    "操作步骤",
    "故障排查",
    "时间线",
    "运行日志",
    "配置",
    "部署",
}


@dataclass(frozen=True)
class Issue:
    code: str
    path: str
    message: str
    phase: str
    severity: str = "error"
    target: str | None = None


@dataclass
class Page:
    path: Path
    rel: str
    text: str
    frontmatter_text: str = ""
    body: str = ""
    rendered_body: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)
    aliases: list[str] = field(default_factory=list)
    relation_links: dict[str, set[str]] = field(default_factory=lambda: defaultdict(set))
    source_declarations: list[str] = field(default_factory=list)
    source_link_paths: set[Path] = field(default_factory=set)

    @property
    def title(self) -> str:
        return self.path.stem


@dataclass
class SourceRecord:
    key: str
    kind: str
    status: str
    consumers: set[str] = field(default_factory=set)
    reason: str = ""
    checksum: str = "-"

    @property
    def detail(self) -> str:
        consumers = "；".join(f"`{item}`" for item in sorted(self.consumers))
        if self.status == "已编译":
            return consumers or self.reason or "-"
        if consumers:
            return f"{self.reason}；涉及：{consumers}"
        return self.reason or "-"


def relpath(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return str(path.resolve())


def canonical_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for directory in CANONICAL_DIRS:
        base = root / directory
        if base.is_dir():
            files.extend(path for path in base.rglob("*.md") if path.is_file())
    return sorted(files, key=lambda path: relpath(path, root))


def split_frontmatter(text: str) -> tuple[str | None, str]:
    normalized = text.lstrip("\ufeff")
    lines = normalized.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        return None, normalized
    for index in range(1, len(lines)):
        if lines[index].strip() == "---":
            return "".join(lines[1:index]), "".join(lines[index + 1 :])
    return None, normalized


def remove_fenced_code(text: str) -> str:
    output: list[str] = []
    fence: tuple[str, int] | None = None
    for line in text.splitlines():
        match = re.match(r"^\s*(`{3,}|~{3,})", line)
        if match:
            marker = match.group(1)
            char = marker[0]
            if fence is None:
                fence = (char, len(marker))
            elif char == fence[0] and len(marker) >= fence[1]:
                fence = None
            output.append("")
            continue
        output.append("" if fence else line)
    return "\n".join(output)


def remove_inline_code(text: str) -> str:
    return re.sub(r"(`+)(?:(?!\1).)*\1", "", text)


def visible_markdown(text: str) -> str:
    """Return rendered prose, excluding frontmatter and code examples."""

    _frontmatter, body = split_frontmatter(text)
    return remove_inline_code(remove_fenced_code(body))


def markdown_without_fences(text: str) -> str:
    """Return Markdown body with fenced examples removed but inline code kept."""

    _frontmatter, body = split_frontmatter(text)
    return remove_fenced_code(body)


def section(text: str, heading: str) -> str:
    lines = text.splitlines()
    start: int | None = None
    collected: list[str] = []
    for index, line in enumerate(lines):
        if line.strip() == f"## {heading}":
            start = index + 1
            continue
        if start is not None:
            if re.match(r"^#{1,2}\s+", line):
                break
            collected.append(line)
    return "\n".join(collected) if start is not None else ""


def raw_wikilink_target(raw: str) -> str:
    return raw.split("|", 1)[0].strip()


def clean_target(raw: str) -> str:
    target = raw_wikilink_target(raw).split("#", 1)[0].strip().replace("\\", "/")
    if target.endswith(".md"):
        target = target[:-3]
    return target


def valid_date(value: Any) -> str | None:
    if isinstance(value, dt.datetime):
        return value.date().isoformat()
    if isinstance(value, dt.date):
        return value.isoformat()
    if isinstance(value, str) and DATE_RE.fullmatch(value):
        try:
            return dt.date.fromisoformat(value).isoformat()
        except ValueError:
            return None
    return None


def list_of_strings(value: Any) -> list[str] | None:
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        return None
    return [item.strip() for item in value]


def is_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme.lower() in URL_SCHEMES and bool(parsed.netloc)


def normalize_declared_source(value: str) -> str:
    stripped = value.strip()
    if stripped.startswith("[[") and stripped.endswith("]]" ):
        stripped = raw_wikilink_target(stripped[2:-2])
    return stripped


def source_path(value: str, root: Path) -> Path | None:
    normalized = normalize_declared_source(value)
    if is_url(normalized) or normalized.casefold() == "current conversation":
        return None
    candidate = Path(normalized).expanduser()
    if not candidate.is_absolute():
        candidate = root / candidate
    return candidate.resolve()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_looks_sensitive(path: Path) -> bool:
    """Conservatively flag likely credentials without exposing their values."""
    if path.suffix.casefold() not in SENSITIVE_TEXT_SUFFIXES:
        return False
    try:
        if path.stat().st_size > 2 * 1024 * 1024:
            return False
        data = path.read_bytes()
    except OSError:
        return False
    return any(pattern.search(data) for pattern in SECRET_PATTERNS)


def unquote_code_cell(value: str) -> str:
    if len(value) >= 2 and value.startswith("`") and value.endswith("`"):
        return value[1:-1]
    return value


def source_coverage_rows(text: str) -> list[tuple[str, str, str, str, str]]:
    rows: list[tuple[str, str, str, str, str]] = []
    for line in markdown_without_fences(text).splitlines():
        if not line.lstrip().startswith("|"):
            continue
        cells = [cell.strip().replace("\\|", "|") for cell in re.split(r"(?<!\\)\|", line)]
        if len(cells) != 7:
            continue
        key_cell, kind, status, detail, checksum_cell = cells[1:6]
        if len(key_cell) >= 2 and key_cell.startswith("`") and key_cell.endswith("`"):
            rows.append(
                (
                    unquote_code_cell(key_cell),
                    kind,
                    status,
                    detail,
                    unquote_code_cell(checksum_cell),
                )
            )
    return rows


def normalized_local_source_key(value: str, root: Path) -> str | None:
    """Return a vault-relative key for a local source, if it is inside root."""

    normalized = normalize_declared_source(value)
    if is_url(normalized) or normalized.casefold() == "current conversation":
        return None
    candidate = Path(normalized).expanduser()
    if not candidate.is_absolute():
        candidate = root / candidate
    try:
        return candidate.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return None


def substantive_body(page: Page) -> str:
    """Return prose outside compiler-managed relationship/audit sections."""

    output: list[str] = []
    skip = False
    for line in page.rendered_body.splitlines():
        heading = re.match(r"^##\s+(.+?)\s*$", line)
        if heading:
            skip = heading.group(1).strip() in MANAGED_ATOMIC_SECTIONS
            if not skip:
                output.append(line)
            continue
        if not skip:
            output.append(line)
    return "\n".join(output)


def prose_character_count(text: str) -> int:
    without_links = WIKILINK_RE.sub("", text)
    without_markdown = re.sub(r"(?m)^\s{0,3}#{1,6}\s+", "", without_links)
    without_markdown = re.sub(r"[*_>`~#\-\[\]()|:：\s]", "", without_markdown)
    return len(without_markdown)


class Resolver:
    def __init__(self, root: Path, pages: Sequence[Page]):
        self.root = root.resolve()
        self.canonical_by_rel: dict[str, Page] = {}
        self.canonical_names: dict[str, list[Page]] = defaultdict(list)
        self.all_by_rel: dict[str, Path] = {}
        self.other_names: dict[str, list[Path]] = defaultdict(list)

        for page in pages:
            key = PurePosixPath(page.rel).with_suffix("").as_posix()
            self.canonical_by_rel[key] = page
            self.canonical_names[page.title].append(page)
            for alias in page.aliases:
                self.canonical_names[alias].append(page)

        excluded_parts = {".git", ".obsidian", "__pycache__", ".pytest_cache"}
        for path in sorted(self.root.rglob("*.md")):
            if any(part in excluded_parts for part in path.relative_to(self.root).parts):
                continue
            key = PurePosixPath(relpath(path, self.root)).with_suffix("").as_posix()
            self.all_by_rel[key] = path.resolve()
            if key not in self.canonical_by_rel:
                self.other_names[path.stem].append(path.resolve())

    @staticmethod
    def _unique(items: Iterable[Any], key: Any) -> list[Any]:
        unique: dict[Any, Any] = {}
        for item in items:
            unique[key(item)] = item
        return list(unique.values())

    def _path_candidates(self, target: str, source_rel: str, domain: str) -> list[Any]:
        if not target:
            return []
        candidates: list[str] = []
        normalized = target.lstrip("/")
        if target.startswith(("./", "../")):
            base = PurePosixPath(source_rel).parent
            normalized = os.path.normpath(str(base / target)).replace("\\", "/")
        candidates.append(normalized)

        if domain == "canonical":
            found: list[Page] = []
            for candidate in candidates:
                if candidate in self.canonical_by_rel:
                    found.append(self.canonical_by_rel[candidate])
                if "/" in candidate:
                    found.extend(
                        page
                        for key, page in self.canonical_by_rel.items()
                        if key.endswith("/" + candidate)
                    )
            return self._unique(found, lambda page: page.rel)

        found_paths: list[Path] = []
        for candidate in candidates:
            if candidate in self.all_by_rel:
                found_paths.append(self.all_by_rel[candidate])
            if "/" in candidate:
                found_paths.extend(
                    path for key, path in self.all_by_rel.items() if key.endswith("/" + candidate)
                )
        if domain == "source":
            found_paths = [
                path
                for path in found_paths
                if PurePosixPath(relpath(path, self.root)).parts[0] not in CANONICAL_DIRS
            ]
        return self._unique(found_paths, lambda path: str(path))

    def resolve(self, raw: str, source_rel: str, domain: str) -> tuple[str, list[Any]]:
        target = clean_target(raw)
        if not target:
            return "anchor", []

        path_matches = self._path_candidates(target, source_rel, domain)
        if path_matches:
            return ("resolved" if len(path_matches) == 1 else "ambiguous"), path_matches

        if "/" in target:
            return "unresolved", []

        if domain == "canonical":
            matches = self._unique(self.canonical_names.get(target, []), lambda page: page.rel)
        elif domain == "source":
            matches = self._unique(self.other_names.get(target, []), lambda path: str(path))
        else:
            canonical = self._unique(self.canonical_names.get(target, []), lambda page: page.rel)
            if canonical:
                matches = canonical
            else:
                matches = self._unique(self.other_names.get(target, []), lambda path: str(path))
        if not matches:
            return "unresolved", []
        return ("resolved" if len(matches) == 1 else "ambiguous"), matches


class VaultCompiler:
    def __init__(self, root: Path, audit_date: dt.date):
        self.root = root.resolve()
        self.audit_date = audit_date
        self.pages: list[Page] = []
        self.issues: list[Issue] = []
        self._issue_keys: set[tuple[str, str, str | None, str]] = set()
        self.inbound: dict[str, set[str]] = defaultdict(set)
        self.outbound: dict[str, set[str]] = defaultdict(set)
        self.source_records: dict[str, SourceRecord] = {}
        self.atomicity_forms: dict[str, str] = {}
        self.counts: dict[str, int] = {}

    def add_issue(
        self,
        code: str,
        path: str,
        message: str,
        phase: str,
        *,
        severity: str = "error",
        target: str | None = None,
    ) -> None:
        key = (code, path, target, message)
        if key in self._issue_keys:
            return
        self._issue_keys.add(key)
        self.issues.append(Issue(code, path, message, phase, severity, target))

    def load_pages(self) -> None:
        paths = canonical_files(self.root)
        if not paths:
            self.add_issue("no_canonical_pages", ".", "no canonical Markdown pages found", "metadata")
            return
        for path in paths:
            relative = relpath(path, self.root)
            try:
                text = path.read_text(encoding="utf-8")
            except (OSError, UnicodeError) as exc:
                self.add_issue("page_read_error", relative, str(exc), "metadata")
                continue
            frontmatter_text, body = split_frontmatter(text)
            page = Page(path=path.resolve(), rel=relative, text=text, body=body)
            page.rendered_body = remove_inline_code(remove_fenced_code(body))
            if frontmatter_text is None:
                self.add_issue("missing_frontmatter", relative, "missing closed YAML frontmatter", "metadata")
                self.pages.append(page)
                continue
            page.frontmatter_text = frontmatter_text
            try:
                data = yaml.safe_load(frontmatter_text)
            except yaml.YAMLError as exc:
                self.add_issue("invalid_yaml", relative, str(exc).splitlines()[0], "metadata")
                self.pages.append(page)
                continue
            if not isinstance(data, dict):
                self.add_issue("invalid_frontmatter", relative, "frontmatter must be a mapping", "metadata")
                self.pages.append(page)
                continue
            page.metadata = data
            aliases = list_of_strings(data.get("aliases"))
            if aliases is not None:
                page.aliases = aliases
            sources = list_of_strings(data.get("sources"))
            if sources is not None:
                page.source_declarations = sources
            self.pages.append(page)

    def validate_metadata(self) -> None:
        declared_tags = self.declared_tags()
        identity_names: dict[str, list[Page]] = defaultdict(list)
        for page in self.pages:
            if file_looks_sensitive(page.path):
                self.add_issue(
                    "possible_secret_in_canonical",
                    page.rel,
                    "canonical page contains a credential-like value; redact it and retain sensitive evidence only in Sources",
                    "metadata",
                )
            metadata = page.metadata
            if not metadata:
                continue
            for field_name in REQUIRED_FIELDS:
                if field_name not in metadata:
                    self.add_issue(
                        "missing_field", page.rel, f"missing required field: {field_name}", "metadata", target=field_name
                    )

            expected_type = TYPE_DIR.get(PurePosixPath(page.rel).parts[0])
            for field_name, allowed in ENUMS.items():
                if field_name == "privacy" and metadata.get("type") != "personal":
                    continue
                value = metadata.get(field_name)
                if field_name == "privacy" and metadata.get("type") == "personal" and value is None:
                    self.add_issue("missing_privacy", page.rel, "personal page requires privacy", "metadata")
                elif value is not None and value not in allowed:
                    self.add_issue(
                        "invalid_enum", page.rel, f"{field_name}={value!r} is not allowed", "metadata", target=field_name
                    )
            if metadata.get("type") and metadata.get("type") != expected_type:
                self.add_issue(
                    "type_directory_mismatch",
                    page.rel,
                    f"type {metadata.get('type')!r} does not match {expected_type!r}",
                    "metadata",
                )

            for field_name in ("created", "updated", "last_checked", "review_after"):
                value = metadata.get(field_name)
                if value is not None and valid_date(value) is None:
                    self.add_issue(
                        "invalid_date", page.rel, f"{field_name} must be YYYY-MM-DD", "metadata", target=field_name
                    )
            created = valid_date(metadata.get("created"))
            updated = valid_date(metadata.get("updated"))
            checked = valid_date(metadata.get("last_checked"))
            review_after = valid_date(metadata.get("review_after"))
            freshness = metadata.get("freshness")
            if created and updated and updated < created:
                self.add_issue("date_order", page.rel, "updated precedes created", "metadata")
            if checked and checked > self.audit_date.isoformat():
                self.add_issue("future_last_checked", page.rel, "last_checked is in the future", "metadata")
            if freshness == "current" and "review_after" not in metadata:
                self.add_issue(
                    "missing_review_after",
                    page.rel,
                    "freshness=current requires review_after",
                    "metadata",
                )
            if freshness != "current" and "review_after" in metadata:
                self.add_issue(
                    "unexpected_review_after",
                    page.rel,
                    "review_after is only allowed when freshness=current",
                    "metadata",
                )
            if checked and review_after and review_after < checked:
                self.add_issue(
                    "review_after_before_last_checked",
                    page.rel,
                    "review_after precedes last_checked",
                    "metadata",
                )
            if (
                freshness == "current"
                and review_after
                and review_after < self.audit_date.isoformat()
            ):
                self.add_issue(
                    "expired_current",
                    page.rel,
                    f"freshness=current expired after {review_after}; reverify or mark stale/blocked",
                    "metadata",
                    target=review_after,
                )

            summary = metadata.get("summary")
            if not isinstance(summary, str) or not summary.strip():
                self.add_issue("invalid_summary", page.rel, "summary must be a non-empty string", "metadata")
            elif "\n" in summary:
                self.add_issue("multiline_summary", page.rel, "summary must be one line", "metadata")

            for field_name in ("aliases", "sources", "tags"):
                values = list_of_strings(metadata.get(field_name))
                if values is None:
                    self.add_issue(
                        "invalid_list", page.rel, f"{field_name} must be a list of strings", "metadata", target=field_name
                    )
            aliases = page.aliases
            if len(aliases) != len(set(aliases)):
                self.add_issue("duplicate_alias", page.rel, "aliases contains duplicates", "identity")
            if page.title in aliases:
                self.add_issue("redundant_alias", page.rel, "aliases repeats the file title", "identity")
            for identity in [page.title, *aliases]:
                if identity:
                    identity_names[identity].append(page)

            tags = list_of_strings(metadata.get("tags")) or []
            for tag in tags:
                if tag not in declared_tags:
                    self.add_issue("undeclared_tag", page.rel, f"tag is not declared: {tag}", "metadata", target=tag)
            page_type = metadata.get("type")
            status = metadata.get("status")
            privacy = metadata.get("privacy")
            for required_tag in filter(None, [f"domain/{page_type}" if page_type else None, f"status/{status}" if status else None]):
                if required_tag not in tags:
                    self.add_issue("missing_semantic_tag", page.rel, f"missing tag: {required_tag}", "metadata")
            if page_type == "personal" and privacy and f"privacy/{privacy}" not in tags:
                self.add_issue("missing_privacy_tag", page.rel, f"missing tag: privacy/{privacy}", "metadata")
            if status == "deprecated":
                self.add_issue(
                    "deprecated_in_canonical",
                    page.rel,
                    "deprecated pages must be moved to the deduplicated archive",
                    "metadata",
                )

            self.validate_page_structure(page)
            self.validate_source_declarations(page)

        for identity, pages in sorted(identity_names.items()):
            unique = sorted({page.rel for page in pages})
            if len(unique) > 1:
                for page_rel in unique:
                    self.add_issue(
                        "ambiguous_identity",
                        page_rel,
                        f"title/alias {identity!r} resolves to {len(unique)} canonical pages",
                        "identity",
                        target=identity,
                    )

    def validate_page_structure(self, page: Page) -> None:
        rendered = page.rendered_body
        h1s = [heading.strip() for heading in H1_RE.findall(rendered)]
        if len(h1s) != 1:
            self.add_issue("invalid_h1_count", page.rel, f"expected one H1, found {len(h1s)}", "metadata")
        elif h1s[0] != page.title and h1s[0] not in page.aliases:
            self.add_issue(
                "h1_title_mismatch",
                page.rel,
                f"H1 {h1s[0]!r} differs from filename {page.title!r} and is not declared as an alias",
                "metadata",
            )

        h2s = [heading.strip() for heading in H2_RE.findall(rendered)]
        duplicates = sorted(heading for heading, count in Counter(h2s).items() if count > 1)
        for heading in duplicates:
            self.add_issue("duplicate_h2", page.rel, f"duplicate H2 section: {heading}", "metadata", target=heading)
        for required_heading in ("关系", "更新记录"):
            if required_heading not in h2s:
                self.add_issue(
                    "missing_section", page.rel, f"missing ## {required_heading}", "metadata", target=required_heading
                )
        update_section = section(rendered, "更新记录")
        update_dates = re.findall(r"^-\s+(\d{4}-\d{2}-\d{2})[：:]", update_section, re.MULTILINE)
        if "更新记录" in h2s and not update_dates:
            self.add_issue("invalid_update_record", page.rel, "更新记录 requires dated bullet entries", "metadata")
        updated = valid_date(page.metadata.get("updated"))
        if updated and update_dates and updated not in update_dates:
            self.add_issue(
                "updated_not_recorded", page.rel, f"updated={updated} has no matching 更新记录 entry", "metadata"
            )

    def validate_source_declarations(self, page: Page) -> None:
        sources_value = page.metadata.get("sources")
        sources = list_of_strings(sources_value)
        if sources is None:
            return
        if not sources:
            self.add_issue("empty_sources", page.rel, "sources must contain evidence or an explicit gap", "metadata")
        persistent = []
        for source in sources:
            if not source:
                self.add_issue("empty_source_entry", page.rel, "sources contains an empty entry", "metadata")
                continue
            if source.startswith("[[") and source.endswith("]]" ):
                self.add_issue(
                    "wikilink_in_sources",
                    page.rel,
                    "sources must use a plain path or URL, not a wikilink",
                    "metadata",
                    target=source,
                )
            normalized = normalize_declared_source(source)
            local_key = normalized_local_source_key(normalized, self.root)
            if local_key in FORBIDDEN_CANONICAL_SOURCE_PATHS:
                self.add_issue(
                    "mutable_management_source",
                    page.rel,
                    f"mutable management page cannot be canonical evidence: {local_key}",
                    "source",
                    target=local_key,
                )
            if normalized.casefold() != "current conversation":
                persistent.append(normalized)
            if is_url(normalized) or normalized.casefold() == "current conversation":
                continue
            resolved = source_path(normalized, self.root)
            if resolved is None or not resolved.exists():
                self.add_issue("missing_source", page.rel, f"local source does not exist: {normalized}", "source", target=normalized)

        if page.metadata.get("confidence") == "high":
            if not persistent:
                self.add_issue(
                    "high_without_persistent_source",
                    page.rel,
                    "high confidence requires a persistent source",
                    "metadata",
                )
            readmes = [item for item in persistent if not is_url(item) and Path(item).name.casefold() == "readme.md"]
            if persistent and len(readmes) == len(persistent):
                self.add_issue(
                    "generic_readme_only_high_confidence",
                    page.rel,
                    "a generic README cannot be the only evidence for a high-confidence claim",
                    "metadata",
                )

    def declared_tags(self) -> set[str]:
        ontology = self.root / "90-System/ONTOLOGY.md"
        if not ontology.is_file():
            self.add_issue("missing_ontology", "90-System/ONTOLOGY.md", "ontology file is missing", "metadata")
            return set()
        text = ontology.read_text(encoding="utf-8")
        return set(re.findall(r"`((?:domain|topic|status|source|privacy)/[^`]+)`", text))

    def validate_atomicity_review(self) -> None:
        registry_path = self.root / ATOMICITY_REVIEW_PATH
        if not registry_path.is_file():
            self.add_issue(
                "missing_atomicity_review",
                ATOMICITY_REVIEW_PATH,
                "atomicity review registry is missing",
                "atomicity",
            )
            return
        try:
            payload = json.loads(registry_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            self.add_issue(
                "invalid_atomicity_review",
                ATOMICITY_REVIEW_PATH,
                f"cannot read JSON registry: {exc}",
                "atomicity",
            )
            return
        if not isinstance(payload, dict):
            self.add_issue(
                "invalid_atomicity_review",
                ATOMICITY_REVIEW_PATH,
                "registry root must be an object",
                "atomicity",
            )
            return
        if payload.get("version") != 1:
            self.add_issue(
                "invalid_atomicity_version",
                ATOMICITY_REVIEW_PATH,
                "version must equal 1",
                "atomicity",
            )
        review_date = valid_date(payload.get("review_date"))
        if review_date is None:
            self.add_issue(
                "invalid_atomicity_review_date",
                ATOMICITY_REVIEW_PATH,
                "review_date must be YYYY-MM-DD",
                "atomicity",
            )
        elif review_date > self.audit_date.isoformat():
            self.add_issue(
                "future_atomicity_review_date",
                ATOMICITY_REVIEW_PATH,
                "review_date is in the future",
                "atomicity",
            )
        entries = payload.get("entries")
        if not isinstance(entries, dict):
            self.add_issue(
                "invalid_atomicity_entries",
                ATOMICITY_REVIEW_PATH,
                "entries must be an object keyed by canonical path",
                "atomicity",
            )
            return

        expected = {page.rel for page in self.pages}
        actual = {key for key in entries if isinstance(key, str)}
        for missing in sorted(expected - actual):
            self.add_issue(
                "atomicity_review_missing",
                ATOMICITY_REVIEW_PATH,
                f"canonical page lacks atomicity review: {missing}",
                "atomicity",
                target=missing,
            )
        for ghost in sorted(actual - expected):
            self.add_issue(
                "atomicity_review_ghost",
                ATOMICITY_REVIEW_PATH,
                f"review entry is not a current canonical page: {ghost}",
                "atomicity",
                target=ghost,
            )

        by_rel = {page.rel: page for page in self.pages}
        required_fields = {"sha256", "form", "scope", "reviewed_at", "reviewed_by"}
        for key in sorted(expected & actual):
            entry = entries[key]
            if not isinstance(entry, dict):
                self.add_issue(
                    "invalid_atomicity_entry",
                    ATOMICITY_REVIEW_PATH,
                    f"entry must be an object: {key}",
                    "atomicity",
                    target=key,
                )
                continue
            for field_name in sorted(required_fields - set(entry)):
                self.add_issue(
                    "missing_atomicity_field",
                    ATOMICITY_REVIEW_PATH,
                    f"{key} lacks {field_name}",
                    "atomicity",
                    target=key,
                )

            raw_checksum = entry.get("sha256")
            if not isinstance(raw_checksum, str) or SHA256_RE.fullmatch(raw_checksum) is None:
                self.add_issue(
                    "invalid_atomicity_sha256",
                    ATOMICITY_REVIEW_PATH,
                    f"{key} sha256 must be 64 lowercase hexadecimal characters",
                    "atomicity",
                    target=key,
                )
            elif raw_checksum != sha256_file(by_rel[key].path):
                self.add_issue(
                    "atomicity_hash_mismatch",
                    ATOMICITY_REVIEW_PATH,
                    f"review hash does not match current canonical bytes: {key}",
                    "atomicity",
                    target=key,
                )

            form = entry.get("form")
            if form not in ATOMIC_FORMS:
                self.add_issue(
                    "invalid_atomicity_form",
                    ATOMICITY_REVIEW_PATH,
                    f"{key} form must be atomic or entity",
                    "atomicity",
                    target=key,
                )
            else:
                self.atomicity_forms[key] = form

            scope = entry.get("scope")
            if (
                not isinstance(scope, str)
                or len(scope.strip()) < 8
                or "\n" in scope
                or "\r" in scope
            ):
                self.add_issue(
                    "invalid_atomicity_scope",
                    ATOMICITY_REVIEW_PATH,
                    f"{key} scope must be a specific one-line theme of at least 8 characters",
                    "atomicity",
                    target=key,
                )

            reviewed_at = valid_date(entry.get("reviewed_at"))
            if reviewed_at is None:
                self.add_issue(
                    "invalid_atomicity_reviewed_at",
                    ATOMICITY_REVIEW_PATH,
                    f"{key} reviewed_at must be YYYY-MM-DD",
                    "atomicity",
                    target=key,
                )
            else:
                if reviewed_at > self.audit_date.isoformat():
                    self.add_issue(
                        "future_atomicity_reviewed_at",
                        ATOMICITY_REVIEW_PATH,
                        f"{key} reviewed_at is in the future",
                        "atomicity",
                        target=key,
                    )
                if review_date and reviewed_at > review_date:
                    self.add_issue(
                        "atomicity_date_order",
                        ATOMICITY_REVIEW_PATH,
                        f"{key} reviewed_at exceeds registry review_date",
                        "atomicity",
                        target=key,
                    )
            reviewed_by = entry.get("reviewed_by")
            if not isinstance(reviewed_by, str) or not reviewed_by.strip() or "\n" in reviewed_by:
                self.add_issue(
                    "invalid_atomicity_reviewer",
                    ATOMICITY_REVIEW_PATH,
                    f"{key} reviewed_by must be a non-empty one-line string",
                    "atomicity",
                    target=key,
                )

    def validate_atomicity_candidates(self) -> None:
        for page in self.pages:
            substantive = substantive_body(page)
            nonblank_lines = [line for line in substantive.splitlines() if line.strip()]
            h2s = [
                heading.strip()
                for heading in H2_RE.findall(substantive)
                if heading.strip() not in MANAGED_ATOMIC_SECTIONS
            ]
            links = WIKILINK_RE.findall(page.rendered_body)
            prose_chars = prose_character_count(substantive)
            form = self.atomicity_forms.get(page.rel)

            if len(nonblank_lines) > 400:
                self.add_issue(
                    "atomicity_candidate_long_page",
                    page.rel,
                    f"page has {len(nonblank_lines)} non-blank substantive lines; review for report/manual decomposition",
                    "atomicity",
                    severity="warning",
                )
            if len(h2s) > 8:
                self.add_issue(
                    "atomicity_candidate_many_sections",
                    page.rel,
                    f"page has {len(h2s)} substantive H2 sections; verify they share one theme",
                    "atomicity",
                    severity="warning",
                )

            navigation_marker = page.title.endswith("索引") or any(
                marker in page.title
                for marker in ("导航", "总览", "工作体系", "上手流程", "资产概览")
            )
            if len(links) >= 5 and (
                prose_chars < 120 or (navigation_marker and prose_chars < 500)
            ):
                self.add_issue(
                    "atomicity_candidate_pure_navigation",
                    page.rel,
                    f"{len(links)} links but only {prose_chars} substantive prose characters",
                    "atomicity",
                    severity="warning",
                )
            elif form != "entity" and len(links) >= 12 and prose_chars < 300:
                self.add_issue(
                    "atomicity_candidate_high_link_low_prose",
                    page.rel,
                    f"{len(links)} links but only {prose_chars} substantive prose characters",
                    "atomicity",
                    severity="warning",
                )

            normalized_headings = {heading.casefold() for heading in h2s}
            manual_matches = normalized_headings & MANUAL_REPORT_HEADINGS
            title_marker = any(
                marker in page.title.casefold()
                for marker in ("readme", "完整指南", "手册", "会议记录", "时间线", "运行日志")
            )
            dated_bullets = re.findall(
                r"(?m)^-\s+\d{4}-\d{2}-\d{2}[：:]",
                substantive,
            )
            if title_marker or len(manual_matches) >= 3 or len(dated_bullets) >= 6:
                self.add_issue(
                    "atomicity_candidate_readme_or_log",
                    page.rel,
                    "page resembles a README, manual, meeting record, timeline, or running log",
                    "atomicity",
                    severity="warning",
                )

    def validate_links(self) -> None:
        resolver = Resolver(self.root, self.pages)
        by_rel = {page.rel: page for page in self.pages}
        for page in self.pages:
            self.inbound.setdefault(page.rel, set())
            self.outbound.setdefault(page.rel, set())
            relation_text = section(page.rendered_body, "关系")
            source_text = section(page.rendered_body, "来源双链")

            for label in RELATION_LINE_RE.findall(relation_text):
                normalized_label = label.strip()
                if normalized_label not in ALLOWED_RELATIONS:
                    self.add_issue(
                        "unknown_relation_label",
                        page.rel,
                        f"relation label is not controlled: {normalized_label}",
                        "graph",
                        target=normalized_label,
                    )

            labelled_targets: dict[str, list[str]] = defaultdict(list)
            for line in relation_text.splitlines():
                label_match = re.match(r"^-\s+\*\*(.+?)\*\*\s*[：:]", line)
                label = label_match.group(1).strip() if label_match else ""
                for raw in WIKILINK_RE.findall(line):
                    state, matches = resolver.resolve(raw, page.rel, "canonical")
                    target = clean_target(raw)
                    if state == "unresolved":
                        self.add_issue(
                            "unresolved_relation", page.rel, f"unresolved canonical relation: {target}", "graph", target=target
                        )
                    elif state == "ambiguous":
                        self.add_issue(
                            "ambiguous_relation", page.rel, f"ambiguous canonical relation: {target}", "graph", target=target
                        )
                    elif state == "resolved":
                        target_page: Page = matches[0]
                        if target_page.rel == page.rel:
                            self.add_issue("self_loop", page.rel, "canonical relationship points to itself", "graph", target=target)
                        else:
                            self.outbound[page.rel].add(target_page.rel)
                            self.inbound[target_page.rel].add(page.rel)
                            if label in ALLOWED_RELATIONS:
                                page.relation_links[label].add(target_page.rel)
                                labelled_targets[label].append(target_page.rel)

            relation_count = sum(len(targets) for targets in page.relation_links.values())
            if relation_count < 2:
                self.add_issue(
                    "insufficient_relations",
                    page.rel,
                    f"## 关系 contains {relation_count} distinct controlled canonical relations; minimum is 2",
                    "graph",
                )

            for raw in WIKILINK_RE.findall(source_text):
                state, matches = resolver.resolve(raw, page.rel, "source")
                target = clean_target(raw)
                if state == "unresolved":
                    self.add_issue(
                        "unresolved_source_link", page.rel, f"unresolved source link: {target}", "source", target=target
                    )
                elif state == "ambiguous":
                    self.add_issue(
                        "ambiguous_source_link", page.rel, f"ambiguous source link: {target}", "source", target=target
                    )
                elif state == "resolved":
                    page.source_link_paths.add(matches[0].resolve())

            relation_and_source_links = set(WIKILINK_RE.findall(relation_text + "\n" + source_text))
            for raw in WIKILINK_RE.findall(page.rendered_body):
                if raw in relation_and_source_links:
                    continue
                state, _matches = resolver.resolve(raw, page.rel, "any")
                target = clean_target(raw)
                if state == "unresolved":
                    self.add_issue("unresolved_body_link", page.rel, f"unresolved body link: {target}", "graph", target=target)
                elif state == "ambiguous":
                    self.add_issue("ambiguous_body_link", page.rel, f"ambiguous body link: {target}", "graph", target=target)

            self.validate_source_backlinks(page)

        for page in self.pages:
            for parent_rel in page.relation_links.get("上位概念", set()):
                parent = by_rel.get(parent_rel)
                if parent and page.rel not in parent.relation_links.get("组成部分", set()):
                    self.add_issue(
                        "missing_inverse_relation",
                        page.rel,
                        f"上位概念 lacks inverse 组成部分 in {parent_rel}",
                        "graph",
                        target=parent_rel,
                    )
            for child_rel in page.relation_links.get("组成部分", set()):
                child = by_rel.get(child_rel)
                if child and page.rel not in child.relation_links.get("上位概念", set()):
                    self.add_issue(
                        "missing_inverse_relation",
                        page.rel,
                        f"组成部分 lacks inverse 上位概念 in {child_rel}",
                        "graph",
                        target=child_rel,
                    )

        for page in self.pages:
            if not self.inbound[page.rel] and not self.outbound[page.rel]:
                self.add_issue("orphan", page.rel, "page has no canonical graph edges", "graph")
            if not self.inbound[page.rel]:
                self.add_issue("no_inbound", page.rel, "page has no inbound canonical relation", "graph")
            if not self.outbound[page.rel]:
                self.add_issue("no_outbound", page.rel, "page has no outbound canonical relation", "graph")

    def validate_source_backlinks(self, page: Page) -> None:
        source_root = (self.root / "04-Sources").resolve()
        for declaration in page.source_declarations:
            normalized = normalize_declared_source(declaration)
            if is_url(normalized) or normalized.casefold() == "current conversation":
                continue
            resolved = source_path(normalized, self.root)
            if resolved is None or not resolved.exists():
                continue
            # Only vault-local source Markdown can be represented by a stable
            # Obsidian wikilink.  Absolute files outside the vault remain plain
            # provenance paths in YAML, as required by SCHEMA.md.
            try:
                resolved.relative_to(source_root)
            except ValueError:
                continue
            required: list[Path] = []
            if resolved.is_file() and resolved.suffix.casefold() == ".md":
                required = [resolved]
            for required_path in required:
                if required_path not in page.source_link_paths:
                    self.add_issue(
                        "missing_source_backlink",
                        page.rel,
                        f"declared Markdown source lacks ## 来源双链 link: {relpath(required_path, self.root)}",
                        "source",
                        target=relpath(required_path, self.root),
                    )

    def validate_components(self) -> None:
        nodes = {page.rel for page in self.pages}
        adjacency: dict[str, set[str]] = {node: set() for node in nodes}
        for source, targets in self.outbound.items():
            for target in targets:
                adjacency[source].add(target)
                adjacency[target].add(source)
        components: list[list[str]] = []
        unseen = set(nodes)
        while unseen:
            start = min(unseen)
            queue = deque([start])
            unseen.remove(start)
            component: list[str] = []
            while queue:
                current = queue.popleft()
                component.append(current)
                for neighbor in sorted(adjacency[current]):
                    if neighbor in unseen:
                        unseen.remove(neighbor)
                        queue.append(neighbor)
            components.append(sorted(component))
        components.sort(key=lambda item: (-len(item), item[0] if item else ""))
        if len(components) > 1:
            for component in components[1:]:
                self.add_issue(
                    "disconnected_component",
                    component[0],
                    f"weak component has {len(component)} pages",
                    "graph",
                    target=",".join(component[:8]),
                )
        self.counts["weak_components"] = len(components)

    def validate_index(self) -> None:
        index_path = self.root / "90-System/INDEX.md"
        if not index_path.is_file():
            self.add_issue("missing_index", "90-System/INDEX.md", "derived index is missing", "index")
            return
        text = index_path.read_text(encoding="utf-8")
        index_body = markdown_without_fences(text)
        entries = INDEX_PATH_RE.findall(index_body)
        counter = Counter(entries)
        actual = {page.rel for page in self.pages}
        indexed = set(entries)
        for entry, count in sorted(counter.items()):
            if count > 1:
                self.add_issue(
                    "duplicate_index_entry", "90-System/INDEX.md", f"path occurs {count} times: {entry}", "index", target=entry
                )
        for missing in sorted(actual - indexed):
            self.add_issue("index_missing", "90-System/INDEX.md", f"canonical page is not indexed: {missing}", "index", target=missing)
        for ghost in sorted(indexed - actual):
            self.add_issue("index_ghost", "90-System/INDEX.md", f"index path is not canonical: {ghost}", "index", target=ghost)

        for candidate in CODE_PATH_RE.findall(index_body):
            if candidate in indexed or candidate.startswith("90-System/"):
                continue
            suffix_matches = [page.rel for page in self.pages if page.rel.endswith("/" + candidate)]
            if suffix_matches:
                self.add_issue(
                    "malformed_index_path",
                    "90-System/INDEX.md",
                    f"canonical path is missing its domain prefix: {candidate}",
                    "index",
                    target=candidate,
                )

    def build_source_records(self) -> None:
        source_root = self.root / "04-Sources"
        if source_root.is_dir():
            for path in sorted(source_root.rglob("*")):
                if not path.is_file():
                    continue
                if path.name == ".DS_Store":
                    continue
                key = relpath(path, self.root)
                hidden = any(part.startswith(".") for part in path.relative_to(source_root).parts)
                # `04-Sources/Personal` is a provenance category, not a blanket
                # sensitivity label. Keep explicit identity/resume paths and
                # credential-like content conservative without forcing every
                # ordinary personal context source into `敏感保留`.
                sensitive = any(token in key.casefold() for token in ("人物资料", "简历"))
                sensitive = sensitive or file_looks_sensitive(path)
                status = "仅供参考" if hidden else ("敏感保留" if sensitive else "延期")
                reason = "系统/隐藏文件" if hidden else ("隐私敏感来源，保留不展开" if sensitive else "尚未由 canonical 页面声明")
                checksum = sha256_file(path)
                self.source_records[key] = SourceRecord(key, "file", status, reason=reason, checksum=checksum)

        for page in self.pages:
            for declaration in page.source_declarations:
                normalized = normalize_declared_source(declaration)
                if is_url(normalized):
                    record = self.source_records.setdefault(
                        normalized, SourceRecord(normalized, "url", "已编译", reason="canonical frontmatter 声明")
                    )
                    record.status = "已编译"
                    record.reason = "canonical frontmatter 声明"
                    record.consumers.add(page.rel)
                    continue
                if normalized.casefold() == "current conversation":
                    record = self.source_records.setdefault(
                        "Current conversation",
                        SourceRecord("Current conversation", "ephemeral", "延期", reason="尚未保存为持久来源"),
                    )
                    record.consumers.add(page.rel)
                    continue
                resolved = source_path(normalized, self.root)
                if resolved is None or not resolved.exists():
                    continue
                direct_key = relpath(resolved, self.root)
                direct_kind = "directory" if resolved.is_dir() else "file"
                existing = self.source_records.get(direct_key)
                direct_status = "仅供参考" if resolved.is_dir() else (
                    "敏感保留"
                    if (existing is not None and existing.status == "敏感保留") or file_looks_sensitive(resolved)
                    else "已编译"
                )
                direct_reason = (
                    "canonical 声明为来源范围；不代表子文件逐项编译"
                    if resolved.is_dir()
                    else (
                        "来源含隐私或疑似凭据；保留原文但不在 canonical 展开"
                        if direct_status == "敏感保留"
                        else "canonical frontmatter 声明"
                    )
                )
                direct = self.source_records.setdefault(
                    direct_key, SourceRecord(direct_key, direct_kind, direct_status, reason=direct_reason)
                )
                direct.status = direct_status
                direct.reason = direct_reason
                direct.consumers.add(page.rel)
                if resolved.is_file() and direct.checksum == "-":
                    direct.checksum = sha256_file(resolved)

        # Make byte-identical snapshots explicit instead of leaving every
        # unreferenced copy as a generic deferral.  A consumed source remains
        # "已编译"; among entirely unconsumed copies one deterministic primary
        # remains "延期" and the remaining copies point to it.
        by_checksum: dict[str, list[SourceRecord]] = defaultdict(list)
        for record in self.source_records.values():
            if record.kind == "file" and record.checksum != "-":
                by_checksum[record.checksum].append(record)
        for records in by_checksum.values():
            if len(records) < 2:
                continue
            ordered = sorted(
                records,
                key=lambda item: (not bool(item.consumers), item.key.casefold()),
            )
            primary = ordered[0]
            for duplicate in ordered[1:]:
                if duplicate.status == "延期" and not duplicate.consumers:
                    duplicate.status = "重复快照"
                    duplicate.reason = f"SHA-256 与 {primary.key} 相同"

    def validate_source_dispositions(self) -> None:
        disposition_path = self.root / SOURCE_DISPOSITIONS_PATH
        if not disposition_path.is_file():
            self.add_issue(
                "missing_source_dispositions",
                SOURCE_DISPOSITIONS_PATH,
                "manual source disposition registry is missing",
                "source",
            )
            return
        try:
            payload = json.loads(disposition_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            self.add_issue(
                "invalid_source_dispositions",
                SOURCE_DISPOSITIONS_PATH,
                f"cannot read JSON registry: {exc}",
                "source",
            )
            return
        if not isinstance(payload, dict):
            self.add_issue(
                "invalid_source_dispositions",
                SOURCE_DISPOSITIONS_PATH,
                "registry root must be an object",
                "source",
            )
            return
        if payload.get("version") != 1:
            self.add_issue(
                "invalid_source_dispositions_version",
                SOURCE_DISPOSITIONS_PATH,
                "version must equal 1",
                "source",
            )
        entries = payload.get("entries")
        if not isinstance(entries, dict):
            self.add_issue(
                "invalid_source_disposition_entries",
                SOURCE_DISPOSITIONS_PATH,
                "entries must be an object keyed by source key",
                "source",
            )
            return

        expected = {
            key for key, record in self.source_records.items() if record.status != "已编译"
        }
        actual = set(entries)
        for missing in sorted(expected - actual):
            self.add_issue(
                "source_disposition_missing",
                SOURCE_DISPOSITIONS_PATH,
                f"source requires a reviewed manual disposition: {missing}",
                "source",
                target=missing,
            )
        for ghost in sorted(actual - set(self.source_records)):
            self.add_issue(
                "source_disposition_ghost",
                SOURCE_DISPOSITIONS_PATH,
                f"disposition key is not a current source: {ghost}",
                "source",
                target=ghost,
            )
        for compiled in sorted((actual & set(self.source_records)) - expected):
            self.add_issue(
                "source_disposition_for_compiled",
                SOURCE_DISPOSITIONS_PATH,
                f"compiled status is derived; remove manual entry: {compiled}",
                "source",
                target=compiled,
            )

        for key in sorted(actual & expected):
            entry = entries[key]
            if not isinstance(entry, dict):
                self.add_issue(
                    "invalid_source_disposition",
                    SOURCE_DISPOSITIONS_PATH,
                    f"entry must be an object: {key}",
                    "source",
                    target=key,
                )
                continue
            for field_name in ("status", "reason", "reviewed_at", "review_after"):
                if field_name not in entry:
                    self.add_issue(
                        "missing_source_disposition_field",
                        SOURCE_DISPOSITIONS_PATH,
                        f"{key} lacks {field_name}",
                        "source",
                        target=key,
                    )

            status = entry.get("status")
            if status not in MANUAL_DISPOSITION_STATUSES:
                self.add_issue(
                    "invalid_source_disposition_status",
                    SOURCE_DISPOSITIONS_PATH,
                    f"{key} status must be one of {sorted(MANUAL_DISPOSITION_STATUSES)}",
                    "source",
                    target=key,
                )
            else:
                record = self.source_records[key]
                if record.status == "敏感保留" and status != "敏感保留":
                    self.add_issue(
                        "sensitive_source_disposition_mismatch",
                        SOURCE_DISPOSITIONS_PATH,
                        f"{key} contains sensitive material and must remain 敏感保留",
                        "source",
                        target=key,
                    )
                else:
                    record.status = status

            reason = entry.get("reason")
            normalized_reason = reason.strip() if isinstance(reason, str) else ""
            if (
                len(normalized_reason) < 8
                or "\n" in normalized_reason
                or "\r" in normalized_reason
                or normalized_reason.casefold() in PLACEHOLDER_REASONS
            ):
                self.add_issue(
                    "placeholder_source_disposition_reason",
                    SOURCE_DISPOSITIONS_PATH,
                    f"{key} reason must be a specific non-placeholder one-line explanation",
                    "source",
                    target=key,
                )
            else:
                self.source_records[key].reason = normalized_reason

            reviewed_at = valid_date(entry.get("reviewed_at"))
            review_after = valid_date(entry.get("review_after"))
            if reviewed_at is None:
                self.add_issue(
                    "invalid_source_disposition_date",
                    SOURCE_DISPOSITIONS_PATH,
                    f"{key} reviewed_at must be YYYY-MM-DD",
                    "source",
                    target=key,
                )
            elif reviewed_at > self.audit_date.isoformat():
                self.add_issue(
                    "future_source_disposition_review",
                    SOURCE_DISPOSITIONS_PATH,
                    f"{key} reviewed_at is in the future",
                    "source",
                    target=key,
                )
            if review_after is None:
                self.add_issue(
                    "invalid_source_disposition_date",
                    SOURCE_DISPOSITIONS_PATH,
                    f"{key} review_after must be YYYY-MM-DD",
                    "source",
                    target=key,
                )
            elif reviewed_at and review_after < reviewed_at:
                self.add_issue(
                    "source_disposition_date_order",
                    SOURCE_DISPOSITIONS_PATH,
                    f"{key} review_after precedes reviewed_at",
                    "source",
                    target=key,
                )
            elif review_after < self.audit_date.isoformat():
                self.add_issue(
                    "source_disposition_overdue",
                    SOURCE_DISPOSITIONS_PATH,
                    f"{key} manual disposition review was due after {review_after}",
                    "source",
                    target=key,
                )

    def validate_source_coverage(self) -> None:
        coverage_path = self.root / "90-System/SOURCE-COVERAGE.md"
        if not coverage_path.is_file():
            self.add_issue(
                "missing_source_coverage", "90-System/SOURCE-COVERAGE.md", "derived source coverage ledger is missing", "coverage"
            )
            return
        text = coverage_path.read_text(encoding="utf-8")
        rows = source_coverage_rows(text)
        keys: list[str] = []
        parsed: dict[str, tuple[str, str, str, str]] = {}
        for key, kind, raw_status, detail, checksum in rows:
            status = raw_status.strip()
            keys.append(key)
            parsed.setdefault(key, (kind, status, detail, checksum))
            if status not in ALLOWED_COVERAGE_STATUSES:
                self.add_issue(
                    "invalid_coverage_status",
                    "90-System/SOURCE-COVERAGE.md",
                    f"invalid disposition for {key}: {status}",
                    "coverage",
                    target=key,
                )
        counter = Counter(keys)
        expected = set(self.source_records)
        actual = set(keys)
        for key, count in sorted(counter.items()):
            if count > 1:
                self.add_issue(
                    "duplicate_coverage_entry",
                    "90-System/SOURCE-COVERAGE.md",
                    f"source occurs {count} times: {key}",
                    "coverage",
                    target=key,
                )
        for missing in sorted(expected - actual):
            self.add_issue(
                "coverage_missing", "90-System/SOURCE-COVERAGE.md", f"source lacks disposition: {missing}", "coverage", target=missing
            )
        for ghost in sorted(actual - expected):
            self.add_issue(
                "coverage_ghost", "90-System/SOURCE-COVERAGE.md", f"ledger row is not a current source: {ghost}", "coverage", target=ghost
            )
        for key in sorted(expected & actual):
            record = self.source_records[key]
            kind, status, detail, checksum = parsed[key]
            expected_fields = {
                "kind": record.kind,
                "status": record.status,
                "detail": record.detail,
                "sha256": record.checksum,
            }
            actual_fields = {
                "kind": kind,
                "status": status,
                "detail": detail,
                "sha256": checksum,
            }
            for field_name in ("kind", "status", "detail", "sha256"):
                if actual_fields[field_name] != expected_fields[field_name]:
                    self.add_issue(
                        f"coverage_{field_name}_mismatch",
                        "90-System/SOURCE-COVERAGE.md",
                        f"{key} {field_name} does not match compiler output",
                        "coverage",
                        target=key,
                    )
        if text != self.render_source_coverage():
            self.add_issue(
                "source_coverage_not_deterministic",
                "90-System/SOURCE-COVERAGE.md",
                "ledger bytes differ from deterministic compiler output",
                "coverage",
            )

    def run(self) -> dict[str, Any]:
        self.load_pages()
        self.validate_metadata()
        self.validate_links()
        self.validate_components()
        self.validate_index()
        self.build_source_records()
        self.validate_source_dispositions()
        self.validate_source_coverage()
        self.validate_atomicity_review()
        self.validate_atomicity_candidates()
        self.finalize_counts()
        return self.report()

    def finalize_counts(self) -> None:
        issue_counts = Counter(issue.code for issue in self.issues)
        self.counts.update(
            {
                "canonical_pages": len(self.pages),
                "canonical_links": sum(len(targets) for targets in self.outbound.values()),
                "source_links": sum(len(page.source_link_paths) for page in self.pages),
                "source_records": len(self.source_records),
                "errors": sum(issue.severity == "error" for issue in self.issues),
                "warnings": sum(issue.severity == "warning" for issue in self.issues),
                "unresolved_links": sum(code.startswith("unresolved_") for code in issue_counts.elements()),
                "ambiguous_links": sum(code.startswith("ambiguous_") for code in issue_counts.elements()),
                "orphans": issue_counts["orphan"],
                "no_inbound": issue_counts["no_inbound"],
                "no_outbound": issue_counts["no_outbound"],
                "index_missing": issue_counts["index_missing"],
                "index_ghost": issue_counts["index_ghost"],
                "coverage_missing": issue_counts["coverage_missing"],
                "coverage_sha_mismatches": issue_counts["coverage_sha256_mismatch"],
                "missing_source_backlinks": issue_counts["missing_source_backlink"],
                "missing_source_dispositions": (
                    issue_counts["source_disposition_missing"]
                    + (
                        sum(record.status != "已编译" for record in self.source_records.values())
                        if issue_counts["missing_source_dispositions"]
                        else 0
                    )
                ),
                "missing_atomicity_reviews": (
                    issue_counts["atomicity_review_missing"]
                    + (len(self.pages) if issue_counts["missing_atomicity_review"] else 0)
                ),
                "atomicity_candidates": sum(
                    code.startswith("atomicity_candidate_")
                    for code in issue_counts.elements()
                ),
            }
        )

    def report(self) -> dict[str, Any]:
        ordered = sorted(self.issues, key=lambda item: (item.severity, item.phase, item.code, item.path, item.target or ""))
        return {
            "ok": not any(issue.severity == "error" for issue in ordered),
            "mode": "check",
            "root": str(self.root),
            "audit_date": self.audit_date.isoformat(),
            "counts": dict(sorted(self.counts.items())),
            "issues": [asdict(issue) for issue in ordered],
        }

    def can_write_derived(self) -> bool:
        return not any(
            issue.severity == "error" and issue.phase in BLOCKING_DERIVED_PHASES for issue in self.issues
        )

    def render_index(self) -> str:
        created = "2026-06-25"
        old_index = self.root / "90-System/INDEX.md"
        if old_index.is_file():
            frontmatter, _body = split_frontmatter(old_index.read_text(encoding="utf-8"))
            if frontmatter is not None:
                try:
                    old_data = yaml.safe_load(frontmatter) or {}
                    created = valid_date(old_data.get("created")) or created
                except yaml.YAMLError:
                    pass
        group_titles = {
            "01-Knowledge": "Knowledge（知识）",
            "02-Insights": "Insights（感悟）",
            "03-Personal": "Personal（个人信息）",
        }
        lines = [
            "---",
            "type: system/index",
            f"created: {created}",
            f"updated: {self.audit_date.isoformat()}",
            "tags:",
            "  - system/index",
            "---",
            "",
            "# 主图谱索引",
            "",
            "本文件由 `compile_vault.py --write-derived` 根据 canonical frontmatter 确定性生成。",
            "",
        ]
        for domain in CANONICAL_DIRS:
            lines.extend([f"## {group_titles[domain]}", ""])
            domain_pages = [page for page in self.pages if PurePosixPath(page.rel).parts[0] == domain]
            by_subdir: dict[str, list[Page]] = defaultdict(list)
            for page in domain_pages:
                parts = PurePosixPath(page.rel).parts
                subgroup = parts[1] if len(parts) > 2 else "General"
                by_subdir[subgroup].append(page)
            if not by_subdir:
                lines.extend(["- 暂无", ""])
                continue
            for subgroup in sorted(by_subdir, key=str.casefold):
                lines.extend([f"### {subgroup}", ""])
                for page in sorted(by_subdir[subgroup], key=lambda item: item.rel.casefold()):
                    summary = str(page.metadata.get("summary", "")).replace("|", "\\|").replace("\n", " ").strip()
                    lines.append(f"- `{page.rel}`：{summary}")
                lines.append("")
        lines.extend(
            [
                "## 系统参考",
                "",
                "- `90-System/SCHEMA.md`：本库规则",
                "- `90-System/ONTOLOGY.md`：节点、关系和受控标签",
                "- `90-System/WORKFLOWS.md`：维护与全量重编流程",
                "- `90-System/SOURCE-COVERAGE.md`：来源覆盖与处置账本",
                "",
            ]
        )
        return "\n".join(lines)

    def render_source_coverage(self, *, refresh_updated: bool = False) -> str:
        created = self.audit_date.isoformat()
        updated = self.audit_date.isoformat()
        old_path = self.root / "90-System/SOURCE-COVERAGE.md"
        if old_path.is_file():
            frontmatter, _body = split_frontmatter(old_path.read_text(encoding="utf-8"))
            if frontmatter is not None:
                try:
                    old_data = yaml.safe_load(frontmatter) or {}
                    created = valid_date(old_data.get("created")) or created
                    if not refresh_updated:
                        updated = valid_date(old_data.get("updated")) or updated
                except yaml.YAMLError:
                    pass
        lines = [
            "---",
            "type: system/source-coverage",
            f"created: {created}",
            f"updated: {updated}",
            "tags:",
            "  - system/source-coverage",
            "---",
            "",
            "# 来源覆盖账本",
            "",
            "本文件由 `compile_vault.py --write-derived` 生成；已有来源文件不会被修改。",
            "",
            "| 来源 | 类型 | 处置 | Canonical 页面或原因 | SHA-256 |",
            "|---|---|---|---|---|",
        ]
        for key in sorted(self.source_records, key=str.casefold):
            record = self.source_records[key]
            safe_key = key.replace("|", "\\|")
            detail = record.detail.replace("|", "\\|").replace("\n", " ")
            lines.append(
                f"| `{safe_key}` | {record.kind} | {record.status} | {detail} | `{record.checksum}` |"
            )
        lines.append("")
        return "\n".join(lines)


def atomic_write_derived(root: Path, contents: dict[str, str]) -> None:
    allowed = {"90-System/INDEX.md", "90-System/SOURCE-COVERAGE.md"}
    if set(contents) != allowed:
        raise ValueError(f"derived write allowlist violation: {sorted(contents)}")
    root_resolved = root.resolve()
    targets: dict[str, Path] = {}
    originals: dict[str, bytes | None] = {}
    staged: dict[str, Path] = {}
    replaced: list[str] = []
    try:
        for relative, content in contents.items():
            target = (root_resolved / relative).resolve()
            if relpath(target, root_resolved) != relative:
                raise ValueError(f"derived path escaped root: {relative}")
            target.parent.mkdir(parents=True, exist_ok=True)
            targets[relative] = target
            originals[relative] = target.read_bytes() if target.exists() else None
            fd, temp_name = tempfile.mkstemp(prefix=f".{target.name}.", suffix=".tmp", dir=target.parent)
            with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
                handle.write(content)
                handle.flush()
                os.fsync(handle.fileno())
            staged[relative] = Path(temp_name)
        for relative in sorted(contents):
            os.replace(staged[relative], targets[relative])
            replaced.append(relative)
        for target in targets.values():
            with target.open("rb") as handle:
                os.fsync(handle.fileno())
    except Exception:
        for relative in reversed(replaced):
            target = targets[relative]
            original = originals[relative]
            if original is None:
                target.unlink(missing_ok=True)
            else:
                fd, restore_name = tempfile.mkstemp(prefix=f".{target.name}.", suffix=".restore", dir=target.parent)
                with os.fdopen(fd, "wb") as handle:
                    handle.write(original)
                    handle.flush()
                    os.fsync(handle.fileno())
                os.replace(restore_name, target)
        raise
    finally:
        for temp_path in staged.values():
            temp_path.unlink(missing_ok=True)


def text_report(report: dict[str, Any], max_issues: int = 200) -> str:
    counts = report["counts"]
    lines = [
        f"vault={report['root']}",
        f"mode={report['mode']}",
        f"audit_date={report['audit_date']}",
    ]
    lines.extend(f"{key}={value}" for key, value in sorted(counts.items()))
    issues = report["issues"]
    if issues:
        lines.append("")
        lines.append("ISSUES")
        visible = issues if max_issues == 0 else issues[:max_issues]
        for issue in visible:
            target = f" -> {issue['target']}" if issue.get("target") else ""
            lines.append(
                f"- [{issue['severity'].upper()}] {issue['code']} {issue['path']}{target}: {issue['message']}"
            )
        if max_issues and len(issues) > max_issues:
            lines.append(f"- ... {len(issues) - max_issues} more issues omitted; use --format json for the complete list")
    lines.append("COMPILE_OK" if report["ok"] else "COMPILE_FAILED")
    return "\n".join(lines)


def parse_date(value: str) -> dt.date:
    try:
        return dt.date.fromisoformat(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("date must be YYYY-MM-DD") from exc


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="read-only audit (default)")
    mode.add_argument(
        "--write-derived",
        action="store_true",
        help="atomically rebuild only INDEX.md and SOURCE-COVERAGE.md",
    )
    parser.add_argument("--format", choices=("text", "json"), default="text", help="report format")
    parser.add_argument("--root", type=Path, default=SCRIPT_ROOT, help=argparse.SUPPRESS)
    parser.add_argument(
        "--date",
        type=parse_date,
        default=dt.datetime.now(ZoneInfo("Asia/Shanghai")).date(),
        help=argparse.SUPPRESS,
    )
    parser.add_argument("--max-issues", type=int, default=200, help="text issue limit; 0 means unlimited")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    root = args.root.resolve()
    compiler = VaultCompiler(root, args.date)
    report = compiler.run()

    if args.write_derived:
        report["mode"] = "write-derived"
        if not compiler.can_write_derived():
            compiler.add_issue(
                "derived_write_blocked",
                "90-System",
                "canonical metadata, identity, graph, source disposition, and atomicity errors must be fixed before derived files can be rebuilt",
                "derived",
            )
            compiler.finalize_counts()
            report = compiler.report()
            report["mode"] = "write-derived"
        else:
            try:
                atomic_write_derived(
                    root,
                    {
                        "90-System/INDEX.md": compiler.render_index(),
                        "90-System/SOURCE-COVERAGE.md": compiler.render_source_coverage(
                            refresh_updated=True
                        ),
                    },
                )
            except Exception as exc:
                compiler.add_issue("derived_write_failed", "90-System", str(exc), "derived")
                compiler.finalize_counts()
                report = compiler.report()
                report["mode"] = "write-derived"
            else:
                compiler = VaultCompiler(root, args.date)
                report = compiler.run()
                report["mode"] = "write-derived"
                report["written"] = ["90-System/INDEX.md", "90-System/SOURCE-COVERAGE.md"]

    if args.format == "json":
        print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    else:
        print(text_report(report, max_issues=max(args.max_issues, 0)))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
