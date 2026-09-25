# Changelog

## v1.25: the back room

**Every machine is its own machine.**

- **Its own coin box.** Every vending machine, coffee machine, drinks fridge and arcade cabinet keeps its own coins. Emptying one used to empty them all, because they shared one box; now the others keep theirs.
- **The drinks fridge has a coin box.** The $2 a lounge customer pays for a cold can used to land in the vending machine's box, so there was nothing to collect at the fridge. It goes into the fridge now: open it with Shift+E, and E empties the box before it hands you a can.
- **Its own stock.** Each vending machine sells from its own racks and each coffee machine pours from its own cups and beans, so a new machine starts empty until it is loaded. Customers only walk up to a machine with something in it.
- Old saves: whatever sat in the shared boxes and the shared stock goes into the first machine of each kind. Nothing is lost.

**Storage racking.** The racking in the back room is pallet racking now: blue frames, orange beams, four levels of six bays. Every item gets its own bay, with a label plate on the beam (A1 at the bottom left to D6 at the top right), and keeps it while any is left, so crates no longer shuffle along when one runs out. E with a crate in your hands puts it back up in its bay.

**The crew restock one crate at a time.** On restock, a crew member fetches one crate from its bay, carries it in both arms to where it goes, opens the machine, loads it, shuts it again and goes back for the next. The emptiest machine of a kind is filled first. They never touch a machine's coins. Give them another job or send them home mid-errand and the crate goes back on the racking; a crate in someone's arms when the game is saved is back on the racking when it loads.

**Closing time.** Closing the shop locks the front door. Nobody new comes in and anyone still on the way in turns round, robbers included, but whoever is already inside is served: the line, the one at the window, a smoke in the lounge. Closing used to send the customer at the window away. The front door opens for anyone walking out and shuts behind them.

**A break.** Draw the window curtain, walk round to the customers' side and press Shift+E on it to hang a "back in 5 minutes" note. For five minutes the line and the one at the window wait for you without losing patience. Shift+E takes it down, and opening the curtain takes it down too.

**The crew actually walk there.** The roof greenhouse beds were being counted as walls on the ground floor, so a crew member sent from the hall to the back room or the lobby stopped halfway and did the job from where they stood. They walk all the way now.

**Pacing**, from the balance report (docs/Balance.md):

- **Levels take longer.** Each level asks for more XP than the last, so level 10 comes about day 24 of steady trade instead of day 16.
- **Reputation gates are higher.** Lounge licence 200, Firearms licence 240, Connoisseur permit 320, Late-hours licence 400, Brand registration 480, Export licence 960. They open over the first two weeks instead of the first few days.
- **The tobacco line is a mid-game business.** The licence needs level 8, the Corner Tobacconist pays 50% of shop price instead of 60%, and the driver 45% instead of 55%.
- **Big months pay more tax.** Business tax is 20% instead of 10% on what a month takes over $60,000. A young shop never reaches it.
- **A heavy till warns you.** When the till and the tip jar hold $250 or more, the vault readout turns amber and shows them, and once a day a warning says a robber would take all of it.

**For people who work on the game.** The code is written in parts in `src/` and built into the game (and the desk build) by `npm run build`. `npm test` runs 46 tests against the real game in a hidden window, on every push. `npm run balance` writes docs/Balance.md from the numbers in the code.

## v1.24: the busy shop

**A real line at the window.** Customers no longer wait outside until the window is free. Up to four queue along the rope while you serve, and the next one steps up the moment you finish. Anyone left waiting in line for more than a minute and a half gives up and walks out (rep -1).

- **V uses what you hold, anywhere.** Drink a water, coffee or cold can, eat a snack or one of your own cookies, or light a joint and carry on working. An empty goes straight into a bin with room if one is a few steps away.
- **Two new guns.** A hunting rifle with a scope on right-click, and an AK-47 that fires full auto while you hold the button. Both need the firearms licence.
- **The police look like police.** Peaked caps, vests lettered POLICE, a badge, a radio and a holster. The patrol car is lettered down both sides.
- **Robbers are harder to spot.** They dress like anyone off the street. Most join the line like a customer and pull the mask at the window; others browse the lobby, and a partner may come in later. The guard's ID check catches some of them on a fake card. Strangers walk in and order like anyone else, and E on anyone in the line has a word.
- **The rope is a gate.** Once the guard has checked a customer's ID he unhooks the rope, holds it while they walk through and hooks it back. People leaving walk round it. With the guard sent home it stays unhooked.
- **Rope lines you arrange.** Change the colour, length, style and posts, turn it, put up another beside it or take it down. F2 moves it.

**Small things that were in the way.**

