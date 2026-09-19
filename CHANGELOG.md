# Changelog

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

