# House style

How Grow Co. talks. This page applies to every string a player reads, wherever it lives: the guide, the menus, hover prompts, toasts, the event feed, what people say, the bug report form, the README and this wiki. Code comments are free, but a name that reaches a player follows the word list below.

If you're a person or an agent writing for the game, read this page once, then keep the word list open.

## The voice

A dry friend who has worked a till. Say what happened, then what to do. Plain, warm, specific.

| Instead of | Write |
|---|---|
| Locked (dash) unlock it at the shop control box | It's locked. Unlock it at the control box. |
| Hands full (dash) G to put things down | Your hands are full (G puts things down) |
| That one was a plain-clothes officer! $200 fine, the goods are confiscated, rep -2 | 🚓 "Police. Hands where I can see them." That one was plain-clothes: $200 fine and the goods are gone (heat +20, rep -2) |
| the plants keep growing while you think | Everything waits until you come back. |

- One idea per sentence. If a sentence has a "which" and an "and" and a "so", it's two sentences.
- Contractions are normal in narration and required in speech: it's, don't, you'll, there's.
- **Lounge guests are the exception.** They're formal and don't contract: "Good evening. I would like two of your finest, please."
- Be specific. "Buyers wait about 45 s, then walk off" beats "customers may leave if kept waiting".
- Don't promise what the game doesn't do. If you're not sure a thing works that way, read the code or leave it out.

## Punctuation

- **No em dashes or en dashes, ever.** Not in the game, not in the docs, not in commit messages. Use these instead:
  - A **full stop** between a fact and an instruction: "The bin is full. Bag it up first."
  - A **colon** for a label and its value: "Heat: 42", "Hands full: G puts things back".
  - **"and"** or **"so"** for cause: "The shop's closed, so nobody comes in."
  - **Parentheses** for score changes and key hints: "Refused a fake ID (rep +1)", "Open the garage (E)".
  - "to" for a range: "2 to 5 min", "1 to 6".
- **Real hyphens stay** in compound words: self-defence, pre-installed, two-man, low-quality, non-lethal, plain-clothes, first-person, one-click. Losing them is a bug.
- **No exclamation marks** in UI text. Good news sounds good without one.
- The middle dot ( · ) separates short hints on one line, as in a hover prompt or a menu footer. It never joins two sentences.
- An ellipsis only for something in progress: "Rebuilding the shop…".

## Case

- **Sentence case everywhere**: buttons, headings, tabs, menu items, labels, subtitles. "Report a bug", not "Report A Bug".
- **No caps for emphasis.** Not in text, and not through CSS either: a line of prose never gets `text-transform: uppercase`.
- Proper names keep their capitals: First Harvest Bank, RF Smoking, Green Leaf, Corner Tobacconist, Iron and Oak Arms, Harvest Park, RF Supply Co.
- A sign's own printed words are quoted as printed, like the OPEN sign on the van. That's the sign talking, not you.

## Spelling

UK spelling throughout: licence (the noun), colour, catalogue, mould, centre, armour, tyre, bonnet, self-defence, metre, towards, neighbour, grey, synthesised.

## Numbers and units

- Money: **$1,234**, with a thousands comma and no cents. $220, $1,200.
- Weight, time and distance take a space: **3.5 g**, **45 s**, **5 min**, **8 km/h**, **20 m**.
- Clock times are 24-hour with two digits: **06:00**, **21:30**.
- **%**, never "percent": 15% off, 35% over shop price.
- **×**, never "x": 1.5×, 3 × vape cart.
- In prose, quality is **"quality 70"**, not "q70" or "Q70".
- Anything with a unit is digits. Small counts can be words in prose: three joints, nine steps, one pot.

## Keys

- Combinations have no spaces: **Shift+E**, **Ctrl+E**, **Ctrl+V**.
- Mouse buttons: **right-click**, **left-click** (Right-click at the start of a sentence or a table cell).
- Ranges: **1 to 6**.
- The fixed ones: **Space** jumps (and is the footbrake at the wheel), **Ctrl** crouches, **Ctrl+E** sends a crew member home, **Shift+E** is the second action, **G** or **Q** puts back what you hold, **J** opens the Deliveries screen, **F7** reports a bug.
- In the guide a key is bold: `<b>E</b>`.

## Emoji

- At most one, at the start of a toast. "🚚 Delivery in the back room."
- None in speech. People don't talk in emoji.
- Never a line that is only an emoji.
- The menus already carry one leading icon per button, per guide chapter and per panel title. Treat those like a toast: one, at the start, never inside the running text.

## Voices

Everybody who talks has one habit, so a line tells you who said it. Speech is in sentence case, ends with a full stop or a question mark, never shouts in capitals and never carries an emoji. In the code the lines live in `CUST_VOICE` (customers), `CREW_VOICE` (the crew) and next to each speaker's `say` call.