- **Save file.** The pause menu exports the loaded slot as a .json file and imports one back. Import shows the day, level and bank in the file and asks before it replaces the shop. The other slots are not touched.
- **Screenshots.** F12 (or F9) saves the scene without the HUD. The desktop app files it under Pictures, Grow Co; a browser downloads it.
- **The basement signs move.** Every status sign in the basement works, the bay signs, the kiln, the packer and the rest, can now be carried in F2 like the signs upstairs.
- **A hint about the screens.** The first time a touch screen is under the crosshair, one line says how they work. It shows once per save.
- **The wholesalers pay less.** The Corner Tobacconist pays 60% of the board price instead of 70%, and the driver 55% instead of 65%. The line still makes more than the window sells, but the window is now clearly where the money is.

## v1.23.1

The cabinet tablet is drawn from the start instead of staying black until you point at it, the security desk's recorder, key rack and walkie-talkie sit where you can see them, and the README carries new screenshots.

## v1.23: the interactive change

**Screens you use, not menus that open.** Every screen in the shop is now a touch screen you work by looking at it and pressing E (or clicking), the same way the office wall screen went in v1.22. A ring shows where you are pointing and the prompt names the control.

- **The till is a tablet.** A big tablet on a stand above the cash drawer replaces the old register and its menu. Payments, card runs, counting change, walk-up sales, opening the drawer and emptying the till all happen on its screen.
- **A security screen.** A wall tablet in the security room, left of the camera feeds: tap a camera to watch it, lock or unlock any door, see heat, robberies, the guard and an incident log, and trip the silent alarm.
- **The control cabinet.** The shop control box is now a floor-standing cabinet on the security room's right wall. Open its doors and a tablet hangs inside with the shop, room lights, curtains, doors, climate and radio pages, and under it a bank of real switches (open, lights, staff door, roller door, yard gate), levers for the two dehumidifiers, the markup and the volume, a radio knob, two little displays, a row of room-light buttons and a red silent-alarm button. The security desk lost its keyboard and mouse and gained notes, a shift sheet, a walkie-talkie on its charger and a key rack; the recorder hangs on the wall.
- **The office PC.** The laptop is a PC. Sit at the desk and press E on it and its desktop comes up: Supplies, Seed bank, Gear, Licences, Staff, Bank, Deliveries, the dashboard, Diary, Stats, Settings and the Guide as apps in windows.
- **Your phone on F.** You always carry it. Home screen with the time, weather and money, then Burner (street orders), Wallet (with the bank courier), People (crew and the guard), Map, Messages and Settings.
- **The delivery tablet has its own screen.** J opens it when you have it: the round as cards with what is loaded, and the town map with the beacons beside it.
- **Tab is a quick wheel, I is the inventory.** The wheel reaches the inventory, the phone, the map, deliveries, the broom, the keyring, put down or stand up, and opening or closing the shop. Press the number or click.
- **A busier town.** Twice the people on the shop's street, five more cars, and people walking every pavement in town.

## v1.22

**The office screen is a touch screen.** The shop dashboard on the office wall used to open a menu when you pressed E. Now you use the screen itself: look at a tab, a tile or a button and press E (or click), the same way you use everything else. A ring on the screen shows where you are pointing, and the prompt names what you are about to tap.

- Tabs along the top switch between Overview, Stock, Staff, Production and Security. The mouse wheel flips pages while you look at the screen.
- Tapping a tile opens a card with the figure and a note. Tap Close, click anywhere outside the card, or just walk away.
- **Auto / manual.** The button at the bottom right switches between auto rotation (the pages cycle every 12 s, as before) and manual, where the page you picked stays put. The choice is remembered. Any tap also holds the current page for 45 s.
- Refresh redraws the figures from your save.

## v1.21

**A cold read, put right.** Three fresh readers went through the whole game as a player, an engineer and an editor. This release fixes what they found and joins up the systems that led nowhere.

**The van's boot was a free stock machine.** Unloading the van emptied the car's boot instead, so the same load could be unloaded forever. Each vehicle now empties its own boot, and cartons ride in whichever vehicle you loaded them into.

**Looking at a vehicle no longer picks it.** Aiming at the van used to make it the vehicle in hand, which left the van's hatch drawn shut after a reload and could jam the car's door open. Each vehicle now keeps and animates its own doors, hatch, counter and lamps.

**Fewer hitches.** Picking something up or putting it down used to rebuild every plant in the tent. Now only the part of the world that changed is redrawn. The security monitors and the TV only render when you can see them, and the indoor cameras skip the town. Dragging a settings slider no longer recompiles every shader. Removed people, plants and held items free their graphics memory.

**Crashes and broken saves.** The guard going home mid-sentence, or a customer leaving mid-line, could throw an error. A save that will not load now opens a fresh shop and keeps the old slot untouched, and saves carry a version number so future changes migrate cleanly.

**The bookshelves are solid again.** A stray character in a comment had removed their frame and collision since 1.0.

