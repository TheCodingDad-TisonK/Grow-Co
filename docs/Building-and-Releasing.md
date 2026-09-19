# Building and releasing

## Day to day

```bash
npm install        # once
npm start          # run the desktop app from source
npm run serve      # play in a browser, http://127.0.0.1:8420/
npm run check      # syntax check of the game scripts
npm run guide      # regenerate docs/Player-Guide.md from game/guide.js
npm run version    # regenerate game/version.js from package.json (npm run check does this too)
```

There is no build step for the game itself. Edit a file in `game/`, reload (`Ctrl+R` in the app).

`npm run check` only proves the files parse. The long one-line statements in `grow3d.js` can hide a mistake that parses fine and fails at runtime, so always play what you changed.

## Windows builds

```bash
npm run installer  # dist/Grow-Co-Setup-<version>.exe  (one-click installer)
npm run dist       # dist/Grow Co-win32-x64/           (plain folder with the exe)
npm run zip        # zips that folder for a release
```

The installer is made with electron-builder and NSIS. It installs per user, needs no admin rights, and creates Desktop and Start menu shortcuts.

### The symlink error on Windows

The first `npm run installer` on a Windows machine may fail with `Cannot create symbolic link` while unpacking `winCodeSign`. electron-builder's signing toolkit contains two macOS symlinks that Windows will not create without Developer Mode or admin rights. They are not needed. Either switch on Developer Mode in Windows settings, or seed the cache once:

```bash
cd "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
# one of the numbered folders is a complete unpack minus those two links; copy it to the name the tool looks for
xcopy /E /I <numbered-folder> winCodeSign-2.6.0
```

The GitHub release workflow runs on a clean Windows runner where this does not happen.

### Code signing

Builds are not signed, so SmartScreen warns on first run. If you get a certificate, electron-builder picks it up from the `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables with no other change.

## Cutting a release

1. Update `version` in `package.json` and add a section to `CHANGELOG.md`.
2. Commit, then tag: `git tag v1.1.0 && git push --tags`.
3. The **Release** workflow builds the installer on Windows and attaches it to a GitHub release for that tag.

To do it by hand instead: `npm run installer`, then `gh release create v1.1.0 dist/Grow-Co-Setup-1.1.0.exe --notes-file <notes>`.

## The wiki

`docs/` is the source. The **Wiki sync** workflow copies it to the GitHub wiki on every push to `main` that touches `docs/`. GitHub only creates a wiki's git repository after its first page exists, so a brand new fork needs one page created by hand in the Wiki tab before the workflow can push.

Page names are file names: `Modding-Guide.md` becomes the page "Modding Guide". `_Sidebar.md` and `_Footer.md` are the wiki's sidebar and footer.

## Other platforms

The game is a web page, so `npm start` works on macOS and Linux too. Packaged builds for them are a matter of adding `mac` and `linux` targets to the `build` section of `package.json`; nothing in the game is Windows specific.
