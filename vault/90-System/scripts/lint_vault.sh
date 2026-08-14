#!/usr/bin/env bash
set -uo pipefail

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
vault_root="${VAULT_ROOT:-$(CDPATH= cd -- "$script_dir/../.." && pwd)}"
python_bin="${PYTHON_BIN:-python3}"

failures=0
failed_sections=()

run_gate() {
  local label="$1"
  shift
  printf '\n== %s ==\n' "$label"
  "$@"
  local status=$?
  if [ "$status" -ne 0 ]; then
    failures=$((failures + 1))
    failed_sections+=("$label:$status")
  fi
}

run_gate "Static configuration and content gates" \
  "$python_bin" "$script_dir/lint_static.py" --root "$vault_root"

run_gate "Unified canonical compiler" \
  "$python_bin" "$script_dir/compile_vault.py" --root "$vault_root" --check

printf '\n== Summary ==\n'
if [ "$failures" -eq 0 ]; then
  printf '%s\n' "LINT_OK"
  exit 0
fi

printf 'LINT_FAILED sections=%d\n' "$failures"
printf 'FAILED_SECTION %s\n' "${failed_sections[@]}"
exit 1
