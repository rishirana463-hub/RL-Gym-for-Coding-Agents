#!/usr/bin/env bash
set -euo pipefail
cd -- "${SOLUTION_DIR:-$(pwd)}"
exec node server.mjs
