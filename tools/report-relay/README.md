# Report relay (optional)

A single Cloudflare Worker that turns a bug report from the game into a GitHub issue, so players never
need a GitHub account and never see a paste step.

Without it, the game copies the report to the clipboard and opens the GitHub bug form. That works and
ships by default. This is only if you want one-click reporting.

## Deploy

```bash
npm create cloudflare@latest rf-report-relay -- --type hello-world
cd rf-report-relay
# copy worker.js over src/index.js
npx wrangler secret put GITHUB_TOKEN     # fine-grained token, this repo only, Issues: read and write
npx wrangler deploy
```

Rate limiting is required: create a KV namespace and bind it as `RATE` in `wrangler.toml`. The relay
address ships inside the game, so it is public, and without the binding the relay refuses every report
(503). It allows 5 reports an hour per IP and 150 a day in total.

## Point the game at it

In `game/version.js`, below the version line:

```js
window.RF_REPORT_ENDPOINT = 'https://<your-worker>.workers.dev/report';
```

`tools/sync-version.js` rewrites that file, so add the line to the generator if you want it to survive
`npm run check`.

## What it does

- Refuses anything over 400 kB, or more than five reports an hour from one address.
- Files the issue with `bug`, `player-report`, `needs-triage`, `via-relay`, an `area:` label, a
  `severity:` label, and `has-savegame` when a save is attached.
- Assigns TheCodingDad-TisonK and returns the issue URL to the game.
- The token never leaves the worker.
