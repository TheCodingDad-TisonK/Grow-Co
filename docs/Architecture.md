# Architecture

Grow Co. is deliberately simple to run and a little unusual to read. This page is the map.

## The shape of it

- **One page.** `game/index.html` holds the canvas, the HUD and every overlay (start card, panels, pause menu, context menu).
- **One closure.** `game/grow3d.js` is a single immediately invoked function. All state and every system live inside it as plain `var`s and function declarations. Nothing is a module, nothing is bundled.
- **Written in parts.** That file is built from the parts in `src/` (see below). Edit the parts, never `game/grow3d.js`.
- **One save object.** The whole game state is `S`, a JSON-safe object written to `localStorage`.
- **One loop.** `frame()` runs every animation frame and calls each system's `update…(dt)` in a fixed order, then renders.
- **One handle.** `window.RFGROW` exposes the running game for the creative mode plug-in, for the console, and for tests.

Players and hosts need no build step: `game/` is committed ready to run. Open the page and it runs.

## The parts in src/

`game/grow3d.js` is too big to read or review as one file, so it is written as about forty parts in `src/`, one system each (`11-customers-line.js`, `20-robberies.js`, `29-prop-defs.js`...). `npm run build` joins them in file-name order into `game/grow3d.js`. Nothing about the running game changes: it is still one file and one closure, and the day the parts were made the joined file was byte-for-byte the old one.