**Doors close.** Doors that people walk through shut again 4 s after they are clear, the staff door included. Crew and the guard carry keys and lock up behind themselves.

**Money that means something.**
- The till's walk-up sale pays 85% of the board price and takes 12 a day. Customers at the window are where the money is.
- Rep brings people in: the gap between customers shrinks as rep grows, down to 60% of it.
- The branch pays $9 for every unit you stock it with, up to 60 a day, plus twice your rep. One $120 manager replaces three staff you never saw.
- Time away moves the calendar on by one day at most, so coming back no longer means a stack of bills. The basement line, roof beds and lab catch up while you were gone.
- Delivery rounds, the tobacconist, the driver and the branch go through the tax book like the shop does.
- Roster hires count as staff. The guard draws $60 a day on shift, starting when the rent does, so a new shop is not broke before its first harvest. The driver keeps 6 packs of each kind for your own rounds.
- You start with $220, as the menu always said.

**Things that did nothing now do something.**
- Curing jars set how many batches cure at once (two at least). The rest wait for a jar.
- The drinks fridge in the lobby sells customers a cold can for $2.
- A second or third vending, coffee or arcade machine brings its own trade.
- Vending machines take and sell any Workshop item made for them, and the grocery delivers as crates in the back room.
- Customers pick their extras from everything on the counter display.
- A full bin makes dust settle faster and costs a point of rep a day until you empty it.
- A bad ID waved through costs heat and rep if you serve it. The crew leaves a held-out ID to you.
- The roof greenhouse needs Cultivation permit II and pays trimming and compliance like the tent.
- Descriptions now match the numbers: brand, late hours, solar, the mellow smoke and the ATM fee.

**Words.** Every line in the game was reread and rewritten in one plain voice. Things have one name each now: the boot, the till, the back room, the drying line, the guard. The people sound like people: the regulars each have a habit, the crew each have a way of talking, the guard keeps it short, robbers are cold, lounge guests are formal, and the police finally say something. Lines that told you something untrue are put right, the broken ones ("Jo: ake a break", "paperss", "Sold 1 bags") are fixed, and a sale now lists exactly what was handed over. Heat going up on a street sale is shown instead of happening quietly. The guide, the menu, the pause screen and the docs match the game, with a chapter for the shop van and a house style page for anyone writing for Grow Co.

## v1.20

**The dead click.** After closing the pause menu, a panel, the tablet or a task, the next click on the scene only took the mouse back and did nothing else, so you clicked twice at everything. That click now does its job as well. And the browser refuses to take the mouse back within about a second of Esc letting it go; the game now asks again once the second is up instead of leaving you clicking.

**No more flicker.** Two faces that share a plane, overlap and face the same way fight for every pixel, which is the shimmer on the ceiling, the door and window frames, the vending machines and the pavement. Instead of chasing each one, the game now checks every box and plane once the world is built, finds those pairs (about fifteen hundred of them) and moves the thinner of the two, a trim, a frame, a panel, five millimetres out. Walls and machines are never lifted off the floor. The same pass runs again after you rearrange the furniture. The ground floor ceiling now has holes over both stairwells, so going up no longer takes you through it. The three main roads were laid twice, a millimetre apart; the second copy is gone.

**One brick.** Every brick panel on the shop used to stretch the same texture over its own width, so a narrow panel showed tiny bricks next to a wide panel with huge ones. Bricks are sized in metres now and match everywhere, and the dark corner piers, the fascia and the roof parapet use the same brick as the rest.

**The front of the shop.** Brick pilasters between the bays with stone caps, a stone string course over the fascia, four gooseneck downlights over the sign, a striped awning on the door and on both window bays, window boxes with flowers under the shop window, a doormat, and an air-conditioning unit on the roof. Upstairs the glass band sits on a brick spandrel with a stone sill, split into bays by brick piers.

**The backyard, and a garage.** The yard is half as big again, 15 by 10 metres, with a dumpster you can use, a stack of pallets and crates, a drain grate, a lamp over the roller door, the condenser and its pipe, downpipes at both rear corners, and weeds along the fence. On its east side stands a garage of its own: brick, a flat roof, a roller door that opens onto the yard with E, a lamp, a tool board, a shelf of crates, a tyre stack, an oil stain and a barred window. The car lives in there now.

**A van, and the car in the garage.** You have two vehicles now. The car lives in the garage (a save that still had it in the yard bay finds it moved) and a white Grow Co. delivery van stands in the bay under the canopy: a cab, a tall cargo box with the livery, a roof rack, a tailgate that lifts, a stubby bonnet, and two and a half times the trunk of the car, which makes it the one for supply runs and delivery rounds. Whichever you look at is the one E, Shift+E and the parts refer to; each keeps its own parking spot, trunk, lights and handbrake.

