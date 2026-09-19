# Systems reference

Every system, where its state lives, and the functions to start reading from. Names are exact: search for them in `game/grow3d.js`.

## Core loop

| System | State | Entry points |
|---|---|---|
| Plants | `S.plants`, `S.potSoil`, `S.tent`, `S.light` | `TENTS`, `LIGHTS`, `STRAINS`, `buildTent`, `updatePlantVisuals` |
| Drying and curing | `S.batches` | the tick near `batch.dry`, `syncShelf`, `syncRack` |
| Stash and packed goods | `S.stash[strain]`, `S.lots[kind][strain]`, totals in `S.cured` and `S.pkg` | `stashAdd`, `stashDraw`, `lotAdd`, `lotDraw`, `syncTotals`, `syncGoods` |
| Bench tasks | | `actions.*`, the task overlay (`taskStart`, Space only) |
| Supplies and orders | `S.supplies`, `S.storage`, `S.order`, `S.deliveries` | `SUPPLIES`, `storageAdd`, `updateTruck` |
| Prices | `S.market`, `shop().markup` | `unitPrice(kind, q, thc)`, `gramValue` |

Quality `q` runs 20 to 100. `thc` is a multiplier of roughly 1.0 to 1.9, not a percentage.

## Selling

| System | State | Entry points |
|---|---|---|
| Customers | `S.customer` | `maybeCustomer`, `spawnCustomer`, `orderLines`, `handOver`, `finalizeSale`, `updateNpc` |
| Counter extras | `S.display` | `ACC`, `syncDisplay` |
| Cabinet goods (cigarettes, carts, hash, gummies, chocolate) | `S.cigStock`, `S.cigShutter`, the side order `customer.cig` | `CIG_SKUS`, `cigCabInteract`, `handCigs`, `cigTotal`, `syncCigCab` |
| Connoisseur lounge | `S.vip` | `startVip`, `serveVip`, `updateVip` |
| Street deals | | `parkDeal` |
| Deliveries | `S.x.delivery` | the delivery block in `updateExpansion`, the `dropoff` kind |
| Footfall | | `footfall()` (weather, weekends, holiday week) divides the customer gap |

## Money

`S.bank`, `S.till`, `S.tips`, `S.vault`, `S.pocket`, `S.box`, `S.pending`. See `cashOnSite`, `takeCash`, `callCourier`, `courierHandOver`, and the bank counter in `cityPoiMenu('bank')`. Licences: `LICENCES`, `hasLic(id)`. Upgrades: `UPGRADES`, `S.upgrades`.

## People

| Who | State | Entry points |
|---|---|---|
| Jo | `S.staff.worker`, `S.staff.task` | `WORKER_TASKS`, `workerNextJob`, `workerPick`, `workerServe` |
| Guard | `S.staff.guardTask` | `GUARD_TASKS`, `updateGuard` |
| Driver, operator, night guard | `S.x.staff` | `rosterMenu`, `expansionNewDay`, the operator block in `updateExpansion` |
| Lobby visitors | | `updateLoungers`, `startFight`, `endFight` |
| Wages | | `payWages`, `expansionNewDay` |

## Trouble

| System | State | Entry points |
|---|---|---|
| Robberies | `heist`, `robber`, `mate` (runtime only), `S.stats.heists` | `ROB_KINDS`, `robTier`, `startRobbery(kind)`, `updateRobber`, `takeTill`, `finishLoot`, `returnLoot`, `robberFlee`, `startGetaway` |
| Weapons | `S.armory` | `WEAPONS`, `fireWeapon`, `strikeRobber`, `shootRobber`, `shotBystander`, `sightLine`, `lockerMenu` |
| Getting hurt | `player.downT` | `hurtPlayer`, `robberAttack`, `robberShoot` |
| Police | `S.x.heat` | `addHeat`, `policeFine`, `panicButton`, `policeArrive`, the inspection in `updateExpansion` |
| Doors and locks | `S.doors`, `S.doorLocks` | `slideDoor`, `setDoor`, `doorsAll`, `updateDoors` |
| Cameras | | `SEC_CAMS`, `buildSecCams`, `updateSecurity`, `camEnter` |

Robber states: `case`, `in`, `grab` or `demand`, `raid`, `loot`, `flee`, plus `down`, `out`, `away`.

## Production

| System | State | Entry points |
|---|---|---|
| RF Smoking line | `S.tob` through `tob()` | `TOB`, `buildBasement`, `updateTobacco`, `tobInteract`, `syncTobRack` |
| Extraction lab | `S.x.lab` | `labMenu`, the job block in `updateExpansion` |
| Trim and bag line | `S.x.bagline`, `S.upgrades.bagline` | the `bagLine` prop and kind |
| Roof greenhouse | `S.x.roof` | the `roofBed` kind |
| Power | `S.x.blackoutUntil`, `S.upgrades.generator` | `powerOn()` |

## The town

| System | State | Entry points |
|---|---|---|
| Streets and buildings | `CITY` | `buildCity`, `cityRoad`, `cityBldg`, `cityDoor` |
| Places | `CITY.pois` | `cityPoiMenu(poi)`, `expPoiMenu(poi)` |
| Walk-in interiors | `ZONES` | `enterZone`, `leaveZone`, the shared `exp.zoneLight` |
| Car | `S.car`, `drive` | `carBody`, `enterCar`, `exitCar`, `updateDrive`, `carBlocked`, `carMenu` |
| Traffic | `traffic` | `updateCity` |
| Map | `cityMap` | `toggleCityMap`, `drawCityMap`, `drawMapExtras` |
| Weather and seasons | `S.x.weather` | `season`, `weekend`, the weather block in `updateExpansion` |

## Building and layout

| System | State | Entry points |
|---|---|---|
| Props (furniture) | `S.layout[id]` | `defProp`, `buildProp`, `propPlacement`, `propWorld`, `propCtx` |
| Fixtures (signs, screens, boards) | `S.fixtures[id]` | `fixtureAdd`, `fixtureFromBuild`, `fixtureSign`, `fxCarry`, `applyFixtures` |
| Edit mode | `edit` | `editToggle`, `editUpdate`, `editGrab`, `editDrop`, `editRotate`, `editReset` |
| Creative mode | `S.custom`, `S.designs` | `grow3d-creative.js`, through `RFGROW.hooks` and `RFGROW.internal` |
| Shop controls | `shop()` | `applyShopState`, the `controls` panel |

## The console handle

`window.RFGROW` exposes, among others: `S`, `player`, `world`, `devAction(id)`, `startRobbery(kind)`, `heistState()`, `fireWeapon`, `enterCar`, `exitCar`, `toggleCityMap`, `goBasement`, `enterZone(id)`, `startVip`, `xs()`, `FIXTURES`, `DOORS`, `stepFrame()`. `stepFrame()` advances one frame by hand, which is how the game is tested in a hidden browser tab where animation frames do not fire.
