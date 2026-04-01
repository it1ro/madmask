# Fix: production SMTP env fetch during assets:precompile (2026-04-01)

## Problem

- Docker image build failed on `bundle exec rails assets:precompile` with:
  - `KeyError: key not found: "SMTP_USERNAME"`
- Root cause: `config/environments/production.rb` used `ENV.fetch("SMTP_USERNAME")` / `ENV.fetch("SMTP_PASSWORD")`, and the build environment doesn’t provide these vars.

## What changed (in code)

- `config/environments/production.rb`
  - SMTP config is now **conditional**:
    - If both `SMTP_USERNAME` and `SMTP_PASSWORD` are present → enable deliveries, keep `delivery_method = :smtp`, set `smtp_settings`.
    - Otherwise → disable deliveries and disable delivery errors (so boot and precompile don’t crash).

## Why

- `assets:precompile` loads the Rails production environment during the Docker build, but mail delivery config should not hard-fail when SMTP credentials are absent in that context.