**The garage, dressed.** Outside: a gutter and downpipe, a lamp over the door, a door number, drums and jerry cans against the wall, a vent, a side door with a step and a window onto the yard. Inside: a workbench with a vice, a red toolbox, a trolley jack, a fire extinguisher, an oil drum, a service poster, a wall socket, painted bay lines and wheel chocks.

**The van can leave.** Its first parking spot had the oil drums 25 cm off its tail and the pallets a metre off its side, so it sat pinned. Those have moved to the strip north of the garage and beside the roller door, and the van stands 70 cm further forward. The camera in the car had its pitch the wrong way round: mouse up now tilts the view up, as it does on foot. The van's tailgate opened into the cargo box; it lifts outward and up now.

**The van is a shop.** Shift+E on the serving hatch opens the shop van: the right side lifts into a canopy, a counter folds out under it, the tailgate goes up with a latch rail across the back, and an OPEN sign lights. Shift+E again packs it all away. Each piece opens on its own too. Climb in through the open tailgate with E (you stoop, the box is low), and inside there is a rack on the left that holds three joints, three bags and three cookies, no more, a stool at the window and a small register on the counter. E on the rack stocks it from your hands or takes a kind back down; E on the counter takes the window. Passers-by then walk up to the counter, ask for what is on the rack, and E sells it to them at half again the shop price, cash in your pocket, with a small chance one of them is plain-clothes. E at the tailgate climbs out. The seat sits you high enough to see out; the buyers face the counter.

**The lane.** Fenced on both sides from the back street to the yard gate, with kerbs, centre dashes, two lamp posts, a speed bump, bollards and a private-road sign at the mouth, a camera watching the gate, and grass along the verges. A striped barrier stands at the street end: it lifts on its own when you drive up in your car and drops behind you, or E raises it on foot. That is the first gate; the swing gate into the yard is the second.

**Props that do something.** The trash can lifts its lid with E and takes empties: it holds twelve, then you bag it up and carry the bag to the dumpster out back. The water cooler hands you a cup and fills it; drink it there, on the couch or at the table for a short lift, and you are left holding the empty cup, which refills at the cooler or goes in the trash. Coffee and cold drinks can be drunk the same way now, and leave an empty behind.

**Trees off the road.** The pines around the yard could land on the back street or the lane. They check for tarmac first.

## v1.19

**Greenery.** The town's trees were stacked cones and a sphere on a stick. They are now real shapes: broadleaf trees with a trunk, three branches and a lumpy crown under a dappled leaf texture, in three variants, and ragged five-tier pines in two, each with its own shade of green. The park has a clipped hedge all the way round with gaps at the paths, flower beds either side of both paths and round the fountain, and grass you can see: several thousand tufts across every patch of open ground in town, with more in the park and none on a road, a pavement or your own plot. Bushes and a few flowers stand at the foot of most buildings, and loose trees fill the empty ground between the blocks. Every one of these is an instance of a shared shape, so the whole lot costs about a dozen draw calls and adds nothing you can measure to the frame time. The ground texture is fuller, the park lawn is grass instead of flat green, and the sun's shadow now reaches the park.

**Buildings.** Every block used to wear the same tiled window pattern. There are five styles now, picked by where the building stands: concrete office grid, brick with sills and lintels, stone with tall windows, dark panel with strip windows, and glass curtain wall. Each has a proper ground floor with big shop panes and a door. About a third of the windows have a light on behind them, some with a blind, and they glow at dusk and through the night, then go out at dawn.

**Measured.** Same view, same method, the render of one frame took 324 ms in v1.17.1 and 35 ms in v1.18 inside the shop, and 167 ms against 20 ms on the street. That is the v1.18 change; the greenery on top of it made no measurable difference.

## v1.18

**Frame rate.** The town and the shop had fifty-odd lamps in the scene at once, and the renderer lit every pixel with every one of them whether or not the light could reach it. Only the nearest twelve stay on now (eight on Medium, five on Low); the rest are switched off until you walk towards them, and the count is held steady so the shaders are not rebuilt as you move. Shadows were redrawn from scratch every frame as well, a second full pass over every object in the game: they are refreshed four times a second instead, which nobody can see and the graphics card can. Medium quality also drops to a 1024 shadow map. On the machine this was measured on the old build could not keep up at all and the new one holds 60.

**Flickering buildings.** Distant walls, roads and shopfronts shimmered because the camera's depth range started five centimetres from your eyes and ran out two hundred metres away, which left the far end of Main Street with about a centimetre of depth precision, less than the gap between a road and its paint. The near plane now starts at twenty centimetres, four times the precision at distance, and nothing you carry sits closer than half a metre so nothing is clipped.

**Jump and crouch.** Space hops you about eighty centimetres into the air and Ctrl drops you to a crouch, which slows the walk. A crouched hop is smaller. Neither works while you are seated, at the wheel or on the floor. Ctrl+E still sends a crew member home as before.

## v1.17.1

