#!/usr/bin/env python3
"""Compatibility entry point for the unified vault compiler.

Existing automation may keep calling this filename.  All arguments are passed
through unchanged; the default remains a read-only check.
"""

from __future__ import annotations

import sys

from compile_vault import main as compile_main


def main() -> int:
    return compile_main(sys.argv[1:])


if __name__ == "__main__":
    raise SystemExit(main())
