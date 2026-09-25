# Contributing

Thanks for wanting to. A few things make it smooth.

1. **Read [docs/Architecture.md](docs/Architecture.md) first**, especially the warning about comments inside the long one-line statements.
2. **Edit `src/`, not `game/grow3d.js`.** The game's code is written in parts; `npm run build` joins them. `npm run check` fails if the built file was edited by hand.
3. **Run `npm test` and play what you change.** `npm run check` only proves the files parse. A new behaviour deserves a test in `tests/`.
4. **Old saves must keep loading.** Give every new field a default.
5. **One change per pull request**, with a sentence on how you tested it.
6. **Keep the guide honest.** If behaviour changes, update `game/guide.js` and run `npm run guide`. If a number changes, run `npm run balance`.
7. **Docs live in `docs/`.** The wiki is a mirror; do not edit it directly.

Big idea? Open an issue first so nobody builds the same thing twice. Questions are welcome on [Discord](https://discord.gg/8FcgxwJ3dM).