**A cold read of the whole game.** Ten fresh reviewers went through every line with no idea how any of it was meant to work, and this release fixes what they found that could cost you a save, a session or an honest day's takings.

**Things that could trap you or end a session.** Locking a door while standing in its doorway shut it on top of you, and nothing could get you out. The key now asks you to step out first, and more generally anything that ends up overlapping you (a prop dropped on your own feet, a door, a bad exit from the car) can always be walked out of. Sending security home in the middle of an ID check could stop the game dead. Reloading while a guest was in the lounge meant no guest ever came again on that save. Switching off a content pack could leave a save that would not load, because its tent no longer existed, or a car parked outside a town that had shrunk: the tent now falls back and the car goes home to its bay.

**Saving.** The game saved a third of a second after every change, so quitting or closing the window inside that moment lost the last thing you did. It now writes on the way out. And if the save cannot be written at all, because the storage is full or blocked, it says so instead of failing silently.

**Naps were ruining the crop.** Sleeping, or coming back after a few minutes away, advanced thirst over the whole gap and then charged the quality penalty as if the plants had been bone dry the entire time, which dropped every plant to the floor. Only the time actually spent thirsty counts now. The same long step let a curing batch sail past its ceiling to 100, which made both curing upgrades pointless. The ceiling holds.

**Money that was not right.** RF Supply Co. handed over ten of anything for less than the price of one. Your own vending and coffee machines paid you $2 every time you used them and gave you the drink as well: the owner pays like anyone else now. Wages came out of the bank only, so a careful owner with everything in the vault lost the whole crew at dawn; wages now draw on the bank, then the vault, then the till, like every other bill. Change can no longer be counted out past the note you were handed, which used to push the till below zero.

**Paused means paused.** The pause menu said Paused while the whole shop carried on behind it, which included an armed robber who kept shooting at you while you could not move. The world now holds still until you close the menu.

**A fixed time of day was a holiday from the bills.** With the sky set to always day, evening or night, the calendar never moved, so rent, power, wages and tax were never charged again while the takings kept coming. The days turn over now whatever the sky is doing.

**Fines and extra staff find the vault.** A police fine or an inspection could only ever reach the bank and your pocket, so keeping the cash in the vault made every one of them free. They draw on the vault and the till now, and the driver, operator and night guard are paid the same way, with anything you cannot cover going into arrears instead of quietly vanishing.

**Snow.** Snow painted the fog a bright grey at every hour, so a snowy night turned the town into pale cut-outs, and it pushed half again as much ambient light into every room in the building, which flattened the shadows and washed the textures out indoors as well. Snow is now only as bright as the hour allows, leaves the inside of the shop alone, eases in and out as you walk through the door, and no longer whites out the far end of the street.

**Crew and walls.** When somebody could not reach where they were going, the route was cut short at the last reachable spot and then the real destination was added back on the end, so they finished the trip straight through the wall. They stop where the route stops.

**Old saves.** A save from before a line of the ledger existed loaded with that line missing, and the first sum to touch it turned the money into NaN for good. Missing lines are filled in on load.

**Sound.** A save with the radio playing loaded with every sound effect dead for the whole session. Fixed.

**Holding E** repeated the action thirty times a second: it could drain a vending machine, or flip the shop open and closed until the customer at the window vanished. One press, one action. Pressing E in the car at a drop you cannot fill now lets you out instead of doing nothing.

**Traffic** queued forever behind your car when it was parked at the kerb with nobody in it. An empty car is scenery now, like every other parked car.

**Long sessions.** Every restock, every harvest, every customer and every passer-by left their 3D models behind in graphics memory, and a long enough session would eventually lose the display. Everything the game throws away is now released.

**Under the bonnet.** The desktop app only ever hands web links to your browser, a developer save name is escaped on the menu like every other string, and the release notes for builders now push one tag by name. A Workshop pack's icon is escaped too. The release build refuses a tag that does not match the version in package.json, the syntax check covers the Workshop file, and the optional bug-report relay now refuses to run without its rate limit, caps what it will file in a day, and cleans player text before it goes into an issue.

## v1.17

**The economy was not an economy.** A gram of top shelf could reach $99 once reputation, the market, the brand registration, late hours and your own markup had all multiplied together. Meanwhile the shop cost nothing at all to run: no rent, no power, no water, no tax, and the only money ever leaving the building was $60 a day in wages. Everything buyable in the game, every upgrade, licence, tent and lamp, came to $73,160, which a mature shop earned back in about thirteen minutes. This release rebuilds the money from the ground up.

**Prices sit where real ones do.** Plain flower is about $5.70 a gram and top shelf about $16.50. An eighth runs from $21 to $57 and a joint from $7.66 to $18. Everything that lifts a price is now added into one premium instead of multiplied together: reputation is worth at most 10% and mostly buys footfall rather than margin, brand registration 4%, late hours 5%. The market swings between 0.85 and 1.20 rather than 0.7 to 2.0, and the 420 rush and the Cannabis Cup were rescaled to match so they still feel different from each other.

