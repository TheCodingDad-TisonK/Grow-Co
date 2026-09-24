# Getting started

## Install

**Windows.** Download `Grow-Co-Setup-x.y.z.exe` from the [latest release](https://github.com/TheCodingDad-TisonK/Grow-Co/releases/latest) and run it. One click: it installs for your user account, adds a Desktop shortcut and a Start menu entry, and starts the game. No admin rights needed.

Windows may show a blue SmartScreen box saying it protected your PC. That's because the installer isn't code signed, which costs money an indie project doesn't spend. Choose **More info**, then **Run anyway**.

To remove the game: Settings, Apps, Grow Co, Uninstall. Your save is kept in your user profile and survives a reinstall.

**Any platform, from source.** You need [Node.js](https://nodejs.org) 18 or newer.

```bash
git clone https://github.com/TheCodingDad-TisonK/Grow-Co.git
cd Grow-Co
npm install
npm start        # desktop app
npm run serve    # or in a browser at http://127.0.0.1:8420/
```

## Your first sale

A new shop starts with $220, a small tent and one pot. There's no seed, so that's your first buy.

1. From the main menu, **Start** an empty slot. Click the scene to capture the mouse.
2. Go to the **office** (left of the hall) and sit at the desk and use the **PC**. Order soil and baggies under **Supplies**, a seed in the **Seed bank**, and a grinder. The workbench won't bag without one.
3. Carry the soil to the **grow tent**, fill the pot and plant the seed. Water it with the can beside the tent when it asks.
4. A plant that's ready glows. Harvest it with empty hands and hang it on the **drying line** in the dry room.
5. When a jar appears on the **curing shelf**, carry it to the **workbench** in the processing room and empty it. Bag some eighths.
6. Open the shop at the **control box** (it starts in the security room, and F2 lets you hang it anywhere) or the **front panel** behind the till.
7. A customer comes to **the window**. Take what they want from the **goods shelf**, press E on them to hand it over, then take the money at the **till**.

The **Guide** button in the main menu, and "How to play" in the pause menu, cover everything after that. So does the [Player guide](Player-Guide) page here.

## Saves

There are **three save slots**. The main menu lists them with their day, level and money. Each has its own button, and its own delete button with a confirmation. Switching slot reloads the game.

The game saves by itself, all the time. The desktop app keeps the save in its own local storage inside your user profile. In a browser it lives in that browser's storage for that address. The delete button on a slot erases that shop, and **Reset save** in the pause menu erases the one you're playing.

Add `?save=name` to the address (browser or `npm run serve`) to play a separate save slot, which is handy for testing.