| Who | Habit | Sounds like |
|---|---|---|
| The guard | Calm and clipped. Calls you boss. Knows the time of day and counts the IDs he really checked. | "ID, please." "Evening, boss." "Checked 14 IDs today." "You. Out. Now." |
| Jo | Cheerful. Calls you boss. | "On it, boss: serve the window." "Floor's clean, boss." |
| Mika | Says as little as possible. | "Right: sweep the floors." "Locked." "Out of 2 bags." |
| Sam | Chats. Calls you mate. | "No bother, mate." "We're clean out of 2 bags, mate." |
| Chill Chad | Laid back. Says man. | "Hey, man." "Close enough, man." |
| Nurse Nadia | Brisk, on her break. Says love. | "Quick one, love. I'm on my break." |
| Old Man Ferns | Old school. Says young'un. | "Exact money, mind." "Is that the best you've got?" |
| Festival Fi | Sunny. Says hun. | "Hiya, hun." "The Rainbow Runtz, amazing." |
| The Professor | Precise. | "I asked for Amber Haze, specifically." "Curious. Please try again." |
| Skater Sam | Slang. Says bro. | "Yo." "Bro, that's short." |
| Lounge guests | Formal, never contract. | "I am afraid that is rather ordinary." "Exquisite. Until next time." |
| Lobby visitors | Relaxed regulars. | "Cheers, boss." "Five more minutes." |
| Van buyers | In a hurry. | "Too slow, mate." "No joints? Forget it." |
| The courier | Businesslike. | "Cash pickup: $500." "Signed for. Cheers." |
| Robbers | Short and cold. No capitals, no exclamation marks: the threat is in the brevity. | "The till. Now." "Empty the till or I shoot." "Locked? Not for long." |
| The police | Official, a line at a time. | "Police. Nobody move." "Hands behind your back. You're coming with us." |

## Names

Use these and only these. The left column is the word; the right is what it replaces.

| Say | Never | Notes |
|---|---|---|
| boot | trunk | Both vehicles have a boot. The van's back door is its tailgate. |
| till | register, drawer | The van's is the **van till**, never "Van register". |
| back room | storeroom, storage room | Where crates land. |
| counter display | | The self-serve lighters, papers and grinders. |
| supply rack | a bare "rack" | The office shelving beside the PC. Other racks keep their full name: the finished goods rack in the basement, the van rack. |
| drying line | drying rack | |
| curing shelf | | |
| workbench | | "The bench" is fine once it's been named. |
| goods shelf | | Where packed goods wait for customers. |
| stock cabinet | | The lockable cabinet for packed goods in the back room. |
| cigarette cabinet | | The shuttered cabinet behind the counter: cigarettes, carts, hash, gummies and chocolate. |
| the window | "the counter", service window | Where customers stand. The counter is the furniture you stand behind. |
| control box | shop control box | The full board in the security room. |
| front panel | front of house panel | The small panel behind the till. |
| office panel | | The small panel in the office. |
| yard, yard gate | | The gate opens for your vehicles. |
| garage | | Where your car lives. Its roller door opens with E. |
| the bay under the canopy | the owner bay, the garage bay | Where your van lives. |
| the lane, the barrier | | From the yard gate to the back street. The barrier lifts as you drive up. |
| the shop | the grow house | The building. The game is a "first-person shop simulator". |
| bag | | The product: a bag of bud. |
| baggies | | The empties you bag into. |
| an eighth | | A weight only, never the product's name. |
| joints, cookies | | |
| pest spray | remedy | |
| nutrients | | |
| quality, rep, heat | reputation, police heat | |
| pocket, tip jar, vault, bank | | Where money sits. |
| First Harvest Bank | | The bank in town. |
| Supplies, Seed bank, Gear, Licences, Staff, Bank | | The office PC apps, spelled as on screen. |
| the guard | Security (as a name) | The security room keeps its name: it is a room. |
| crew | assistant, worker | Jo, Mika and Sam. "A crew member", "your crew". |
| driver, basement operator, night guard | | Hired on the staff roster. |
| snatch thief, knife robber, gunman, gang | robbery crew, armed robber | "Crew" belongs to your staff, so robbers are a gang. |
| burner, tablet, the Deliveries screen | burner phone, the board | |
| RF Smoking, the line, packs, cartons | | The basement cigarette works. |
| bin, bin bag, dumpster | trash can, trash bag | Empties go in the bin. A full bin is bagged and taken to the dumpster in the yard. |
| the supplier's van | the truck | Deliveries arrive in it. Your own van is "the van". |

## Facts writers keep getting wrong

Check these against the code before you repeat them, because they have changed before.

- A new shop starts with **$220**, a small tent and one pot. **No seed.** The guided intro pays **$1,200** when all nine steps are done.
- The pause menu stops everything. Nothing grows, nobody moves.
- Since 1.20 the **car lives in the garage** and the **van in the bay under the canopy**. The car's boot loads and unloads at home with Shift+E.
- A **locked door stops customers**. Your **crew and the guard carry keys**: they unlock it, walk through and it locks again behind them, unless you took that door's key back on the control box. A robber forces it. A door somebody walks through shuts itself 4 s after they're clear.
- Up to **three crew**, hired on the office PC under Staff. The guard is there from the start. The driver, the basement operator and the night guard come off the staff roster.
- Content packs are toggled freely and applied once. The shop rebuilds when you apply, not on every toggle.

## Before you commit

1. No dashes: in bash, `grep -rn -e $'\xe2\x80\x94' -e $'\xe2\x80\x93' game docs README.md .github` should print nothing from your change. (Those are the em and en dash as UTF-8 bytes, so the command works whatever your locale.)
2. No exclamation marks in strings a player reads.
3. No banned words: `grep -rniE "trunk|register|storeroom|remedy|assistant|robbery crew|percent" --exclude=House-Style.md docs game/guide.js`.
4. If you touched `game/guide.js`, run `npm run guide` so the [Player guide](Player-Guide) page matches.
5. Read it out loud. If it sounds like a manual, it's too stiff. If it sounds like an advert, it's too keen.