**The digital scale and the pre-rolled cones were printing money.** An eighth was priced as 3.5 g no matter what it actually weighed, so the scale sold 3.2 g at the 3.5 g price, forever. A joint was priced flat, so the cones took a fifth of the bud out of every one at no drop in price. Both now price on the weight that really left the stash. They trade price for volume, which is what they were always described as doing.

**The shop has bills.** Rent on the unit and its floor space, power that depends on which lamp is running over how many slots, water for the plants in the tent, and payroll. They fall every morning whether or not there is anything ready to sell. There is a fit-out period to start you off: no rent until day 11, long enough for two harvests to get on your feet.

**Power is a reason to choose one lamp over another.** The HPS rig is cheap to buy and expensive to run. The quantum board costs more and draws less. The solar roof takes a third off the bill, which is what makes it worth its price. Lamps now buy yield and quality rather than speed, because how long a plant takes to flower is mostly the plant's business.

**Tax.** 15% excise sits inside every sale and is held back rather than banked, and 10% of the month's takings is settled on the first of each month. The money in your bank is not all yours, which is rather the point.

**A plant takes days, not minutes.** Sunflower Kush is three days and Rainbow Runtz five and a half, with drying on top. Bills fall while the tent is still full, so a grow has to be financed rather than simply waited out. That is the tension the shop never had.

**Nobody runs a commercial grow on their own.** Up to eight slots is a one-person job. Past that the place needs staff whether or not you have hired anyone by name, and the crew you do hire are drawn from that same payroll rather than charged on top of it.

**A profit and loss page**, in the bank tab on the office laptop: every line of the morning bill, what you took today and this month, the tax owed and the day it falls, and any arrears. A bill you cannot cover comes out of the vault and then the till, and whatever is still short goes into arrears and costs you reputation every day it stands.

**Everything worth buying now costs what it is worth.** The upgrade and licence tree comes to $160,780, and buying out the rival shop is $180,000 rather than $25,000.

## v1.16.2

**The shop was built for six strains.** A seed pack takes you to twelve, and three places had the number six baked into their geometry. The worst was the goods shelf: a fixed two by three grid that silently dropped everything past the sixth strain. With both seed packs on, six of your twelve strains could be grown, cured and packed and then never put out for sale at all. The shelf sizes itself to the list now, three shelves high and as many bays wide as it needs, with a divider and a downlight over each one. At six strains it is exactly the shelf it always was.

The strain sheets on the hall wall marched off the end of it once there were more than six, and the seed packets on the supply rack overhung the rack. Both fit themselves to however many strains you have.

**Turning packs on no longer restarts the shop each time.** Every toggle in the Workshop reloaded the whole game, so switching on three packs meant sitting through three restarts. Toggling is instant now and a banner offers one **Apply and rebuild** when you are done.

## v1.16.1

**The shop control box was buried.** It is still where it always was, on the security room wall, but the plot the town is told to keep clear only covered the main room. The security room is an annex that sticks out past it, so a Workshop place could be built straight through that corner with the control box inside it. That is what happened with the places pack on: the grocery was put up over the security room. The exclusion now covers the whole building, wings and yard included.

**Two more panels, where you actually stand.** A small one behind the register for the front of house: open and close the shop, the shutter, and the hall and lounge lights. Another in the office for the lights back there and the office door. The full board is still in the security room, and all three move with F2 like any other fitting.

## v1.16

**Three assistants, not one.** The shop floor took exactly one helper because she was a boolean. It is a crew now: hire up to three at the laptop under **Staff**, each costing more than the last, each with their own name, their own look and their own job. Jo, Mika and Sam.

**Send them home and call them back.** Staff used to be either on the payroll or gone for good. Now each assistant, and security, can be sent home for the day: they leave the floor, draw no wage while they are off, and come back when you call them in. Ctrl+E on an assistant sends that one home on the spot.

**Give them a spot to stand.** Shift+E on an assistant, choose **Send them somewhere**, walk to the place you want them and press **E**. That is where they wait between jobs until you clear it.

**They tell you when there is nothing to do.** Putting someone on sweeping with a clean floor, or on restocking with an empty storeroom, genuinely left them with no job, so they stood there silently and looked broken. They say why now.

**ID checks mean something.** The check at the door was scenery: the guard looked at a card for a couple of seconds and everyone was waved through. Every customer now carries a real ID, and roughly one in seven will not stand up: underage, expired, a photo that is not them, or a plain fake. With security on the door they show it to the guard, who is good but not perfect and will sometimes wave a bad one through. With security off shift they bring it straight to you at the window and **E** opens the card. Either way you can **always ask to see it yourself** with Shift+E, even for someone the guard already passed, which is how you catch his mistakes. Serve on a bad one and it is on you: heat, reputation, and a fair chance of a fine. Refuse a bad one and you gain reputation; refuse a good one and you lose it.

