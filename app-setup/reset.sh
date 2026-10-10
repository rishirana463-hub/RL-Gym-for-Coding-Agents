#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec node "$HERE/lifecycle.mjs" reset "${SOLUTION_DIR:-$(pwd)}"
