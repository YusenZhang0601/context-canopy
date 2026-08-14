#!/usr/bin/env python3
"""Static non-semantic gates used by lint_vault.sh.

Example text in YAML frontmatter, fenced code, inline code, LINT history,
reports, templates, source snapshots, legacy scripts, and test fixtures is not
treated as active content.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Sequence

from compile_vault import CANONICAL_DIRS, visible_markdown


EXPECTED_GRAPH_FILTER = "path:01-Knowledge OR path:02-Insights OR path:03-Personal"
PATCH_MARKER_RE = re.compile(r"\*\*\*\s+(?:Add|Update|Delete)\s+File")
WIKILINK_RE = re.compile(r"(?<!!)\[\[[^\]\n]+\]\]")
MANAGEMENT_DIRS = (
    "00-Inbox",
    "05-Queries",
    "10-Projects",
    "20-Areas",
    "30-Resources",
    "40-Daily",
    "60-Reviews",
)
PATCH_SCAN_DIRS = (*MANAGEMENT_DIRS, "80-Archive")
ROOT_MANAGEMENT = ("AGENTS.md", "Home.md", "04-Sources/README.md")


def relative(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def active_markdown(root: Path) -> list[Path]:
    paths: set[Path] = set()
    for directory in (*CANONICAL_DIRS, *PATCH_SCAN_DIRS):
        base = root / directory
        if base.is_dir():
            paths.update(path for path in base.rglob("*.md") if path.is_file())
    for name in ROOT_MANAGEMENT:
        path = root / name
        if path.is_file():
            paths.add(path)
    system = root / "90-System"
    if system.is_dir():
        for path in system.glob("*.md"):
            upper = path.name.upper()
            if path.name == "LINT.md" or "REPORT" in upper:
                continue
            paths.add(path)
    return sorted(paths, key=lambda path: relative(path, root))


def management_markdown(root: Path) -> list[Path]:
    paths: set[Path] = set()
    for directory in MANAGEMENT_DIRS:
        base = root / directory
        if base.is_dir():
            paths.update(path for path in base.rglob("*.md") if path.is_file())
    for name in ROOT_MANAGEMENT:
        path = root / name
        if path.is_file():
            paths.add(path)
    for name in ("90-System/SCHEMA.md", "90-System/ONTOLOGY.md", "90-System/WORKFLOWS.md"):
        path = root / name
        if path.is_file():
            paths.add(path)
    return sorted(paths, key=lambda path: relative(path, root))


def run(root: Path) -> list[str]:
    failures: list[str] = []
    obsidian = root / ".obsidian"
    if not obsidian.is_dir():
        failures.append("JSON_CONFIG .obsidian directory is missing")
    else:
        json_paths = sorted(path for path in obsidian.rglob("*.json") if path.is_file())
        if not json_paths:
            failures.append("JSON_CONFIG no .obsidian JSON files found")
        for path in json_paths:
            try:
                json.loads(path.read_text(encoding="utf-8"))
            except (OSError, UnicodeError, json.JSONDecodeError) as exc:
                failures.append(f"JSON_CONFIG {relative(path, root)}: {exc}")

    graph_path = obsidian / "graph.json"
    if graph_path.is_file():
        try:
            graph = json.loads(graph_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError):
            graph = None
        if isinstance(graph, dict):
            if graph.get("search") != EXPECTED_GRAPH_FILTER:
                failures.append(
                    f"GRAPH_FILTER expected {EXPECTED_GRAPH_FILTER!r}, found {graph.get('search')!r}"
                )
            if graph.get("hideUnresolved") is not False:
                failures.append("GRAPH_UNRESOLVED hideUnresolved must be false during graph maintenance")

    for path in active_markdown(root):
        rendered = visible_markdown(path.read_text(encoding="utf-8"))
        if PATCH_MARKER_RE.search(rendered):
            failures.append(f"PATCH_MARKER {relative(path, root)}")

    for path in management_markdown(root):
        rendered = visible_markdown(path.read_text(encoding="utf-8"))
        if WIKILINK_RE.search(rendered):
            failures.append(f"MANAGEMENT_WIKILINK {relative(path, root)}")

    return failures


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    failures = run(args.root.resolve())
    if failures:
        for failure in failures:
            print(failure)
        print(f"STATIC_FAILED failures={len(failures)}")
        return 1
    print("JSON_CONFIG_OK")
    print("GRAPH_CONFIG_OK")
    print("NO_PATCH_MARKER_LEAKS")
    print("NO_MANAGEMENT_WIKILINKS")
    print("STATIC_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
