# Save format

The whole game is one JSON object, `S`, written to `localStorage` a fraction of a second after anything changes.

- Key: `rfgrowco-v1`, or `rfgrowco-<name>` when the page is opened with `?save=<name>`.
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
| `supplies`, `storage`, `order`, `deliveries` | what is on the rack, in the back room, on order |
| `display`, `vendStock`, `coffeeStock` | counter extras and the machines |
| `upgrades`, `lic` | what you own, by id |
| `staff` | Jo and the guard's job |
| `hotbar`, `slot` | the six things you carry and which is active |
| `customer`, `courier`, `vip` | who is being served right now |
| `layout[propId]` | moved furniture: `{ x, z, rot }` |
| `fixtures[id]` | moved signs and screens: `{ x, y, z, ry }` |
| `doors[id]`, `doorLocks[id]` | sliding doors: open, locked |
| `custom`, `designs` | creative mode objects and saved designs |
| `armory` | weapons owned and ammunition |
| `tob` | the cigarette line: bays, kiln, stocks between machines, finished packs |
| `cigStock`, `cigShutter` | the cabinet behind the counter |
| `car` | `{ x, z, h, trunk, cigs }` |
| `x` | the expansion bag, see below |
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

## Editing a save

In the desktop app press `Ctrl+Shift+I` for the developer tools, then in the console:

```js
RFGROW.S.bank += 5000;          // the live object; it saves itself
JSON.stringify(RFGROW.S);       // export
localStorage.setItem('rfgrowco-v1', '<pasted json>'); location.reload();   // import
```
