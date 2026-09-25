# Modding guide

The game is meant to be reshaped. Every recipe below copies a pattern the game already uses, so the quickest way to add something is to find its nearest neighbour in `src/` and copy it. Then `npm run build` and `npm test`.

**Before you start:** read the warning about one-line statements in [Architecture](Architecture.md). Test in the running game after every edit. The pause menu's **Dev tools** and the `window.RFGROW` console handle save a lot of walking.

## Quick wins: change a number

All tuning lives in plain tables near the top of their sections.

| Want to change | Edit |
|---|---|
| Supply prices, pack sizes | `SUPPLIES` |
| Upgrade and licence prices and requirements | `UPGRADES`, `LICENCES` |
| Strains | `STRAINS` |
| Robber odds against each weapon | `ROB_KINDS` |
| Weapon price, range, fire rate | `WEAPONS` |
| Cigarette line speeds and yields | `TOB` |
| Pack names and prices | `CIG_SKUS` |
| Which robbers show up when | the weights in `pickRobKind` |
| Customer frequency | `maybeCustomer`, `footfall` |
| A new save's starting money and stock | `fresh()` |

## Add a piece of furniture (a prop)

Props are movable in F2 edit mode, remember their place in the save, and rotate in quarter turns. The front of a prop is its local `+z`.

```js
defProp('waterTank', { label: 'water tank', x: -8, z: -3, rot: 1, build: function (c) {
  c.cyl(0.5, 0.5, 1.6, colorMat(0x2f5f8a, 0.5, 0.3), 0, 0.8, 0, 18);   // c.box, c.cyl, c.sign, c.fern, c.add
  c.solid(-0.5, 0.5, -0.5, 0.5);                                        // what you bump into
  c.hit(1.1, 1.7, 1.1, 0, 0.85, 0, { kind: 'waterTank' });              // what E can target
} });
```

Use `floor: 1` for an upstairs prop. `propWorld(id, localX, localZ)` gives a world position relative to the prop, which is how staff find "in front of the shelf" wherever the player moved it.

## Make something interactive

A hit box has a `kind`. Two functions give kinds their meaning. The tidy way is to write your own pair and chain it in, as every feature block does:

```js
function tankPrompt(d, h) { if (d.kind === 'waterTank') return 'Water tank <small>E to fill the can</small>'; return ''; }
function tankInteract(d, h) { if (d.kind !== 'waterTank') return false; toast('💧 Filled', 'good'); sfx('water'); return true; }
```

Then add one line to each dispatcher, next to the existing chain (search for `expPrompt(d, h)` and `expInteract(d, h)`):

```js
var tankP = tankPrompt(d, h); if (tankP) return tankP;
else if (tankInteract(d, h)) { }
```

`d` is the hit box's data, `h` is what the player holds (or null). For a menu, call `ctxOpen(title, subtitle, lines)` with lines of `{ label, cls, act }`; a line without `act` is just text, `cls: 'muted'` greys it, `cls: 'on'` highlights it.

## Add a machine that runs over time

Copy the lab: state with defaults, a timer advanced in an update function, a menu to start it.

```js
// state: inside xs(), next to the others
if (!X.press) X.press = { job: null, out: 0 };
// update: inside updateExpansion(dt), in the "if (on)" power block
var P = X.press.job; if (P) { P.t += dt; if (P.t >= 30) { X.press.out += 5; X.press.job = null; toast('Press done', 'good'); save(); } }
```

Gate it on `powerOn()` if a power cut should stop it.

## Add a product the cigarette cabinet sells

Add an entry to `CIG_SKUS` with `type: 'side'`. Customers will start asking for it once it is in stock, the cabinet menu lists it, and it goes on the bill through `cigTotal`. Put stock into the player's hands with `take({ kind: 'cigs', sku: 'yourSku', n: 6 })`. If you add more than four side products, extend the shelf position array in `syncCigCab`.

## Add a place in town

```js
cityBldg(30, -52, 16, 12, 8, 0x8a6a4a, 'Pawn shop', 'pawn');           // x, z, width, depth, height, colour, map label, id
cityDoor(30, -46, 1, 6, 'pawn', 'PAWN SHOP', 'we buy anything', 0xe8c27a); // the face toward the street: 1 faces +z, -1 faces -z
CITY.pois.push({ id: 'pawn', name: 'Pawn shop', x: 30, z: -46, col: '#e8c27a' });
```

Then handle `'pawn'` in `expPoiMenu(poi)` and return true. For a **walk-in interior**, add an entry to `ZONES` instead and furnish the room in `buildExpansion`; the door then fades the player in, and an `E`-able clerk opens your menu. Interiors share one light that follows the player. Do not add a light per room: every extra light makes every surface in the game more expensive to draw.

## Add a robber type

Add a row to `ROB_KINDS` (weapon, patience, odds against bat, pepper and taser, guard modifier), give it a weight in `pickRobKind`, and if it carries something new, a mesh in `robWeaponMesh`. The stage machine in `updateRobber` does the rest.

## Make a static thing movable

Wrap whatever builds it:

```js
fixtureFromBuild('priceBoard', 'price board', 0, function () { /* box(...), signPlane(...), hit boxes */ });
```

Everything the function adds to the world becomes one fixture that F2 can carry and hang on any surface. The third argument is the direction the thing faces as built (0 faces `+z`). Every `signPlane` sign is already a fixture.

## Add a door

`doorFrame(x, z, alongX)` builds the frame and hangs a sliding door in it. For a door without a frame, call `slideDoor(id, x, floorY, z, alongX, floorLevel, label, startsOpen)`. Give it a nice name in `DOOR_NAMES` and it appears on the control box with its own lock.

## Rules of thumb

- **Saves must keep loading.** Never assume a new field exists: default it in `fresh()`, in `xs()`, or where you read it.
- **Do not hide and show lights.** Changing how many lights are visible makes three.js rebuild every shader, which freezes the game for a moment. Set a light's intensity to 0 instead.
- **Staff walk on a grid** built from `world.obstacles` on the ground floor. Tag an obstacle `door` and the grid ignores it.
- **Animate, do not pop.** Doors slide, shutters roll, the player fades between levels.
- **Keep the guide honest.** If you change how something works, change `game/guide.js` and run `npm run guide`.
- **Write in the house style.** Every string a player reads follows [House style](House-Style.md): the voice, the punctuation and the word list.
