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

