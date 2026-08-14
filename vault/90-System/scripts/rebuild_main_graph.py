#!/usr/bin/env python3
"""Safety stub for the retired one-shot graph rebuild.

The historical implementation is preserved under ``legacy/`` for audit only.
It must never be imported or executed by normal maintenance commands.
"""

from __future__ import annotations

import sys


MESSAGE = (
    "BLOCKED: rebuild_main_graph.py is a retired destructive migration. "
    "Its implementation is preserved at "
    "90-System/scripts/legacy/rebuild_main_graph.py for audit only. "
    "Use compile_vault.py --check, then compile_vault.py --write-derived."
)


def main() -> int:
    print(MESSAGE, file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
