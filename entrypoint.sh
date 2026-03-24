#!/usr/bin/env bash
set -euo pipefail

cd /app

if [[ -f Gemfile ]]; then
  bundle check || bundle install
fi

# After `rails new` (iteration 1), ensure SQLite exists and migrations are applied.
if [[ -f bin/rails ]]; then
  bin/rails db:prepare
fi

exec "$@"
