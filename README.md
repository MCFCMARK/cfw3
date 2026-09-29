# WARP Config Generator — Cloudflare Worker (fixed build 1.1)

This build patches the Worker-only version to avoid the generic TLS crash seen on current Cloudflare Workers.

## What changed

- Adds `no_throw_on_not_implemented_tls_options` so Workers ignores unsupported `node:tls` tuning options instead of terminating the request.
- Tries the low-level TLS path first, then the normal Worker `fetch()` path if WARP returns HTTP 403 or the socket path is unavailable.
- Uses the WireGuard configuration returned by registration directly when available, reducing extra WARP API calls.
- Shows the real TLS/WARP error on the webpage instead of only `Could not create the WARP configuration.`
- `/health` now reports build `worker-fix-1.1`.

## Update an existing GitHub/Cloudflare deployment — no Bash needed

If your Worker is already connected to GitHub, the simplest update is to replace these files in your repository using the GitHub website:

1. Replace `src/worker.mjs` with the fixed file from this package.
2. Replace `wrangler.toml` with the fixed file from this package.
3. Commit the changes.
4. Cloudflare Builds should redeploy the Worker automatically.
5. Open `https://YOUR-WORKER.workers.dev/health`. Confirm it shows `"build":"worker-fix-1.1"`.
6. Return to the homepage and try **Create & Download Config** again.

If Cloudflare does not redeploy automatically, open the Worker in the Cloudflare dashboard and use the connected Git deployment controls to redeploy the latest commit.

## Important compatibility note

`wgcf` v2.3.0 (18 September 2026) changed to WARP API `v0a5641` and pins a custom Android TLS ClientHello. Cloudflare Workers does not expose the same low-level uTLS ClientHello control. This fixed build tries the two connection methods available to a Worker and now reports the actual rejection reason.

If the site reports **HTTP 403 after both Worker TLS paths**, the remaining problem is WARP's TLS fingerprint requirement rather than the website code.

## What the Worker does

- Requires the customer to accept Cloudflare's applicable Terms before generation.
- Generates a fresh X25519/WireGuard key pair in memory.
- Registers a fresh WARP device using API `v0a5641`.
- Uses `Fire TV Stick 4K Max 2nd Gen` as the model/name.
- Generates `wgcf-profile.conf` with MTU 1280 and `PersistentKeepalive = 25`.
- Sends the profile directly to the browser and does not write it to application storage.
- Applies a lightweight 45-second per-IP throttle.

## Local tests

The included Node tests check key generation, profile formatting, endpoint parsing, and the HTTP parser. They do not create live WARP registrations.

## Non-affiliation

This project is unofficial and is not affiliated with, authorized by, or endorsed by Cloudflare. Customers should only create registrations in accordance with Cloudflare's applicable terms and usage limits.
