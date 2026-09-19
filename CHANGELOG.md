# Changelog

## v1.10

The rest of the packaging pass. What the shop sells is now built once and used everywhere, so the thing on the shelf is the thing in your hand is the thing the customer is given.

- **Cigarette packs** are proper hinge-lid packs: a lid section with a foil seam, the brand printed on the face, and a health band along the bottom. The cabinet behind the counter shows the same pack you hand over, and a carton is a printed sleeve rather than two stacked slabs.
- **The goods shelf** was still selling flat green rectangles and white sticks. It now puts out the same zip-lock baggies and the same tapered joints you carry, so the display case actually looks stocked.
- **Seed packets** are foil sachets with a heat-sealed top, a tear notch and the strain printed on the front, instead of a flat card.
- Product models live in one place now: a joint, a baggie, a cigarette pack and a bud are each built by a single function that the hand, the shelf and the cabinet all call, with the materials cached rather than rebuilt per item.

## v1.9

**The app icon is fixed.** Every installer from v1.3 to v1.8 shipped with the stock Electron icon instead of the Grow Co. badge. The brand renderer destroyed its window before writing `build/icon.ico`, which made Electron quit the process early; the file never appeared, and electron-builder quietly fell back to its default rather than failing. It only looked right on the author's machine because an old `build/icon.ico` was sitting on disk, and `build/` is not in the repo. The renderer now holds the app open until the icon is written, and the build refuses to package at all if the icon is missing or malformed.

**Things look like things.** A first pass over what you carry:

- **Weed is weed now.** Buds are built as a proper cola: calyxes clustered in tapering rings, darker ones mixed through, pistils curling off the sides in the strain's own colour, a dusting of trichomes and a stem. The same bud shows up loose in a curing jar and inside a baggie.
- **Baggies** are zip-locks with bud visible inside, a white zip strip and the strain printed on the label, rather than flat green rectangles.
- **Curing jars** hold loose nugs that fill as the jar does, and carry a strain label.
- **Joints** are tapered cones of paper with a card roach, a twisted tail and a scorched tip.
- **Cookies** sit on a greaseproof sheet with chocolate chips.
- **Soil** is a heat-sealed compost sack with a printed front; **nutrients** is a moulded bottle with a shoulder, a ribbed cap and a wrapped label; **pest spray** is a trigger sprayer with a fill line you can see through the tank; **snacks** are flow-wrapped bars with crimped ends.

## v1.8

**The Workshop.** A content pack manager on the main menu. Turn a pack on and the shop reloads with more in it. Your save is not touched: a pack only adds things you can then go and buy.

**Packs that ship with it**

- **Heritage Genetics** and **Exotic Cultivars**: seven more strains, from an early Old Skunk to a Midnight Cake that takes half an hour and pays for it.
- **Pro Lighting Rack**: two more lamps and a 24 slot tent.
- **Counter Culture** and **Baggies & Boxes**: eight more things to order, sell off the display and load into the machines.
- **Bigger City**: the map grows by half again, with blocks filling the new ground.
- **City Life**: Halloway's Grocery wholesales your machine stock, and the Roxy sells you a couple of hours away from the shop that cools the police off.
- **Christmas** and **New Year**: snow that does not let up, or fireworks over the town after dark, each with a strain and something for the counter.
- **Motor Pool** and **The Old Van**: a faster estate or a slow van that swallows an enormous load.
- **Hustle Mode** and **Easy Street**: what seeds and gear cost, and how busy the shop is.
- Three **bundles** that switch several on at once.

**Make your own, including in Blender**

A pack is one .json file. It can add strains, lamps, tents, things to sell, a whole place in town with a counter or a paid service behind it, a bigger map, a different car, and economy tuning. Export an object from Blender as .glb, name the slot it replaces, import the .json and the .glb together, and your model stands in for whatever the game would have built by hand. There is a starter file and a full explanation in the Workshop itself and in the guide.

**Also in this one**

- **A better town map**: street names on the roads, the shop outlined, your car as a heading arrow instead of a blind square, a north marker, and a scale bar that keeps up when a city pack makes the map bigger.
- **Joints look like joints**: a tapered cone of paper with a card roach, a twisted tail and a scorched tip, instead of five white sticks.

## v1.7

A test pass over the car and the delivery devices. Three real bugs, and the round is a lot less fiddly to run.

**Fixed**

- **Roughly one job in five could not be delivered.** Nine of the town's buildings put their doorstep outside the world boundary, so you could drive to the beacon but never reach it, and the job expired and cost you a point of reputation. Every job now picks whichever face of the building you can actually stand on, and nothing is generated that cannot be reached. This affected the old phone deliveries too.
- **A driver running a cigarette job with an empty car corrupted the car's pack count**, which then showed as a broken number in the garage menu and at the wholesale counter.
- **The job caps were only applied by the spawn timer**, so anything else that raised a job could push past the six markers the town has and create a drop with no beacon and nothing to press E on. The caps are now part of raising a job at all.

**Better**

- **Hand a drop over from the driver's seat.** Stop within a few metres of a marker and the dashboard offers it; **E** hands it over and only gets you out once the drop is done. The round is a driving loop, so it should not need you to get out at every door.
- Every drop now has a **ring painted on the ground** under its beacon, so you can see it in daylight when the column washes out against a pale building.
- The **Next up** box counts the drops waiting and warns when one is close to running out, and it points at the tablet the first time the tobacco licence makes it live. It still gives way to anything happening in the shop.
- **E** on the tablet in your hands opens the board.
- The tablet dock was rebuilt: a proper charging plinth with the tablet standing in it, a nameplate that fits, a charge light, and it is solid instead of something you walk through.

