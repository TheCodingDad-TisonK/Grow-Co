# Save format

The whole game is one JSON object, `S`, written to `localStorage` a fraction of a second after anything changes, and again as the page closes.

- Key: `rfgrowco-slot1`, `rfgrowco-slot2` or `rfgrowco-slot3`. Which one is loaded is remembered in `rfgrowco-slot`; the main menu writes it and reloads the page, because the game reads its save once at boot.
- `?save=<name>` loads `rfgrowco-<name>` instead: a developer slot outside the three, which is how a reporter's savegame is opened without touching your own.
- A save from before slots (`rfgrowco-v1`) is moved into slot 1 the first time the game starts.
- Settings are separate, under `rfgrowco-settings`.
- A new save is whatever `fresh()` returns. `load()` copies any missing top-level field from `fresh()` into an older save, which is what keeps old saves working after an update.

## Top level

| Field | Meaning |
|---|---|
| `bank`, `till`, `tips`, `vault`, `pocket`, `box`, `pending` | where the money is; `pending` is courier cash that clears next day |
| `xp`, `level`, `rep`, `market`, `day`, `clock` | progress, the price multiplier, the calendar |
| `plants`, `potSoil`, `tent`, `light` | the grow room |
| `batches` | harvests drying and jars curing |
| `stash[strain]` | loose cured bud: `{ g, qSum, thcSum }` |
| `lots[kind][strain]` | packed goods on the shelf: `{ n, qSum, thcSum }`; kinds are `bags`, `joints`, `cookies` |
| `stock` | packed goods locked in the stock cabinet |
| `cured`, `pkg` | totals derived from `stash` and `lots` by `syncTotals()`; do not edit by hand |
| `supplies`, `storage`, `order`, `deliveries` | what is on the supply rack, in the back room, on order |
| `display`, `vendStock`, `coffeeStock` | the counter display and the machines |
| `upgrades`, `lic` | what you own, by id |
| `staff` | the crew (`crew`, up to three, each with a job and whether they're off), the guard's job (`guardTask`) and whether he's off shift (`guardOff`) |
| `hotbar`, `slot` | the six things you carry and which is active |
| `customer`, `courier`, `vip` | who is being served right now |
| `layout[propId]` | moved furniture: `{ x, z, rot }` |
| `fixtures[id]` | moved signs and screens: `{ x, y, z, ry }` |
| `doors[id]`, `doorLocks[id]` | sliding doors: open, locked |
| `custom`, `designs` | creative mode objects and saved designs |
| `armory` | weapons owned and ammunition |
| `tob` | the cigarette line: bays, kiln, stocks between machines, finished packs |
| `cigStock`, `cigShutter` | the cigarette cabinet behind the counter |
| `car`, `van` | each vehicle: where it stands (`x`, `z`, `h`), its `trunk`, `lights`, handbrake (`brake`), odometer (`odo`) and which parts are `open`. Each also carries `cigs`, the cartons loaded into its boot. The van keeps its shop: `rack`, `shopOpen`, `sales` |
| `x` | the expansion bag, see below |
| `staffKeys[id]` | doors whose key you took back from the crew and the guard (`false`); missing means they hold one |
| `regDay`, `regSold` | walk-up sales at the till: the day and how many were rung up (12 a day) |
| `idDay`, `idsToday` | how many IDs the guard has checked today, for what he tells you |
| `stats`, `log` | lifetime numbers and the event feed |

Averages are stored as sums: a lot's quality is `qSum / n`, a stash's is `qSum / g`. That way mixing two batches is just addition.

## `S.x`

Created and defaulted by `xs()`.

| Field | Meaning |
|---|---|
| `heat` | police heat, 0 to 100 |
| `staff` | `{ driver, operator, night }` |
| `lab` | `{ job, out }` |
| `roof` | six greenhouse beds: `{ stage, t }` |
| `garage` | `{ trunk, engine, bar }` |
| `weather` | `{ kind, until }` |
| `bagline` | `{ on, t }` |
| `delivery` | the open phone order, or null |
| `branch` | true once you own Green Leaf |
| `blackoutUntil` | timestamp the power comes back |

## Export and import

The pause menu has a **Save file** button. **Export** writes the loaded slot to `growco-slot<N>-day<D>.json`. **Import** reads one back: the game shows the day, level and bank it holds and asks before it replaces the shop in the loaded slot. The other slots are not touched. A file from a newer version of the game loads with a warning; a file that is not a save is refused.

## Editing a save

In the desktop app press `Ctrl+Shift+I` for the developer tools, then in the console:

```js
RFGROW.S.bank += 5000;          // the live object; it saves itself
JSON.stringify(RFGROW.S);       // export
```

To put an edited save back, use **Import** in the pause menu, which stops the running game from writing its own save over yours as the page reloads.

```js
localStorage.setItem('rfgrowco-slot1', '<pasted json>'); location.reload();   // import into slot 1
```
