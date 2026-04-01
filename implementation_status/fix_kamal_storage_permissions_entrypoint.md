# Fix Kamal deploy: storage permissions prevent boot

## Problem
During Kamal deploy the `web` container became **unhealthy** because the health check could not connect to `127.0.0.1:3000`.  
The image `CMD` runs `bin/rails db:prepare` before starting Puma; in production the SQLite databases live under `/rails/storage`. When the host-mounted volume (`/var/lib/madmask/storage`) is owned by `root` (common on first deploy), the app user (`rails`, uid 1000) can’t write there, `db:prepare` fails, and the server never starts.

## Solution
- Added a production entrypoint that:
  - creates `/rails/storage`, `/rails/tmp`, `/rails/log` if missing
  - when running as `root`, fixes ownership to `rails:rails`
  - then drops privileges and runs the original command as `rails`
- Installed `gosu` in the final stage to safely drop privileges.

## Changes
- `Dockerfile`
  - install `gosu`
  - set `ENTRYPOINT ["bin/docker-entrypoint"]`
  - keep the existing healthcheck and `CMD`
- `bin/docker-entrypoint`
  - new entrypoint script (must be executable)

## Notes / Ops
- This makes the image resilient to a first-time, root-owned `/var/lib/madmask/storage` on the server.
- If you prefer to keep containers non-root at all times, the alternative is to ensure on the host:
  - `mkdir -p /var/lib/madmask/storage && chown -R 1000:1000 /var/lib/madmask/storage`

