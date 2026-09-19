# Reporting bugs

## For players

Press **F7** in the game, or use **Report a bug** in the pause menu or on the main menu.

A form opens. Give it a short title, say what happened, and pick from the dropdowns. Everything else is optional. Then press **Send the report** and follow the two steps it shows you.

**What gets sent**

- What you typed, and the choices you made.
- What the game knows: version, your system and screen size, your settings, which room you were in, your money and day, and any script errors the game recorded.
- Your **savegame**, if you leave that box ticked. It is compressed and lets the developer load your exact shop, which is by far the fastest way to get something fixed. Untick it if you would rather not.
- Your lifetime stats and the last 25 events, if you leave that box ticked.

**What never gets sent:** your name, your email, or any file from your PC. Press **Preview what will be sent** to read the whole thing first.

**Why it takes two steps.** A game running on your PC cannot file a GitHub issue on its own without carrying a secret key, and a key shipped inside a game can be taken out and abused. So instead the game copies the report to your clipboard, saves a copy as a `.txt` file, and opens the GitHub bug form with your answers already filled in. You click into the "Report data" box, press **Ctrl + V**, and submit. You need a free GitHub account.

**No GitHub account?** The report was also saved to your Downloads as a `.txt` file. Post it on [Discord](https://discord.gg/Th2pnq36).

## For the developer

Reports arrive as issues labelled `bug`, `player-report` and `needs-triage`, plus an `area:` label and a `severity:` label added by the **Issue triage** workflow from the dropdown answers. Reports carrying a savegame also get `has-savegame`. You are assigned automatically and the reporter gets a thank-you comment.

To load a reporter's shop:

```bash
gh issue view 42 --repo TheCodingDad-TisonK/RF-Grow-Co --json body --jq .body > report.txt
node tools/decode-report.js report.txt          # writes report.save.json and prints the shop's state
```

Then `npm run serve`, open `http://127.0.0.1:8420/?save=bug`, press F12 and run:

```js
localStorage.setItem('rfgrowco-bug', JSON.stringify(/* paste report.save.json here */)); location.reload();
```

`?save=<name>` is a developer slot outside the player's three, so loading a reporter's save never touches your own.

## Optional: one-click reporting without GitHub

If you would rather players never see GitHub, deploy the small relay in [`tools/report-relay/`](https://github.com/TheCodingDad-TisonK/RF-Grow-Co/tree/main/tools/report-relay) (a single Cloudflare Worker) and set its address in `game/version.js`:

```js
window.RF_REPORT_ENDPOINT = 'https://your-worker.workers.dev/report';
```

The game then posts the report to the relay, which files the issue with a token that stays on the server, and the player sees "Report sent". The relay holds the only copy of the token; nothing secret ships with the game. It has a rate limit and a size cap. Without the endpoint set, the game uses the clipboard route described above.
