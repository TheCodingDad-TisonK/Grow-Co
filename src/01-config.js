//@ config tables (strains, lights, tents, supplies, upgrades, licences) and the Workshop fold-in
  // ── Config (identical numbers to the 2D game) ─────────────────────
  var STRAINS = [
    { id: 'sunflower', name: 'Sunflower Kush', emoji: '🌻', seed: 10,  growMs: 3600000, yield: 12, thc: 1.0, lvl: 1, bud: 0x7fc96b, hair: 0xffb347, leaf: 0x4caf50 },
    { id: 'amber',     name: 'Amber Haze',     emoji: '🍯', seed: 18,  growMs: 4320000, yield: 16, thc: 1.3, lvl: 2, bud: 0xa8c95a, hair: 0xff8c1a, leaf: 0x5cb85c },
    { id: 'widow',     name: 'Green Widow',    emoji: '🕸️', seed: 32,  growMs: 5040000, yield: 24, thc: 1.5, lvl: 4, bud: 0xd8e6c8, hair: 0xffd27f, leaf: 0x3d9a4a },
    { id: 'diesel',    name: 'Diesel Drift',   emoji: '⛽', seed: 48,  growMs: 5760000, yield: 18, thc: 1.9, lvl: 6, bud: 0x6fa85a, hair: 0xff5722, leaf: 0x2e7d32 },
    { id: 'runtz',     name: 'Rainbow Runtz',  emoji: '🌈', seed: 85,  growMs: 6480000, yield: 22, thc: 2.4, lvl: 9, bud: 0x9b6fd6, hair: 0xff69b4, leaf: 0x5a3f9e }
  ];
  var strainById = function (id) { for (var i = 0; i < STRAINS.length; i++) if (STRAINS[i].id === id) return STRAINS[i]; return STRAINS[0]; };

  var SUPPLIES = [
    { id: 'soil',      ico: '🪴', name: 'Bag of soil',      price: 4,  hint: 'One per planting' },
    { id: 'pot',       ico: '🫙', name: 'Grow pot',         price: 12, hint: 'A reusable grow slot' },
    { id: 'nutrients', ico: '🧪', name: 'Nutrients',        price: 6,  hint: 'Feed a plant: +yield, +quality' },
    { id: 'remedy',    ico: '🧴', name: 'Pest spray',       price: 9,  hint: 'Cures a pest or mould outbreak' },
    { id: 'bag',       ico: '🛍️', name: 'Baggies (×10)',    price: 8,  qty: 10, hint: 'Package eighths' },
    { id: 'paper',     ico: '📄', name: 'Papers (×20)',     price: 6,  qty: 20, hint: 'Roll joints' },
    { id: 'tip',       ico: '🚬', name: 'Filter tips (×20)', price: 4, qty: 20, hint: 'Roll joints' },
    { id: 'grinder',   ico: '⚙️', name: 'Grinder',          price: 60, tool: true, hint: 'Bought once. The workbench needs it to bag or roll' },
    { id: 'jar',       ico: '🏺', name: 'Curing jar',       price: 15, hint: 'One batch cures per jar, and two always can; the rest wait on the shelf' },
    { id: 'mix',       ico: '🍪', name: 'Cookie mix (6 cookies)', price: 8, hint: 'Bake edibles at the bench: one box + 1 g of stash' },
    { id: 'lighter',   ico: '🔥', name: 'Lighters (box of 20)', price: 10, qty: 20, stock: 'display', hint: 'Counter display · sells for $3' },
    { id: 'rpaper',    ico: '📄', name: 'Retail papers (×10)', price: 12, qty: 10, stock: 'display', hint: 'Counter display · sells for $4' },
    { id: 'rgrinder',  ico: '⚙️', name: 'Grinders (×5)',      price: 30, qty: 5,  stock: 'display', hint: 'Counter display · sells for $15' },
    { id: 'drink',     ico: '🥤', name: 'Drinks (case of 12)', price: 18, qty: 12, stock: 'vend', hint: 'Restock the vending machine' },
    { id: 'snack',     ico: '🍫', name: 'Snacks (box of 12)',  price: 15, qty: 12, stock: 'vend', hint: 'Restock the vending machine' },
    { id: 'cup',       ico: '🥡', name: 'Cups (sleeve of 50)', price: 10, qty: 50, stock: 'coffee', hint: 'For the lobby coffee machine' },
    { id: 'beans',     ico: '☕', name: 'Coffee beans (40 cups)', price: 30, qty: 40, stock: 'coffee', hint: 'For the lobby coffee machine' }
  ];
  function supplyById(id) { for (var i = 0; i < SUPPLIES.length; i++) if (SUPPLIES[i].id === id) return SUPPLIES[i]; return null; }
  function itemName(id) { if (id.indexOf('seed_') === 0) return strainById(id.slice(5)).name + ' seeds'; var it = supplyById(id); return it ? it.name.replace(/ \(.*\)$/, '') : id; }
  function itemIcon(id) { if (id.indexOf('seed_') === 0) return strainById(id.slice(5)).emoji; var it = supplyById(id); return it ? it.ico : '📦'; }
  var ACC = { lighter: { name: 'lighter', pl: 'lighters', price: 3 }, rpaper: { name: 'pack of papers', pl: 'packs of papers', price: 4 }, rgrinder: { name: 'grinder', pl: 'grinders', price: 15 } };
  function itemPack(id) { if (id.indexOf('seed_') === 0) return 5; var it = supplyById(id); return it && it.qty ? it.qty : 10; }
  var LIGHTS = [
    { id: 'none', name: 'Windowsill', spd: 1.0,  qual: 0,  yld: 0.85, draw: 0,  price: 0,   color: 0xfff1d0, intensity: 0.0 },
    { id: 'cfl',  name: 'CFL lamp',   spd: 1.05, qual: 6,  yld: 0.95, draw: 0.8,  price: 60,  color: 0xfff4c8, intensity: 2.5 },
    { id: 'led',  name: 'LED panel',  spd: 1.12, qual: 12, yld: 1.15, draw: 1.8, price: 260, color: 0xd070ff, intensity: 4.5 },
    { id: 'hps',  name: 'HPS rig',    spd: 1.18, qual: 18, yld: 1.35, draw: 5.0, price: 800, color: 0xffb060, intensity: 6.0 },
    { id: 'qb',   name: 'Quantum board', spd: 1.26, qual: 26, yld: 1.55, draw: 3.6, price: 2600, color: 0xffe6ff, intensity: 7.5 },
    { id: 'array', name: 'Full-spectrum array', spd: 1.35, qual: 34, yld: 1.80, draw: 6.0, price: 7000, color: 0xfff8f0, intensity: 9.0 }
  ];
  var TENTS = [
    { slots: 4,  price: 0,    cols: 2, rows: 2 },
    { slots: 6,  price: 240,  cols: 3, rows: 2 },
    { slots: 9,  price: 900,  cols: 3, rows: 3, lic: 'cult2' },
    { slots: 12, price: 2600, cols: 4, rows: 3, lic: 'cult2' },
    { slots: 16, price: 7000, cols: 4, rows: 4, lic: 'cult3' },
    { slots: 20, price: 16000, cols: 5, rows: 4, lic: 'cult3' }
  ];
  // ── Workshop: content packs fold into the tables above before anything reads them ──
  var WS = window.RF_WORKSHOP || null, WSTUNE = { footfall: 1, seedCost: 1, upgradeCost: 1 }, WSCITY = { grow: 0, rows: 0 }, WSFEST = { snow: false, fireworks: false }, WSCAR = null, WSPLACES = [];
  function wsMerge(list, adds, key) {   // a pack entry with an id already in the table replaces it, otherwise it is appended
    (adds || []).forEach(function (a) {
      if (key) { for (var i = 0; i < list.length; i++) if (list[i][key] === a[key]) { list[i] = a; return; } }
      list.push(a);
    });
  }
  if (WS) {
    try {
      WSTUNE = WS.tune(); WSCITY = WS.city(); WSFEST = WS.festive(); WSCAR = WS.vehicle(); WSPLACES = WS.places();
      wsMerge(STRAINS, WS.strains(), 'id'); wsMerge(LIGHTS, WS.lights(), 'id'); wsMerge(SUPPLIES, WS.supplies(), 'id');
      wsMerge(TENTS, WS.tents()); TENTS.sort(function (a, b) { return a.slots - b.slots; });
      SUPPLIES.forEach(function (s) { if (s.stock === 'display' && s.sell && !ACC[s.id]) ACC[s.id] = { name: s.name.replace(/ \(.*\)$/, '').toLowerCase(), price: s.sell }; });
      if (WSTUNE.seedCost !== 1) STRAINS.forEach(function (s) { s.seed = Math.max(1, Math.round(s.seed * WSTUNE.seedCost)); });
      if (WSTUNE.upgradeCost !== 1) { LIGHTS.forEach(function (l) { l.price = Math.round(l.price * WSTUNE.upgradeCost); }); TENTS.forEach(function (t) { t.price = Math.round(t.price * WSTUNE.upgradeCost); }); }
    } catch (e) { console.warn('[workshop] a pack could not be applied:', e); }
  }
  var UPGRADES = [
    { id: 'autowater', ico: '💧', name: 'Auto-waterer',      price: 300, d: 'Plants never go thirsty again.' },
    { id: 'roller',    ico: '🤖', name: 'Rolling machine',   price: 360, d: 'Roll 5 joints at once, no paper/tip waste.' },
    { id: 'rack',      ico: '🗄️', name: 'Curing rack',       price: 220, d: 'Curing is 60% faster and reaches higher quality.' },
    { id: 'security',  ico: '🛡️', name: 'Security & sealing', price: 520, d: 'Halves the chance of pest and mould outbreaks.' },
    { id: 'dehumid',   ico: '🌬️', name: 'Industrial dehumidifiers', price: 320, d: 'Both units pull moisture twice as fast and can be set as low as 40%.' },
    { id: 'doser',     ico: '🧪', name: 'Nutrient doser',    price: 450, d: 'Every plant is fed automatically when it starts flowering.' },
    { id: 'trimmer',   ico: '✂️', name: 'Trimming machine',  price: 600, d: 'Cleaner harvests: +15% yield from every plant.' },
    { id: 'sign',      ico: '🪧', name: 'Neon sign & flyers', price: 380, d: 'Word gets round: customers turn up 35% more often.' },
    { id: 'lobby',     ico: '☕', name: 'Lobby coffee machine', price: 300, d: 'Customers wait 50% longer and tip a little rep.' },
    { id: 'robovac',   ico: '🤖', name: 'Robot vacuum',      price: 480, d: 'Dust builds up half as fast.' },
    { id: 'rack2',     ico: '🧊', name: 'Climate cure cabinet', price: 1800, req: 'rack', d: 'Curing 2.4× faster and +20 quality cap.' },
    { id: 'hydro',     ico: '💦', name: 'Hydroponic loop',   price: 4000, req: 'autowater', d: 'Plants grow 12% faster.' },
    { id: 'security2', ico: '📹', name: 'CCTV & alarms',     price: 2600, req: 'security', d: 'Outbreaks cut to a quarter.' },
    { id: 'panic',     ico: '🚨', name: 'Silent alarm',      price: 450, d: 'Press P during a robbery: police arrive in about 20 s and arrest whoever is still inside.' },
    { id: 'guardgun',  ico: '🦺', name: 'Armed guard',    price: 2400, d: 'Your guard carries a sidearm and stands up to armed robbers far more often. Only counts while you hold the firearms licence.' },
    { id: 'roller2',   ico: '🏭', name: 'Industrial roller', price: 1800, req: 'roller', d: 'Rolls 10 joints at a time.' },
    { id: 'hvac',      ico: '❄️', name: 'Climate control HVAC', price: 7000, req: 'dehumid', d: 'Humidity locks to target almost instantly and rooms run drier.' },
    { id: 'trimmer2',  ico: '🔪', name: 'Precision trimmer', price: 4200, req: 'trimmer', d: '+30% yield in total.' },
    { id: 'billboard', ico: '🛣️', name: 'Billboard & socials', price: 3600, req: 'sign', d: 'Customers turn up 60% more often in total.' },
    { id: 'lounge2',   ico: '🛋️', name: 'Lobby refit',       price: 2400, req: 'lobby', d: 'Customers wait twice as long and tip 2 rep.' },
    { id: 'genetics',  ico: '🧬', name: 'Genetics lab',      price: 12000, lvl: 8, d: 'Every new plant starts with +10 quality.' },
    { id: 'ownvan',    ico: '🚐', name: 'Own delivery van',  price: 16000, lvl: 6, d: 'Orders land in the back room within 20 seconds.' },
    { id: 'solar',     ico: '☀️', name: 'Solar roof',        price: 9000, d: 'Supplies cost 10% less (stacks with a wholesale account) and the power bill falls by 35%.' },
    { id: 'scale',     ico: '⚖️', name: 'Digital scale',     price: 260,  d: 'Eighths weigh out at 3.2 g instead of 3.5 g.' },
    { id: 'cones',     ico: '🍦', name: 'Pre-rolled cones',  price: 700,  d: 'Joints take 0.8 g instead of 1 g.' },
    { id: 'skylight',  ico: '🌤️', name: 'Skylight',          price: 2200, d: 'Plants grow 6% faster.' },
    { id: 'fintech',   ico: '💳', name: 'Payment terminal',  price: 1800,  d: 'Card sales pay 3% more and the ATM waives its fee.' },
    { id: 'ozone',     ico: '🫧', name: 'Ozone air scrubber', price: 700, d: 'Mould never takes hold, only pests.' },
    { id: 'tipjar',    ico: '🫙', name: 'Vintage tip jar',   price: 350,  d: 'Tips are doubled.' },
    { id: 'grinder2',  ico: '⚡', name: 'Electric grinder',  price: 400,  d: 'No more hand grinding before bagging or rolling.' },
    { id: 'bagger',    ico: '🏭', name: 'Auto-bagging line', price: 6000, req: 'scale', d: 'Bags weigh and seal themselves, so a whole stash bags in one go.' },
    { id: 'oven',      ico: '🔥', name: 'Convection oven',   price: 600,  d: 'Cookies bake themselves to the second, so a whole stash bakes in one go.' }
  ];
  if (WSTUNE.upgradeCost !== 1) UPGRADES.forEach(function (u) { u.price = Math.round(u.price * WSTUNE.upgradeCost); });
  var LICENCES = [
    { id: 'retail',    ico: '🪪', name: 'Retail licence',       price: 800,  lvl: 2,  d: 'Customers may pay by card. Without it everyone pays cash.' },
    { id: 'catering',  ico: '☕', name: 'Vending & catering permit', price: 450, d: 'The vending machine and coffee machine may sell.' },
    { id: 'amusement', ico: '🕹️', name: 'Amusement permit',     price: 400,  d: 'The arcade cabinet may take coins.' },
    { id: 'lounge',    ico: '🛋️', name: 'Lounge licence',       price: 700,  rep: 25, d: 'Customers may sit and smoke in the lobby, and each one buys a joint off the goods shelf to do it.' },
    { id: 'cult2',     ico: '🌱', name: 'Cultivation permit II', price: 900, lvl: 3, d: 'Unlocks the ' + tentSizes('cult2') + ' tents and the roof greenhouse beds. Plants grow 5% faster.' },
    { id: 'cult3',     ico: '🌳', name: 'Cultivation permit III', price: 6000, lvl: 6, req: 'cult2', d: 'Unlocks the ' + tentSizes('cult3') + ' tents.' },
    { id: 'wholesale', ico: '📦', name: 'Wholesale account',    price: 3600, lvl: 4, d: 'Supplies 15% cheaper and the van comes twice as fast.' },
    { id: 'tobacco',   ico: '🚬', name: 'Tobacco manufacturing licence', price: 3000, d: 'Run the RF Smoking line in the basement: grow, cure, roll and pack your own cigarettes.' },
    { id: 'firearm',   ico: '🔫', name: 'Firearms licence',     price: 3000, lvl: 4, rep: 30, d: 'Lets you buy and carry the pistol and shotgun from the weapon locker. Shoot a bystander and it\'s revoked.' },
    { id: 'premium',   ico: '🎩', name: 'Connoisseur permit',   price: 3000, rep: 40, d: 'Connoisseurs visit and pay 2.2× for quality.' },
    { id: 'latehours', ico: '🌙', name: 'Late-hours licence',   price: 1000, rep: 50, d: 'From 20:00 to 02:00 customers come a third more often and pay 5% more.' },
    { id: 'brand',     ico: '®️', name: 'Brand registration',   price: 4000, rep: 60, d: '+4% on every price.' },
    { id: 'export',    ico: '🚢', name: 'Export licence',       price: 14000, lvl: 10, rep: 120, d: 'Bulk contracts under Bank on the office PC: sell up to 100 g of a strain at 70% of gram value, paid next day.' }
  ];
  function tentSizes(lic) {   // '9 and 12-slot': read off the tent table, so a pack tent that needs the permit is named with the rest
    var n = TENTS.filter(function (t) { return t.lic === lic; }).map(function (t) { return t.slots; });
    return n.length ? (n.length > 1 ? n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1] : n[0]) + '-slot' : 'bigger';
  }
  function licById(id) { for (var i = 0; i < LICENCES.length; i++) if (LICENCES[i].id === id) return LICENCES[i]; return null; }
  function hasLic(id) { return !!(S.lic && S.lic[id]); }
  function nightNow() { var h = gameHour(); return h >= 20 || h < 2; }
  function bagGrams() { return S.upgrades.scale ? 3.2 : 3.5; }
  function jointGrams() { return S.upgrades.cones ? 0.8 : 1; }
  function supplyDisc() { return (hasLic('wholesale') ? 0.85 : 1) * (S.upgrades.solar ? 0.9 : 1); }
  var DRY_MS_BASE = 135000, CURE_CAP_BASE = 22, THIRST_RATE = 1 / 450, HAZARD_CHANCE = 0.002;
  var STAGES = [
    { p: 0.12, key: 'germ',   label: 'Germinating' },
    { p: 0.40, key: 'seed',   label: 'Seedling' },
    { p: 0.70, key: 'veg',    label: 'Vegetative' },
    { p: 1.00, key: 'flower', label: 'Flowering' }
  ];
  function stageFor(p) { for (var i = 0; i < STAGES.length; i++) if (p < STAGES[i].p) return STAGES[i]; return { key: 'ready', label: 'Ready' }; }
  var XP_PER_LEVEL = function (lvl) { return 60 + (lvl - 1) * 55; };
  var CUSTOMERS = [
    { who: 'Chill Chad', a: '🧑‍🌾', c: 0x4a7fbf }, { who: 'Nurse Nadia', a: '👩‍⚕️', c: 0xe9eef5 }, { who: 'Old Man Ferns', a: '🧓', c: 0x8a6b4a },
    { who: 'Festival Fi', a: '💃', c: 0xd64a9a }, { who: 'The Professor', a: '🧑‍🏫', c: 0x5a4a8a }, { who: 'Skater Sam', a: '🛹', c: 0x3aa36a }
  ];
  // how each regular talks: one habit each, so a line tells you who said it. {x} is filled in by the caller.
  var CUST_VOICE = {
    _: { hi: 'Hi there', thanks: 'Thanks', bye: 'Never mind', grab: 'Grabbing a {x} too', noAcc: 'No {x}? Shame', hurt: 'Ow. What the…', angry: 'You\'re out of your mind', noSmokes: 'No smokes for me, thanks', wrongSmokes: 'No, the {x}', smokes: 'And the smokes, cheers', more: 'One more of those', wrong: 'No, {x}, please', said: 'I said {x}', sub: 'Not what I asked for, but fine', match: 'Ooh, the {x}', better: 'Got anything better?', andMore: 'And {x}…', card: 'Card okay? {x}', cash: 'Here you go. {x}', declined: 'Declined? Try it again', short: 'That\'s short', remind: '{x}, when you can', queue: 'Is this line even moving?' },
    'Chill Chad': { hi: 'Hey, man', thanks: 'Sweet, thanks, man', bye: 'Eh, never mind, man', sub: 'Close enough, man', match: 'Oh nice, the {x}, man', better: 'Got anything better, man?', card: 'Card alright, man? {x}', cash: 'There you go, man. {x}', declined: 'Weird. Again, man?', short: 'That\'s short, man', angry: 'Not cool, man', said: 'Nah, man, I said {x}' },
    'Nurse Nadia': { hi: 'Quick one, love. I\'m on my break', thanks: 'Lovely, ta', bye: 'Can\'t wait, love. I\'m due back', sub: 'That\'ll do, love', match: 'Ooh, the {x}. Lovely', better: 'Anything better, love?', card: 'Card, love. {x}', cash: 'There you go, love. {x}', declined: 'Once more, love', short: 'That\'s short, love', angry: 'I\'ll be reporting that', said: 'I said {x}, love' },
    'Old Man Ferns': { hi: 'Hello there, young\'un', thanks: 'Much obliged', bye: 'I haven\'t got all day, you know', sub: 'Hmph. That\'ll have to do', match: 'The {x}. Very good', better: 'Is that the best you\'ve got?', card: 'You take cards these days? {x}', cash: 'Exact money, mind. {x}', declined: 'Blasted thing. Again', short: 'You\'ve short-changed me, young\'un', angry: 'In my day, that got you locked up', said: 'I said {x}, young\'un' },
    'Festival Fi': { hi: 'Hiya, hun', thanks: 'Amazing, thank you, hun', bye: 'Got to dash, hun', sub: 'Ooh, a new one. Go on then', match: 'The {x}, amazing', better: 'Anything a bit nicer, hun?', card: 'Card okay, hun? {x}', cash: 'Here you go, hun. {x}', declined: 'Oops. Try again?', short: 'Bit short there, hun', angry: 'Not the vibe, hun', said: 'I said {x}, hun' },
    'The Professor': { hi: 'Good day', thanks: 'Thank you. Most efficient', bye: 'I have a lecture. Good day', sub: 'An acceptable substitute', match: 'The {x}, precisely', better: 'I had hoped for better', card: 'Card, if you would. {x}', cash: '{x}, the correct amount', declined: 'Curious. Please try again', short: 'That\'s short, by my count', angry: 'That was quite uncalled for', said: 'I asked for {x}, specifically' },
    'Skater Sam': { hi: 'Yo', thanks: 'Sick, cheers', bye: 'Got to bounce', sub: 'Eh, that works', match: 'The {x}, sick', better: 'Got anything better, bro?', card: 'Card cool? {x}', cash: 'Here, bro. {x}', declined: 'Huh. Again?', short: 'Bro, that\'s short', angry: 'Bro, what?', said: 'Nah, bro, {x}' }
  };
  function custLine(who, key, x) { var v = CUST_VOICE[who] || {}; var s = v[key] !== undefined ? v[key] : CUST_VOICE._[key]; return String(s).replace('{x}', x === undefined ? '' : x); }

