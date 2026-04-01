## Context

During Kamal deploy, Docker image build failed at `assets:precompile` with:

- `NameError: uninitialized constant CanonicalHostRedirect`
- triggered from `config/environments/production.rb` where middleware was inserted.

## Root cause

`CanonicalHostRedirect` is defined in `lib/middleware/canonical_host_redirect.rb`, but `production.rb`
referenced the constant before it was loaded during boot (which happens during `assets:precompile` too).

## Fix

- Explicitly `require` the middleware in `config/environments/production.rb` before inserting it.
- Add `Rails.root.join("lib")` to `config.eager_load_paths` in `config/application.rb` for consistency in production.

## Result

`assets:precompile` should no longer crash due to missing `CanonicalHostRedirect` during image build.

## Follow-up (2026-04-01): Kamal healthcheck /up got 301

### Symptom

Kamal deploy failed with "target failed to become healthy". Container logs showed `/up` returning `301 Moved Permanently`.

### Root cause

`CanonicalHostRedirect` redirected any request whose `Host` differs from the canonical host. Kamal/proxy healthchecks hit the app via `127.0.0.1`/internal host, so `/up` was redirected to the canonical domain, resulting in a 301.

### Fix

Skip canonical-host redirects for the health endpoint by short-circuiting in `Middleware::CanonicalHostRedirect` when `req.path == "/up"`.

