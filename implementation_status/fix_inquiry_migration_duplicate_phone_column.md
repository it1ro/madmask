# Fix: inquiry migration fails on duplicate column (2026-04-01)

## Problem

- Deploy failed during `db:prepare` on the server.
- Error:
  - `SQLite3::SQLException: duplicate column name: phone`
  - Raised by `db/migrate/20260401063729_add_phone_and_email_to_inquiries.rb`.
- Root cause: the production SQLite database already had `inquiries.phone` (and `inquiries.email`), but the migration tried to add them again.

## What changed

- `db/migrate/20260401063729_add_phone_and_email_to_inquiries.rb`
  - Made migration **idempotent**:
    - `add_column` now runs only when the column does not already exist (`column_exists?`).

## Why

- Production DB state may drift (manual changes, partial deploys, restored volumes).
- Idempotent migrations prevent deploys from crashing when schema already matches the intended change.

