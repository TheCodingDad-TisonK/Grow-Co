# Changelog

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