**The buildings are buildings now.** Every block in town was one box with a window texture on it. They have a stone base at street level, a string course where the shopfront stops, a cornice under the parapet, and something on the roof: a stair head with a water tank, a plant or an aerial. The tall ones get a setback storey.

## v1.15

Six things you reported, all in the same area: the town, and who can walk where in it.

**Doors are real to everybody now.** Nobody walking around the building could see a door at all: the pathfinder threw every door away before it planned a route, and it never rebuilt itself when one opened or shut. On top of that, a shut door slid open as a decoration whenever anyone stood near it while the door itself stayed shut. Between the two, robbers appeared to stroll through the wall of the vault room and staff walked through locked doors as though they were not there. One rule now. A shut door that is not locked is no barrier, because people open doors, and you will see them do it. A locked door genuinely stops staff and customers: send your worker somewhere behind one and they give up the errand and say so. A robber goes through anything, but he has to break it first, standing at the door and working on it for a few seconds with the noise and the log entry that go with it. The lock stays broken afterwards. Locking the back rooms is worth doing now: it will not keep him out, but it costs him time and tells you where he is.

**When the pathfinder cannot find a route it no longer draws a straight line through the building.** That fallback was most of what "walking through walls" actually was. Whoever it is now goes as far as there is a way and stops.

**The police precinct is not next door any more.** It sat 24 metres from your front door, which made every response absurd. It is at the far end of Main Street, 96 metres away.

**And the police actually turn up.** "Police arrived" used to mean the robber vanished and a line appeared in the log. Now a patrol car leaves the precinct with its lights going, comes down Main Street, pulls into the kerb outside your door, and two officers get out and walk in. They cross the shop to whoever is still inside, he puts his hands up, and they walk him back out to the car and drive off with him. The silent alarm's countdown is shorter to make room for the drive.

**A closed shop is closed.** The random-event path could spawn a customer without ever checking whether you were open, so people walked in with the shutters down. It checks now, and it respects the cooling-off period after trouble as well.

**Buildings stop landing on top of each other.** Nothing ever tested whether a plot was free, so the procedural blocks were laid over the named places and a Workshop pack could drop a cinema onto a road or inside a block of flats. Both of the places packs did exactly that. Every plot is tested now against the roads, the parks, your own yard and everything already standing. The town is built as terraces, so sharing a wall is still fine; sharing a living room is not. A Workshop place goes in last, once the whole town is standing, and if the spot the pack asked for is taken it quietly takes the nearest free one.

**More on the streets.** Every kerb in town is dressed: lamp posts, street trees, benches, bins, hydrants, bollards, planters, bus shelters and cars parked nose to tail, all of it kept off the tarmac and out of the buildings.

## v1.14.1

**The dev tools' "Fill machines" never filled the drinks fridge.** It topped up the shop's drinks, snacks, cups and beans, but the fridge is the one machine you load by hand, so its cans live on the fridge itself rather than in the shop's stock, and nothing ever put any there. It now fills every fridge you own. This was never a new problem, it just got easier to notice once you could own three of them.

While it was open: nothing in the dev tools was redrawing the machines afterwards, so the coils, the cup stack, the bean hopper and the fridge shelves kept showing the old numbers until you next touched one. They refresh on the spot now.

## v1.14

**You can own more than one machine.** Props were one instance per name, so the shop could hold exactly one vending machine, one coffee machine, one arcade cabinet and one fridge, and that was the end of it. Buy extras at the laptop under **Gear**, in the new **Machines** box: up to four vending machines, four coffee machines, four arcade cabinets and three fridges, each costing a little more than the last.

A machine you buy lands in the first clear space along the same wall as the one you already have, checked against everything actually standing in the room, and it is pinned there so it never drifts between sessions. Press **F2** and drag it wherever you really want it.

**Each one is genuinely its own machine.** Its door, its delivery tray, the cup under its spout and the cans on its shelves belong to it alone. Open the second vending machine to restock it and the first stays shut. Pour a coffee on one and take it off that one. The crosshair now names the machine you are looking at rather than the machine.

Stock and money stay the shop's, which is how a shop with three machines and one storeroom actually works: every vending machine sells from the same drinks and snacks, every coffee machine pours from the same cups and beans, and each kind pays into one cash box you can empty at any of them. The drinks fridge is the exception, because you load it by hand: each fridge holds its own cans.

Extra vending machines come in their own livery, red, blue, green and graphite, so a row of them does not read as the same machine pasted four times.