## v1.6

Two delivery devices, one key. **J** opens the board on foot or at the wheel.

- **📱 The burner phone.** Always on you. Calls come in for joints, bags or cookies with a real street address and five minutes on the clock. Carry the goods in your hands, press **E** at the green beacon, and the cash goes straight in your pocket at 60 percent over shop price, with the heat that comes with it. Replaces the old single phone order: you can now have two on the go at once.
- **📋 The delivery tablet.** It sits on a dock in the office and wakes up when you hold the tobacco licence. Take it, and carrying it into the car drops it into the dash cradle so it rides the round without using a hotbar slot.
- **The RF Smoking round.** Up to four cigarette orders at once, each with an address, the packs wanted, the fee and a countdown. Load the car at your bay, drive the round, press **E** at each amber beacon and the packs come out of the boot. Paid into the bank, no heat, a point of reputation each, and the far side of town pays more for the drive.
- Addresses are real: the nearest street names them, so "47 Back Street" is always the same door.
- The map on **M** numbers every drop to match the board, amber for the tablet and green for the burner, and the driving card counts what is still waiting.
- A hired **driver** works the list himself after about a minute, taking a cut of the tablet jobs.

## v1.5

The car is a car now, not a box that moves. ([#2](https://github.com/TheCodingDad-TisonK/Grow-Co/issues/2))

- **The mouse works at the wheel.** It swings the chase camera round the car instead of doing nothing; the wheel pulls the camera in and out, and **C** puts it back behind you. The view drifts back on its own once you stop steering it and the car is moving.
- **A dashboard.** Speedometer, rev counter, the gear you are in, the odometer, what is in the boot, and warning lamps for the handbrake, the lights, the ignition and anything left open. It takes the hotbar's place while you drive.
- **An ignition.** The car starts dead. **I** turns the key; the engine has to be running before the throttle does anything, and switching it off at speed is refused.
- **A handbrake.** **P** puts it on and off. It holds the car still, drags it down from speed, and goes on by itself every time you get out, along with the engine going off.
- **Doors, a bonnet and a boot that open.** **E** on the boot lid, the bonnet or the passenger door from outside; **T** and **B** for the boot and the bonnet from the driver's seat. The bonnet opens onto an engine, the boot onto a well that shows what you are carrying, and loading or unloading at your bay pops the boot itself. Drive off with something open and the dash says so and the car will not pass 8 km/h.
- **Light controls.** **L** cycles off, dipped and main beam, with headlights that actually light the road after dark. Brake lights come on under braking, and the reversing lamps when you are in reverse.
- Getting in and out swings the door you use. The lights, the handbrake, what is open and the odometer are all kept in the save.

## v1.4.1

- The repository moved to github.com/TheCodingDad-TisonK/Grow-Co so the address matches the name. Old links still redirect.

## v1.4

- **The game is called Grow Co.** RF stays as the house mark on the badge; it is not part of the name. The window, the menu, the installer and the docs all say Grow Co. now.
- Saves are carried over automatically the first time 1.4 runs, so nothing is lost in the rename.

## v1.3

- **A proper logo.** The RF monogram now sits on a dark badge with a sprout, paired with a Grow Co. wordmark. One source renders every size that is used anywhere: the splash, the main menu, the favicon, the README and the Windows icon, from 16 px up to 1024 px.
- Tiny sizes drop the sprout so the monogram stays readable at 16 px.
- `npm run brand` regenerates the whole set from `brand/icon.html` and `brand/wordmark.html`.

## v1.2

- **A guided intro for a new shop.** Nine steps from the first order at the laptop to the first sale at the window, shown on a card beside the screen that ticks itself off as you play. It never blocks anything, and finishing every step pays a **$2,500 bonus**.
- Switch it off whenever you like under **Guided intro** in the pause menu; skipping costs the bonus. A shop that has already been played never gets handed a tutorial, and the bonus is only ever paid once.

## v1.1

- **A keyring.** It hangs on a hook in the office. Take it, then **Shift+E** locks or unlocks any door where you stand, rather than walking back to the control box.
- **Lockable storage.** The goods shelf now has a roll gate like the cigarette cabinet, and the goods shelf, the cigarette cabinet and the weapon locker can all be locked with the keyring. A robber who reaches a locked one comes away empty handed.
- The key hook, like every sign and screen, can be moved and hung anywhere in F2 edit mode. Small fixtures are now easier to grab in edit mode.

## v1

The first public release. Everything below is in it.

- **Three save slots**, each with its own delete button and confirmation, on the main menu.
- **Bug reporting**: F7, or a button in the pause menu and the main menu, opens a form with dropdowns for category, severity, frequency and location, and free text for what happened, what was expected and the steps. It gathers the game version, the system, the settings, where the player was standing, recent script errors, lifetime stats and, with permission, the savegame. It then fills in a GitHub issue that is labelled by area and severity and assigns the developer. An optional relay (`tools/report-relay`) files it directly for players without a GitHub account.
- `tools/decode-report.js` pulls a reporter's savegame back out of an issue so it can be loaded in a developer slot.