- `NN-name.js` goes into both builds. `NN-name.desk.js` goes only into the desk build (the office wall screen that reads the Implementation Desk's API), `NN-name.shop.js` only into this standalone build.
- A small difference inside a shared part is a block at column 0: `//#if desk`, `//#else`, `//#endif` (or `//#if shop`).
- A line starting `//@` at column 0 is a note for the reader and is left out of the build. Every part opens with one.
- The build refuses to join the parts if two of them declare the same top-level function: in one closure a second `function foo(` silently replaces the first.
- `npm run check` fails when `game/grow3d.js` is not what `src/` builds, so an edit made straight to the built file is caught, not lost.

With a `.desk-path` file (git-ignored, one line: the desk's `public` folder), `npm run build` also writes the desk's copy of `grow3d.js` and copies the files both builds share unchanged (the guide, the menu, creative mode, the Workshop, the stylesheet, the report form). A fix is made once, in `src/`, and reaches both builds.

## Tests

`npm test` runs the suite in `tests/` against the real game: a hidden Electron window loads `game/index.html` on a fresh page per test, with a fake clock and fake timers installed before the game's scripts (`tools/test/preload.js`), a fixed random seed per test, drawing switched off and random events held back. Time only moves when a test moves it, so a rule that takes minutes of game time runs in milliseconds and every run gives the same result. `window.RFGROW.test` is the handle the tests reach the game through; the game never reads it. A test is a few lines:

```js
test('the head of the line steps up the moment the window frees', async (h) => {
  h.arrive(6);                                   // six customers, every card good
  h.until(() => h.R.lineup().length >= 4, 90, 'a full line', h.patience);
  h.T.npc.leaveHappy(); h.S.customer = null;     // the window frees
  h.frame(1);
  h.ok(h.S.customer.fromLine, 'the front of the line stepped up');
});
```

`npm test -- rope` runs only the tests whose file or name contains "rope", and `TEST_VERBOSE=1` prints a failure in full. The same suite runs on every push and pull request (`.github/workflows/test.yml`).

## The balance model

`npm run balance` writes [Balance.md](Balance.md): prices, lamps, strains, the shop at each stage, a simulated player over 90 days and the findings that fall out of them. `tools/balance/tables.js` reads the numbers straight out of `src/`, `tools/balance/model.js` holds the formulas, and `tests/balance-model.test.js` checks the model against the running game (prices, the morning bill, harvest weights, what customers order), so the report cannot drift from what players get. Change a number, run it again.

## Why the lines are so long

Most statements in `grow3d.js` are long one-liners: a whole prop, a whole menu, a whole state transition on one line. It keeps related things together and the file scannable by section header. It has one sharp edge worth knowing before you edit:

> Never append a `//` comment in the middle of a long line. It comments out the rest of the statement. The file still parses and the bug only shows at runtime. Use `/* ... */` inside lines.

`node --check game/grow3d.js` (or `npm run check`) catches syntax errors only. Run `npm test`, and play what you changed.

## Finding your way

Sections are marked with banner comments: `// ── Robberies: … ──`. Search for the banner, not the line number. The important ones, in file order:

| Banner | What is there |
|---|---|
| Settings, State | `DEFAULT_SETTINGS`, `fresh()` (a new save), `load()`, `save()` |
| Per-strain stash and packed lots | `stashAdd`, `stashDraw`, `lotAdd`, `lotDraw` |
| Sound | `SFX` table of synthesised sounds, `sfx(name)` |
| Textures, materials | `TEX`, `MAT`, `colorMat`, `glowMat`, `textTex` (text to texture) |
| World building helpers | `box`, `cyl`, `wallX`, `wallZ`, `doorFrame`, `floorPlane`, `signPlane`, `interactable` |
| People | `makeHuman(spec)`, `animateHuman`, the guard, the crew (Jo, Mika and Sam), customers, loungers |
| Pathfinding | a grid A* over the obstacle boxes: `navBuild`, `navPath`, `routeTo` |
| RF Smoking, The city, Upstairs, Expansion, Sliding doors, Fixtures, Robberies | the large feature blocks, each self-contained |
| Props | `defProp(id, {…})`, `buildProp`, `propWorld`, the edit mode |
| Player, hands, interaction | `updatePlayer`, the hotbar, `updateFocus`, `interact()` |
| Panels and menus | `ui`, `ctxOpen`, the panel renderers, the pause menu, `devAction` |
| Boot | the one line that calls every `build…()` in order, then `frame()` |

## The world

Coordinates are metres. `+x` is east, `+z` is toward the street, yaw 0 faces `-z`.

- The shop is `x -12..12`, `z -9..9`. The back room and security room sit behind it, and the fenced yard behind those, with the garage on its east side and the yard gate at `z -18`. A fenced lane runs from the gate to the back street, with a barrier at the street end.
- **Levels** are an integer `player.floor`: `0` ground (the whole town), `1` upstairs, `2` the roof, `-1` everything underground. Level `-1` holds the basement and the walk-in interiors ("zones") of the bank, the gun store and the lab, placed far apart at the same depth and reached by a fade, not by stairs.
- **Collision** is a flat list of axis-aligned boxes, `world.obstacles`, each with a `floorLevel`. The player, the car and the path grid all read it.
- **Interaction** is a raycast from the screen centre against `world.interact`. Each hit mesh carries `userData.interact = { kind, … }`. One function turns a `kind` into a prompt, one turns it into an action.

## How a feature is wired

Every large feature follows the same five steps, which is what makes them easy to copy:

1. **State** in `S` (new saves) or `S.x` (the expansion bag, created lazily by `xs()`), always with defaults so old saves keep loading.
2. **Build**: a `build…()` function that adds meshes, obstacles and `interactable(mesh, { kind })` hit boxes, called from the boot line.
3. **Update**: an `update…(dt)` function called from `frame()`.
4. **Prompt and action**: a `…Prompt(d, h)` that returns the hover text for its kinds and a `…Interact(d, h)` that returns true when it handled the press. Both are chained in the two dispatchers.
5. **Menus** use `ctxOpen(title, subtitle, lines)`, where a line is `{ label, cls, act }`.

See the [Modding guide](Modding-Guide.md) for worked examples.

## The desktop app

`main.js` is a small Electron shell: one window, no menu bar, `contextIsolation` on, no Node access from the page, external links opened in the real browser, a single-instance lock so two windows never fight over one save. Saves live in the app's own `localStorage` under the user profile.

## The two builds

The game ships as two builds from the same code:

- **This one, the standalone**: no network at all, a main menu with three save slots, and the F7 bug report form. The office wall screen is a shop dashboard drawn from the save.
- **A desk-hosted build** the author plays, which keeps a live screen fed by a private development dashboard, uses one save, and has no bug report form.

`game/menu.js` is shared between them: the page configures it with `window.RF_MENU = { slots, saveKey, bug, quitLabel }`. Gameplay changes are applied to both.

## Origins

The game was first built as a panel inside a private development dashboard. `tools/make-standalone.js` and `tools/standalone-polish.js` are the one-time scripts that cut that connection out. They are kept as a record of what changed; they are not part of the game and are not meant to be run again.
