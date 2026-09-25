# Systems reference

Every system, where its state lives, and the functions to start reading from. Names are exact: search for them in `src/` (or in the built `game/grow3d.js`).

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
| Customers | `S.customer` (the one at the window); a new face carries its look in `customer.look` | `maybeCustomer`, `customerArrives`, `newCustomer`, `spawnCustomer`, `newFace`, `strangerLook`, `orderLines`, `handOver`, `finalizeSale`, `updateNpc` |
| The line | `lineup` (runtime only, up to `LINE_MAX` 4 along the rope at `LINE_Z`) | `lineJoin`, `updateLineup`, `linePromote`, `lineLeave`, `lineRoute`, `npcHandOff`, `lineShown` (what the HUD counts, robbers posing in the line included) |
| Walk-up sales at the till | `S.regDay`, `S.regSold` | `sellHeld`, `walkupLeft`, `WALKUP_RATE` (85%), `WALKUP_CAP` (12 a day) |
| Who says what | `S.idDay`, `S.idsToday` | `CUST_VOICE` and `custLine`, `CREW_VOICE` and `crewLine`, `guardIdLine`; see [House style](House-Style.md) |
| Counter display | `S.display` | `ACC`, `syncDisplay` |
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
| Crew (Jo, Mika, Sam) | `S.staff.crew` (the old `S.staff.worker` is migrated by `crewList`) | `CREW_MAX`, `crewList`, `crewHireCost`, `WORKER_TASKS`, `workerNextJob`, `workerPick`, `workerServe` |
| Guard | `S.staff.guardTask`, `S.staff.guardOff` | `GUARD_TASKS`, `updateGuard` |
| Driver, operator, night guard | `S.x.staff` | `rosterMenu`, `expansionNewDay`, the operator block in `updateExpansion` |
| Lobby visitors | | `updateLoungers`, `startFight`, `endFight` |
| Wages | | `payWages`, `expansionNewDay` |

## Trouble

| System | State | Entry points |
|---|---|---|
| Robberies | `heist`, `robber`, `mate` (runtime only), `S.stats.heists` | `ROB_KINDS`, `robTier`, `startRobbery(kind)`, `robberCase`, `robberInside`, `fakeIdCaught`, `browseSpot`, `caseHintOn`, `updateRobber`, `takeTill`, `finishLoot`, `returnLoot`, `robberFlee`, `startGetaway` |
| Weapons | `S.armory` | `WEAPONS`, `fireWeapon`, `updateTrigger` (full auto), `updateScope` (the rifle's scope), `strikeRobber`, `shootRobber`, `shotBystander`, `sightLine`, `lockerMenu` |
| Getting hurt | `player.downT` | `hurtPlayer`, `robberAttack`, `robberShoot` |
| Using what you hold (V) | `S.buff`, `S.chill` | `useHeld`, `useHint`, `drinkHeld`, `eatSnack`, `eatCookie`, `sparkUp`, `autoBin` |
| Police | `S.x.heat` | `addHeat`, `policeFine`, `panicButton`, `policeArrive`, the inspection in `updateExpansion` |
| Doors and locks | `S.doors`, `S.doorLocks`, `S.staffKeys` | `slideDoor`, `setDoor`, `doorsAll`, `updateDoors`, `staffKey`, `staffPass` (a keyholder lets themselves through and it relocks) |
| Cameras | | `SEC_CAMS`, `buildSecCams`, `updateSecurity`, `camEnter` |

Robber states: `case`, `in`, `grab` or `demand`, `raid`, `loot`, `flee`, plus `down`, `out`, `away`. While in `case` a robber also has a `pre` step: `walk`, `hold`, `tocheck`, `check` at the door, then `browse` or `queue` and `stepup` (his `plan`). Police officers are dressed by `dressCop`.

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
| Car and van | `S.car`, `S.van`, `drive` | `vehState`, `selectVehicle`, `carBody`, `enterCar`, `exitCar`, `updateDrive`, `carBlocked`, `carMenu` |
| Shop van | `S.van.rack`, `S.van.shopOpen`, `S.van.sales` | `vanShopSet`, `vanClimb`, `vanRack`, `vanRackStock`, `vanServe`, `updateVanShop`, `vanSell` |
| Yard gate, garage door, lane barrier | `world.gateOpen`, `world.garageOpen`, `world.barrierOpen` | `gateSet`, `garageSet`, `barrierSet`, `updateTruck` |
| Traffic | `traffic` | `updateCity` |
| Map | `cityMap` | `toggleCityMap`, `drawCityMap`, `drawMapExtras` |
| Weather and seasons | `S.x.weather` | `season`, `weekend`, the weather block in `updateExpansion` |

## Building and layout

| System | State | Entry points |
|---|---|---|
| Props (furniture) | `S.layout[id]` | `defProp`, `buildProp`, `propPlacement`, `propWorld`, `propCtx` |
| Rope lines | `S.layout[id]` (the `queueRope` multi prop), `S.ropes[id]` | `ropeBuild`, `ropeStyle`, `ropeMenu`, `ropeAdd`, `ropeUp` |
| Rope as a gate | `ropeGates[id]` (runtime: `open` 0..1, passable from 0.8), `guard.rope` | `ropeSegs`, `ropeHeld` (called from `walkAlong` for groups with `userData.gated`), `updateRopeGates`, `updateGuardRope`, `ropePose`; leavers take `exitPath` round the rope's far end. Unhooked while pinned open, during a robbery, or with the guard sent home |
| Fixtures (signs, screens, boards) | `S.fixtures[id]` | `fixtureAdd`, `fixtureFromBuild`, `fixtureSign`, `fxCarry`, `applyFixtures` |
| Edit mode | `edit` | `editToggle`, `editUpdate`, `editGrab`, `editDrop`, `editRotate`, `editReset` |
| Creative mode | `S.custom`, `S.designs` | `grow3d-creative.js`, through `RFGROW.hooks` and `RFGROW.internal` |
| Shop controls | `shop()` | `applyShopState`, the `controls` panel, `MINI_CTL` and `paneMiniCtl` for the front panel and the office panel |
| Drinks and bins | `S.buff`, each bin's count in `machState(propId).trash` | `drinkHeld`, `isDrink`, `isTrash`, the `cooler`, `trash` and `dumpster` kinds |

## The console handle

`window.RFGROW` exposes, among others: `S`, `player`, `world`, `devAction(id)`, `startRobbery(kind)`, `heistState()`, `fireWeapon`, `enterCar`, `exitCar`, `toggleCityMap`, `goBasement`, `enterZone(id)`, `startVip`, `xs()`, `FIXTURES`, `DOORS`, `lineup()`, `customerArrives(premium)`, `stepFrame()`. `stepFrame()` advances one frame by hand, which is how the game is tested in a hidden browser tab where animation frames do not fire.
