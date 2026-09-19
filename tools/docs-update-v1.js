// One-time docs pass for save slots and bug reporting. Kept as a record; not meant to be run again.
var fs = require('fs'), path = require('path'); var root = path.join(__dirname, '..');
function edit(rel, fn) { var f = path.join(root, rel), s = fs.readFileSync(f, 'utf8'), o = fn(s); if (o === s) { console.error('no change: ' + rel); process.exit(1); } fs.writeFileSync(f, o); }
function rep(s, a, b) { if (s.split(a).length !== 2) { console.error('anchor: ' + a.slice(0, 70)); process.exit(1); } return s.replace(a, b); }

edit('game/guide.js', function (s) {
  s = rep(s, "'<tr><td><b>Esc</b></td><td>pause menu</td></tr><tr><td><b>F11</b></td><td>fullscreen (desktop app)</td></tr></table>' +",
    "'<tr><td><b>F7</b></td><td>report a bug</td></tr><tr><td><b>Esc</b></td><td>pause menu</td></tr><tr><td><b>F11</b></td><td>fullscreen (desktop app)</td></tr></table>' +");
  s = rep(s, "'<li><b>Something is badly broken.</b>", "'<li><b>Found a bug?</b> Press <b>F7</b>, or use Report a bug in the pause menu. Fill in the form and it collects your version, your system and your savegame for you. The more of it you fill in, the faster it gets fixed.</li>' +\n    '<li><b>Something is badly broken.</b>");
  return s;
});
edit('README.md', function (s) {
  s = rep(s, '| **Living world** |', '| **Three save slots** | Three shops, side by side, each deleted on its own. |\n| **Bug reports** | F7 opens a form that gathers your version, system and savegame and files a labelled GitHub issue. |\n| **Living world** |');
  s = rep(s, '`Esc` pause · `F11` fullscreen', '`F7` report a bug · `Esc` pause · `F11` fullscreen');
  s = rep(s, '- [FAQ](docs/FAQ.md)', '- [Reporting bugs](docs/Reporting-Bugs.md)\n- [FAQ](docs/FAQ.md)');
  s = rep(s, '  guide.js            the player guide (main menu, pause menu and wiki share it)', '  guide.js            the player guide (main menu, pause menu and wiki share it)\n  report.js           the bug report form (F7)');
  return s;
});
edit('docs/_Sidebar.md', function (s) { return rep(s, '- [FAQ](FAQ)', '- [Reporting bugs](Reporting-Bugs)\n- [FAQ](FAQ)'); });
edit('docs/Home.md', function (s) { return rep(s, '- **[FAQ](FAQ)**', '- **[Reporting bugs](Reporting-Bugs)**: F7 in the game does most of it for you.\n- **[FAQ](FAQ)**'); });
edit('docs/FAQ.md', function (s) {
  s = rep(s, '**Where is my save?**\nIn the app', '**How many save slots are there?**\nThree. The main menu shows all three with their day, level and money; each has its own Start or Continue button and its own delete button. Switching slot reloads the game. Deleting one never touches the others.\n\n**How do I report a bug?**\nPress **F7** in the game, or use Report a bug in the pause menu. See [Reporting bugs](Reporting-Bugs).\n\n**Where is my save?**\nIn the app');
  return s;
});
edit('docs/Getting-Started.md', function (s) {
  return rep(s, 'The game saves by itself, all the time.', 'There are **three save slots**. The main menu lists them with their day, level and money; each has its own button, and its own delete button with a confirmation. Switching slot reloads the game.\n\nThe game saves by itself, all the time.');
});
edit('docs/Save-Format.md', function (s) {
  return rep(s, '- Key: `rfgrowco-v1`, or `rfgrowco-<name>` when the page is opened with `?save=<name>`.',
    '- Key: `rfgrowco-slot1`, `rfgrowco-slot2` or `rfgrowco-slot3`. Which one is loaded is remembered in `rfgrowco-slot`; the main menu writes it and reloads the page, because the game reads its save once at boot.\n- `?save=<name>` loads `rfgrowco-<name>` instead: a developer slot outside the three, which is how a reporter\'s savegame is opened without touching your own.\n- A save from before slots (`rfgrowco-v1`) is moved into slot 1 the first time the game starts.');
});
edit('docs/Building-and-Releasing.md', function (s) {
  return rep(s, 'npm run guide      # regenerate docs/Player-Guide.md from game/guide.js', 'npm run guide      # regenerate docs/Player-Guide.md from game/guide.js\nnpm run version    # regenerate game/version.js from package.json (npm run check does this too)');
});
edit('CHANGELOG.md', function (s) {
  return rep(s, '# Changelog\n', '# Changelog\n\n## v1\n\nThe first public release. Everything below is in it.\n\n- **Three save slots**, each with its own delete button and confirmation, on the main menu.\n- **Bug reporting**: F7, or a button in the pause menu and the main menu, opens a form with dropdowns for category, severity, frequency and location, and free text for what happened, what was expected and the steps. It gathers the game version, the system, the settings, where the player was standing, recent script errors, lifetime stats and, with permission, the savegame. It then fills in a GitHub issue that is labelled by area and severity and assigns the developer. An optional relay (`tools/report-relay`) files it directly for players without a GitHub account.\n- `tools/decode-report.js` pulls a reporter\'s savegame back out of an issue so it can be loaded in a developer slot.\n');
});
console.log('docs updated');
