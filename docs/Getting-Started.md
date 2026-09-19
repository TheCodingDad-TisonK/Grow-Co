# Getting started

## Install

**Windows.** Download `RF-Grow-Co-Setup-x.y.z.exe` from the [latest release](https://github.com/TheCodingDad-TisonK/RF-Grow-Co/releases/latest) and run it. One click: it installs for your user account, adds a Desktop shortcut and a Start menu entry, and starts the game. No admin rights needed.

Windows may show a blue SmartScreen box saying it protected your PC. That is because the installer is not code signed, which costs money an indie project does not spend. Choose **More info**, then **Run anyway**.

To remove the game: Settings, Apps, RF Grow Co, Uninstall. Your save is kept in your user profile and survives a reinstall.

**Any platform, from source.** You need [Node.js](https://nodejs.org) 18 or newer.

```bash
git clone https://github.com/TheCodingDad-TisonK/RF-Grow-Co.git
cd RF-Grow-Co
npm install
npm start        # desktop app
npm run serve    # or in a browser at http://127.0.0.1:8420/
```

## Your first sale

1. From the main menu, **Start your shop**. Click the window to capture the mouse.
2. Go to the **office** (left of the hall) and use the **laptop**. Order soil, a seed and baggies.
3. Carry the soil to the **grow tent**, fill the pot, plant the seed. Water it with the can beside the tent when it asks.
4. Harvest the glowing **READY** plant with empty hands and hang it on the **drying line** in the dry room.
5. When a jar appears on the **curing shelf**, carry it to the **workbench** in the processing room and empty it. Bag some eighths.
6. Open the shop at the **shop control box** (it starts in the security room; F2 lets you hang it anywhere).
7. A customer comes to the **service window**. Take what they want from the **goods shelf**, hand it through the window, then take the payment at the **register**.

The **Guide** button in the main menu, and "How to play" in the pause menu, cover everything after that. So does the [Player guide](Player-Guide) page here.

## Saves

The game saves by itself, all the time. The desktop app keeps the save in its own local storage inside your user profile. In a browser it lives in that browser's storage for that address. **New game** in the main menu erases it; so does **Reset save** in the pause menu.

Add `?save=name` to the address (browser or `npm run serve`) to play a separate save slot, which is handy for testing.
