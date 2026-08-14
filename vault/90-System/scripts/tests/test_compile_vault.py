from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1]
FIXTURE = Path(__file__).resolve().parent / "fixtures/healthy_vault"
COMPILE = SCRIPTS / "compile_vault.py"
AUDIT = SCRIPTS / "audit_graph_semantics.py"
LINT = SCRIPTS / "lint_vault.sh"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def snapshot(root: Path) -> dict[str, tuple[str, int]]:
    return {
        path.relative_to(root).as_posix(): (digest(path), path.stat().st_mtime_ns)
        for path in root.rglob("*")
        if path.is_file()
    }


class CompileVaultTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name) / "vault"
        shutil.copytree(FIXTURE, self.root)

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def run_compile(self, *args: str) -> subprocess.CompletedProcess[str]:
        return self.run_compile_at("2026-07-19", *args)

    def run_compile_at(
        self,
        audit_date: str,
        *args: str,
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [
                sys.executable,
                str(COMPILE),
                "--root",
                str(self.root),
                "--date",
                audit_date,
                *args,
            ],
            text=True,
            capture_output=True,
            check=False,
        )

    def refresh_atomicity(self, *relative_paths: str, form: str | None = None) -> None:
        registry_path = self.root / "90-System/ATOMICITY-REVIEW.json"
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
        for relative in relative_paths:
            registry["entries"][relative]["sha256"] = digest(self.root / relative)
            if form is not None:
                registry["entries"][relative]["form"] = form
        registry_path.write_text(
            json.dumps(registry, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )

    def set_disposition(
        self,
        key: str,
        status: str,
        reason: str,
        *,
        reviewed_at: str = "2026-07-19",
        review_after: str = "2026-10-19",
    ) -> None:
        registry_path = self.root / "90-System/SOURCE-DISPOSITIONS.json"
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
        registry["entries"][key] = {
            "status": status,
            "reason": reason,
            "reviewed_at": reviewed_at,
            "review_after": review_after,
        }
        registry_path.write_text(
            json.dumps(registry, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )

    def test_default_check_is_read_only_and_ignores_code_examples(self) -> None:
        before = snapshot(self.root)
        result = self.run_compile("--format", "json")
        after = snapshot(self.root)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        report = json.loads(result.stdout)
        self.assertTrue(report["ok"])
        self.assertEqual(report["counts"]["unresolved_links"], 0)
        self.assertEqual(report["counts"]["ambiguous_links"], 0)
        self.assertEqual(before, after)

    def test_alias_and_full_path_resolution_form_one_component(self) -> None:
        result = self.run_compile("--check", "--format", "json")
        report = json.loads(result.stdout)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(report["counts"]["canonical_pages"], 3)
        self.assertEqual(report["counts"]["weak_components"], 1)
        self.assertEqual(report["counts"]["no_inbound"], 0)
        self.assertEqual(report["counts"]["no_outbound"], 0)

    def test_fixture_last_checked_matches_pinned_audit_date(self) -> None:
        for topic in ("TopicA.md", "TopicB.md", "TopicC.md"):
            text = (self.root / "01-Knowledge" / topic).read_text(encoding="utf-8")
            self.assertIn("last_checked: 2026-07-19", text)
            self.assertNotIn("last_checked: 2026-07-20", text)

    def test_exact_coverage_does_not_require_daily_rewrite(self) -> None:
        result = self.run_compile_at("2026-07-25", "--check", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertNotIn(
            "source_coverage_not_deterministic",
            {issue["code"] for issue in json.loads(result.stdout)["issues"]},
        )

    def test_valid_current_uses_review_after_instead_of_same_day_check(self) -> None:
        topic_a = self.root / "01-Knowledge/TopicA.md"
        topic_a.write_text(
            topic_a.read_text(encoding="utf-8").replace(
                "freshness: timeless\nlast_checked: 2026-07-19\n",
                "freshness: current\nlast_checked: 2026-07-19\nreview_after: 2026-07-26\n",
            ),
            encoding="utf-8",
        )
        self.refresh_atomicity("01-Knowledge/TopicA.md")
        result = self.run_compile("--check", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_expired_current_and_noncurrent_review_after_are_rejected(self) -> None:
        topic_a = self.root / "01-Knowledge/TopicA.md"
        topic_a.write_text(
            topic_a.read_text(encoding="utf-8").replace(
                "freshness: timeless\nlast_checked: 2026-07-19\n",
                "freshness: current\nlast_checked: 2026-07-10\nreview_after: 2026-07-18\n",
            ),
            encoding="utf-8",
        )
        self.refresh_atomicity("01-Knowledge/TopicA.md")
        expired = self.run_compile("--check", "--format", "json")
        self.assertEqual(expired.returncode, 1)
        self.assertIn("expired_current", {issue["code"] for issue in json.loads(expired.stdout)["issues"]})

        topic_a.write_text(
            topic_a.read_text(encoding="utf-8").replace(
                "freshness: current\n",
                "freshness: stale\n",
            ),
            encoding="utf-8",
        )
        self.refresh_atomicity("01-Knowledge/TopicA.md")
        stale = self.run_compile("--check", "--format", "json")
        self.assertIn(
            "unexpected_review_after",
            {issue["code"] for issue in json.loads(stale.stdout)["issues"]},
        )

    def test_write_derived_changes_only_allowlisted_files(self) -> None:
        index = self.root / "90-System/INDEX.md"
        coverage = self.root / "90-System/SOURCE-COVERAGE.md"
        index.write_text("broken\n", encoding="utf-8")
        coverage.write_text("broken\n", encoding="utf-8")
        before = snapshot(self.root)
        result = self.run_compile("--write-derived", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        report = json.loads(result.stdout)
        self.assertEqual(
            report["written"],
            ["90-System/INDEX.md", "90-System/SOURCE-COVERAGE.md"],
        )
        after = snapshot(self.root)
        changed = {
            path
            for path in before
            if before[path][0] != after[path][0]
        }
        self.assertEqual(changed, {"90-System/INDEX.md", "90-System/SOURCE-COVERAGE.md"})
        final_check = self.run_compile("--check", "--format", "json")
        self.assertEqual(final_check.returncode, 0, final_check.stdout + final_check.stderr)

    def test_external_markdown_source_does_not_require_obsidian_backlink(self) -> None:
        external = Path(self.tempdir.name) / "external-authority.md"
        external.write_text("# External authority\n", encoding="utf-8")
        topic_a = self.root / "01-Knowledge/TopicA.md"
        topic_a.write_text(
            topic_a.read_text(encoding="utf-8").replace(
                "  - 04-Sources/SourceA.md\n",
                f"  - 04-Sources/SourceA.md\n  - {external.as_posix()}\n",
            ),
            encoding="utf-8",
        )
        self.refresh_atomicity("01-Knowledge/TopicA.md")
        result = self.run_compile("--write-derived", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        report = json.loads(result.stdout)
        external_backlink_issues = [
            issue
            for issue in report["issues"]
            if issue["code"] == "missing_source_backlink"
            and issue.get("target") == external.as_posix()
        ]
        self.assertEqual(external_backlink_issues, [])

    def test_directory_source_is_scope_not_implicit_child_compilation(self) -> None:
        bundle = self.root / "04-Sources/Bundle"
        bundle.mkdir()
        child = bundle / "Uncompiled.md"
        child.write_text("# Uncompiled child\n", encoding="utf-8")
        topic_a = self.root / "01-Knowledge/TopicA.md"
        topic_a.write_text(
            topic_a.read_text(encoding="utf-8").replace(
                "  - 04-Sources/SourceA.md\n",
                "  - 04-Sources/SourceA.md\n  - 04-Sources/Bundle\n",
            ),
            encoding="utf-8",
        )
        self.refresh_atomicity("01-Knowledge/TopicA.md")
        self.set_disposition(
            "04-Sources/Bundle",
            "仅供参考",
            "目录仅界定本次证据范围，不代表其中子文件已逐项编译。",
        )
        self.set_disposition(
            "04-Sources/Bundle/Uncompiled.md",
            "延期",
            "该子文件尚未形成独立可复用主张，保留到下一轮主题审查。",
        )
        result = self.run_compile("--write-derived", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        report = json.loads(result.stdout)
        self.assertNotIn("missing_source_backlink", {issue["code"] for issue in report["issues"]})
        coverage = (self.root / "90-System/SOURCE-COVERAGE.md").read_text(encoding="utf-8")
        child_row = next(line for line in coverage.splitlines() if "04-Sources/Bundle/Uncompiled.md" in line)
        self.assertIn("| 延期 |", child_row)

    def test_unconsumed_byte_identical_source_is_marked_duplicate_snapshot(self) -> None:
        source = self.root / "04-Sources/SourceA.md"
        duplicate = self.root / "04-Sources/SourceA-copy.md"
        duplicate.write_bytes(source.read_bytes())
        self.set_disposition(
            "04-Sources/SourceA-copy.md",
            "重复快照",
            "文件字节与 04-Sources/SourceA.md 完全相同，仅保留作迁移完整性核验。",
        )
        result = self.run_compile("--write-derived", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        coverage = (self.root / "90-System/SOURCE-COVERAGE.md").read_text(encoding="utf-8")
        duplicate_row = next(line for line in coverage.splitlines() if "04-Sources/SourceA-copy.md" in line)
        self.assertIn("| 重复快照 |", duplicate_row)
        self.assertIn("04-Sources/SourceA.md", duplicate_row)

    def test_unconsumed_source_requires_specific_reviewed_disposition(self) -> None:
        source = self.root / "04-Sources/Unreviewed.md"
        source.write_text("# Unreviewed evidence\n", encoding="utf-8")
        missing = self.run_compile("--check", "--format", "json")
        self.assertIn(
            "source_disposition_missing",
            {issue["code"] for issue in json.loads(missing.stdout)["issues"]},
        )

        self.set_disposition("04-Sources/Unreviewed.md", "延期", "延期")
        placeholder = self.run_compile("--check", "--format", "json")
        self.assertIn(
            "placeholder_source_disposition_reason",
            {issue["code"] for issue in json.loads(placeholder.stdout)["issues"]},
        )

    def test_ds_store_is_not_a_source_record(self) -> None:
        (self.root / "04-Sources/.DS_Store").write_bytes(b"finder metadata")
        result = self.run_compile("--check", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        report = json.loads(result.stdout)
        self.assertEqual(report["counts"]["source_records"], 3)

    def test_source_coverage_sha_drift_is_reported(self) -> None:
        coverage = self.root / "90-System/SOURCE-COVERAGE.md"
        coverage.write_text(
            coverage.read_text(encoding="utf-8").replace(
                "dad1719872962d2dc63e5ad95dc47bdabd69079822b347ae063f5c81ae149103",
                "0" * 64,
            ),
            encoding="utf-8",
        )
        result = self.run_compile("--check", "--format", "json")
        self.assertEqual(result.returncode, 1)
        codes = {issue["code"] for issue in json.loads(result.stdout)["issues"]}
        self.assertIn("coverage_sha256_mismatch", codes)
        self.assertIn("source_coverage_not_deterministic", codes)

    def test_source_coverage_fields_must_match_compiler_output(self) -> None:
        coverage = self.root / "90-System/SOURCE-COVERAGE.md"
        coverage.write_text(
            coverage.read_text(encoding="utf-8").replace(
                "| file | 已编译 | `01-Knowledge/TopicA.md` |",
                "| directory | 延期 | wrong consumer |",
                1,
            ),
            encoding="utf-8",
        )
        result = self.run_compile("--check", "--format", "json")
        self.assertEqual(result.returncode, 1)
        codes = {issue["code"] for issue in json.loads(result.stdout)["issues"]}
        self.assertIn("coverage_kind_mismatch", codes)
        self.assertIn("coverage_status_mismatch", codes)
        self.assertIn("coverage_detail_mismatch", codes)

    def test_physical_source_migration_can_rebuild_exact_coverage(self) -> None:
        old_source = self.root / "04-Sources/SourceA.md"
        new_source = self.root / "04-Sources/Knowledge/SourceA.md"
        new_source.parent.mkdir()
        old_source.rename(new_source)
        topic_a = self.root / "01-Knowledge/TopicA.md"
        topic_a.write_text(
            topic_a.read_text(encoding="utf-8").replace(
                "04-Sources/SourceA",
                "04-Sources/Knowledge/SourceA",
            ),
            encoding="utf-8",
        )
        self.refresh_atomicity("01-Knowledge/TopicA.md")
        result = self.run_compile("--write-derived", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        final_check = self.run_compile("--check", "--format", "json")
        self.assertEqual(final_check.returncode, 0, final_check.stdout + final_check.stderr)
        report = json.loads(final_check.stdout)
        self.assertEqual(report["counts"]["coverage_sha_mismatches"], 0)

    def test_likely_secret_source_is_retained_as_sensitive_without_value_leak(self) -> None:
        sensitive = self.root / "04-Sources/credential-note.md"
        sensitive.write_text("api_key: TEST_SECRET_PLACEHOLDER\n", encoding="utf-8")
        self.set_disposition(
            "04-Sources/credential-note.md",
            "敏感保留",
            "来源含疑似凭据，只保留原始审计证据且不得复制到 canonical。",
        )
        result = self.run_compile("--write-derived", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        coverage = (self.root / "90-System/SOURCE-COVERAGE.md").read_text(encoding="utf-8")
        row = next(line for line in coverage.splitlines() if "04-Sources/credential-note.md" in line)
        self.assertIn("| 敏感保留 |", row)
        self.assertNotIn("TEST_SECRET_PLACEHOLDER", coverage)

    def test_consumed_personal_profile_source_without_secret_is_compiled(self) -> None:
        personal = self.root / "04-Sources/Personal/Imported/profile-context.md"
        personal.parent.mkdir(parents=True)
        personal.write_text("# Personal context\n\nPrivate working profile without credentials.\n", encoding="utf-8")
        topic_a = self.root / "01-Knowledge/TopicA.md"
        topic_a.write_text(
            topic_a.read_text(encoding="utf-8")
            .replace(
                "  - 04-Sources/SourceA.md\n",
                "  - 04-Sources/SourceA.md\n  - 04-Sources/Personal/Imported/profile-context.md\n",
            )
            .replace(
                "- [[04-Sources/SourceA|Source A]]\n",
                "- [[04-Sources/SourceA|Source A]]\n"
                "- [[04-Sources/Personal/Imported/profile-context.md|Personal context]]\n",
            ),
            encoding="utf-8",
        )
        self.refresh_atomicity("01-Knowledge/TopicA.md")
        result = self.run_compile("--write-derived", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        coverage = (self.root / "90-System/SOURCE-COVERAGE.md").read_text(encoding="utf-8")
        row = next(line for line in coverage.splitlines() if "profile-context.md" in line)
        self.assertIn("| 已编译 |", row)
        self.assertNotIn("| 敏感保留 |", row)

    def test_likely_secret_in_canonical_blocks_without_echoing_value(self) -> None:
        topic_a = self.root / "01-Knowledge/TopicA.md"
        secret = "987654321"
        topic_a.write_text(
            topic_a.read_text(encoding="utf-8") + f"\n内部密码: {secret}\n",
            encoding="utf-8",
        )
        result = self.run_compile("--check", "--format", "json")
        self.assertEqual(result.returncode, 1)
        self.assertNotIn(secret, result.stdout + result.stderr)
        report = json.loads(result.stdout)
        self.assertIn("possible_secret_in_canonical", {issue["code"] for issue in report["issues"]})

    def test_mutable_management_page_cannot_be_canonical_evidence(self) -> None:
        topic_a = self.root / "01-Knowledge/TopicA.md"
        topic_a.write_text(
            topic_a.read_text(encoding="utf-8").replace(
                "  - 04-Sources/SourceA.md\n",
                "  - 04-Sources/SourceA.md\n  - 90-System/INDEX.md\n",
            ),
            encoding="utf-8",
        )
        self.refresh_atomicity("01-Knowledge/TopicA.md")
        result = self.run_compile("--check", "--format", "json")
        self.assertEqual(result.returncode, 1)
        self.assertIn(
            "mutable_management_source",
            {issue["code"] for issue in json.loads(result.stdout)["issues"]},
        )

    def test_atomicity_registry_detects_missing_stale_and_invalid_entries(self) -> None:
        registry_path = self.root / "90-System/ATOMICITY-REVIEW.json"
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
        registry["entries"].pop("01-Knowledge/TopicB.md")
        registry["entries"]["01-Knowledge/TopicA.md"]["form"] = "report"
        registry["entries"]["01-Knowledge/TopicA.md"]["scope"] = "x"
        registry_path.write_text(
            json.dumps(registry, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        topic_c = self.root / "01-Knowledge/TopicC.md"
        topic_c.write_text(topic_c.read_text(encoding="utf-8") + "\nChanged.\n", encoding="utf-8")
        result = self.run_compile("--check", "--format", "json")
        self.assertEqual(result.returncode, 1)
        codes = {issue["code"] for issue in json.loads(result.stdout)["issues"]}
        self.assertIn("atomicity_review_missing", codes)
        self.assertIn("invalid_atomicity_form", codes)
        self.assertIn("invalid_atomicity_scope", codes)
        self.assertIn("atomicity_hash_mismatch", codes)

    def test_atomicity_candidate_heuristics_warn_but_do_not_replace_review(self) -> None:
        topic_a = self.root / "01-Knowledge/TopicA.md"
        topic_a.write_text(
            topic_a.read_text(encoding="utf-8")
            + "\n## 导航\n\n"
            + "\n".join("- [[TopicB]]" for _ in range(6))
            + "\n",
            encoding="utf-8",
        )
        self.refresh_atomicity("01-Knowledge/TopicA.md")
        result = self.run_compile("--check", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        report = json.loads(result.stdout)
        self.assertGreater(report["counts"]["atomicity_candidates"], 0)
        self.assertIn(
            "atomicity_candidate_pure_navigation",
            {issue["code"] for issue in report["issues"]},
        )

    def test_readme_style_large_card_is_an_atomicity_candidate(self) -> None:
        topic_a = self.root / "01-Knowledge/TopicA.md"
        manual = (
            "\n## Installation\n\nInstall all components.\n"
            "\n## Usage\n\nRun every workflow.\n"
            "\n## Configuration\n\nConfigure every option.\n"
        )
        long_report = "\n".join(f"- Report line {index}" for index in range(401))
        topic_a.write_text(
            topic_a.read_text(encoding="utf-8") + manual + "\n" + long_report + "\n",
            encoding="utf-8",
        )
        self.refresh_atomicity("01-Knowledge/TopicA.md")
        result = self.run_compile("--check", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        codes = {issue["code"] for issue in json.loads(result.stdout)["issues"]}
        self.assertIn("atomicity_candidate_readme_or_log", codes)
        self.assertIn("atomicity_candidate_long_page", codes)

    def test_compliant_entity_review_is_allowed(self) -> None:
        self.refresh_atomicity("01-Knowledge/TopicA.md", form="entity")
        result = self.run_compile("--check", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_ambiguous_alias_is_reported_and_blocks_derived_write(self) -> None:
        topic_c = self.root / "01-Knowledge/TopicC.md"
        text = topic_c.read_text(encoding="utf-8").replace("  - Gamma", "  - Gamma\n  - Alpha")
        topic_c.write_text(text, encoding="utf-8")
        result = self.run_compile("--write-derived", "--format", "json")
        report = json.loads(result.stdout)
        codes = {issue["code"] for issue in report["issues"]}
        self.assertEqual(result.returncode, 1)
        self.assertIn("ambiguous_identity", codes)
        self.assertIn("derived_write_blocked", codes)

    def test_compatibility_entrypoint_delegates_to_compiler(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(AUDIT),
                "--root",
                str(self.root),
                "--date",
                "2026-07-19",
                "--format",
                "json",
            ],
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue(json.loads(result.stdout)["ok"])

    def test_lint_aggregates_static_and_compile_failures(self) -> None:
        graph = self.root / ".obsidian/graph.json"
        graph.write_text('{"search": "", "hideUnresolved": true}\n', encoding="utf-8")
        topic_a = self.root / "01-Knowledge/TopicA.md"
        topic_a.write_text(
            topic_a.read_text(encoding="utf-8").replace("aliases:\n  - Alpha\n", ""),
            encoding="utf-8",
        )
        environment = os.environ.copy()
        environment["VAULT_ROOT"] = str(self.root)
        result = subprocess.run(
            ["bash", str(LINT)],
            text=True,
            capture_output=True,
            check=False,
            env=environment,
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn("STATIC_FAILED", result.stdout)
        self.assertIn("COMPILE_FAILED", result.stdout)
        self.assertIn("LINT_FAILED sections=2", result.stdout)

    def test_retired_migrations_are_hard_blocked(self) -> None:
        for name in ("rebuild_main_graph.py",):
            result = subprocess.run(
                [sys.executable, str(SCRIPTS / name)],
                text=True,
                capture_output=True,
                check=False,
            )
            self.assertEqual(result.returncode, 2)
            self.assertIn("BLOCKED", result.stderr)


if __name__ == "__main__":
    unittest.main()