Two smaller things came out of the same work. Where a customer stands to use a machine is now worked out from where that machine actually is, so it follows the thing when you move it in edit mode instead of walking to where it used to be, and a customer picks whichever of your machines they fancy. And the drinks fridge no longer has its stock reset behind your back by an old bit of save-file housekeeping.

## v1.13.2

**Cigarettes could not be handed over.** A customer would ask for a pack of RF Smoking 10s, you would fetch it, and they refused it no matter how many times you pressed E.

The check that decides whether the thing in your hands is wanted only ever read the main order. A cigarette side order is kept on its own line, so a pack always failed that check and the handover never ran, even though the handover itself knew perfectly well what to do with cigarettes. It reads both lines now.

The crosshair had the same blind spot, and that is the half you could actually see. Standing in front of the customer with the right pack in hand, the prompt still said "still wants 3 joints" and never mentioned the smokes at all. It now lists the pack alongside the rest of the order, confirms when the pack you are holding is the one they asked for, and says so plainly when it is not. That last part matters, because the two 10s packs are easy to mix up: RF Smoking 10s is the red pack, RF Smoking Light 10s the pale one with the blue top.

## v1.13.1

**Snow no longer turns the lights out.** Two things were wrong with it.

The falling flakes were correctly only drawn outdoors, but the **fog that comes with the weather was applied everywhere**, indoors included. Snow pulled the fog in to 14 metres, so standing in your own shop the far wall was already fading out. The fog now only closes in when you are actually outside, and snow is the gentlest of the three rather than as thick as rain.

Worse, the fog took its colour straight from the sky, and after dark the sky is almost black. Everything past the fog line went to black, which is what made it so hard to see. **Snow scatters light rather than swallowing it**, so it now lifts the fog well clear of black, rain lifts it a little, and a snowy night also gets a touch more ambient light. A snowy night reads as a pale haze now instead of a wall of black.

## v1.13

**The drinks fridge and the coffee machine got what the vending machine got.**

**The fridge** was pure scenery: a sealed block with four rows of coloured cans painted inside that never changed. It is a real fridge now. A shell with a hinged glass door that swings open, shelves holding the cans you actually have, and a light inside. **E** takes a cold one and you carry it. **Shift+E** opens the door, and it only takes a case of drinks once it is open.

**The coffee machine** shows its stock: the cup stack grows and shrinks with how many cups you own, and the bean hopper on top is a clear cone whose level drops as the beans go, emptying out completely when you run dry. **E** pours one, a cup appears under the spout and fills, and a couple of seconds later **E** on the cup hands you a lidded takeaway with a Grow Co. sleeve. **Shift+E** lifts the hopper lid, and cups and beans only load while it is up.

Both keep taking the cash out of their boxes the same way, by opening them up.

## v1.12

**The vending machine is a real machine now.** The old one was a solid block with its stock sealed inside where nobody could ever see it, and a fixed set of coloured squares that had nothing to do with what you had loaded.

- **You can see in.** The cabinet is built as a shell with a glazed door, so the glass shows the racks behind it. What is on the coils is exactly what the machine is stocked with: cans on the upper shelves, bars below, and they disappear as they sell.
- **It serves you.** Press **E** and a coil turns, the item drops, and it lands in the delivery tray at the bottom. Press **E** on the tray to reach in and take it out. The little display says READY, THANK YOU or SOLD OUT.
- **Refilling means opening it up.** **Shift+E** swings the service door wide on its hinge and slides the racks out; only then will it take a crate. Shift+E again shuts it. Loading a closed machine tells you to open it first.
- Proper cans and bars: a tapered can with a printed wrap, a chamfered top and a ring pull; a flow-wrapped bar with crimped ends. A drink you take from the tray is a thing you carry.
- The cabinet also has a coin slot, a coin return and a keypad, and the coin box is still emptied by opening the machine up.

## v1.11

**The shop is called Grow Co. everywhere now.** The v1.4 rename changed the window, the menu and the installer but never touched the world, so the shop front, the back gate, the delivery van, the register screen, the menu board, the shop dashboard, the creative-mode sign preset and the bug report header all still said the old name. All swept. The RF marks that are meant to be there are untouched: RF Smoking on the cigarettes, RF Supply Co. across town, and the RF lab products.

**The supply rack and the dry room caught up with everything else.** The rack was still stacking plain brown boxes and blank bottles while your hands held the branded versions:

- **Soil** on the rack is the same printed compost sack you carry, **nutrients** the same labelled feed bottle, **pest spray** the same trigger sprayer.
- **Seed packets** on the rack are the foil sachets, not flat cards.
- **Baggies, papers and filter tips** are printed cartons instead of blank boxes.
- **The curing jars in the dry room** were filled with a solid cylinder of flat colour, which read as paint. They hold loose nugs now, more of them the fuller the jar, in the strain's own colour.

Every product model in the game is now built by one function that the hand, the shelf, the cabinet and the rack all call.

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

