//@ interaction: prompts and what E does
  // ── Interaction ───────────────────────────────────────────────────
  var ray = new THREE.Raycaster(); ray.layers.enable(TOWN_LAYER); ray.far = 3.4; var center = new THREE.Vector2(0, 0);
  var focus = null;
  function updateFocus() {
    if (edit.on || runHooks(hooks.blockFocus)) return;
    if (ui.blocked() || !player.locked || drive.on) { setFocus(null); return; }
    ray.setFromCamera(center, camera);
    var hits = ray.intersectObjects(world.interact, false);
    var best = null;
    for (var i = 0; i < hits.length; i++) { var h = hits[i]; var hd = h.object.userData.interact; if (!hd || inGoneProp(h.object) || (hd.dlc && !dlcOn(hd.dlc))) continue;   /* a removed piece of furniture takes no E, and neither does anything left inside it */ if (hd.kind === 'curtain' && curtainOpen(hd.key) && hasAnyBehind(hits, i)) continue; if (isContainer(hd.kind) && hasSpecificBehind(hits, i)) continue; best = h; break; }
    if (!best) { setFocus(null); return; }
    var data = best.object.userData.interact;
    if (data.kind === 'slot' && !data.noPot && plantAtSlot(data.slot)) data = { kind: 'plant', pid: plantAtSlot(data.slot).id };
    setFocus({ mesh: best.object, data: data, dist: best.distance });
  }
  // big station boxes (shelf, rack, bench) yield to the small thing inside them the ray also crosses
  function isContainer(kind) { return kind === 'door' || kind === 'shelf' || kind === 'inventory' || kind === 'bench' || kind === 'line' || kind === 'goodsShelf' || kind === 'storage' || kind === 'car' || kind === 'vending' || kind === 'lobbyCoffee'; }   // a container yields to a specific target behind it (jar, bag, joint, a car door or the boot)
  function hasAnyBehind(hits, i) { for (var k = i + 1; k < hits.length; k++) { var d = hits[k].object.userData.interact; if (d && d.kind !== 'curtain' && hits[k].distance - hits[i].distance < 3.0) return true; } return false; }
  function hasSpecificBehind(hits, i) { var h = held(); for (var k = i + 1; k < hits.length; k++) { var d = hits[k].object.userData.interact; if (!d || isContainer(d.kind)) continue; if (d.kind === 'jar' && h && h.kind === 'harvest') continue; if (hits[k].distance - hits[i].distance < 1.2) return true; } return false; }
  var focusUi = { cross: null, html: '', node: null };   /* the crosshair element, and the prompt last written with the node it made */
  function setFocus(f) {
    focus = f; var pr = $('h-prompt'); var ch = focusUi.cross || (focusUi.cross = document.querySelector('.g3-crosshair'));
    if (!f) { pr.hidden = true; ch.classList.remove('hot'); return; }
    ch.classList.add('hot'); pr.hidden = false;
    var html = '<b>E</b>' + promptFor(f.data);
    if (html !== focusUi.html || pr.firstChild !== focusUi.node) { pr.innerHTML = html; focusUi.html = html; focusUi.node = pr.firstChild; }   /* only a changed prompt is rewritten; edit and creative mode write here too, which the node check catches */
  }
  function promptFor(d) {
    var h = held();
    if (d.kind === 'plant') {
      var p = plantById(d.pid); if (!p) return 'Plant'; var st = strainById(p.strain); var sg = stageFor(p.progress);
      var info = '<small>' + sg.label + ' ' + Math.round(p.progress * 100) + '% · q' + Math.round(p.quality) + (p.hazard ? ' · ⚠ ' + (p.hazard === 'pest' ? 'pests' : 'mould') : '') + (!S.upgrades.autowater && p.thirst > 0.6 ? ' · 💧 thirsty' : '') + (p.fed ? ' · fed' : '') + '</small>';
      if (p.progress >= 1) return h ? 'Free your hands to harvest ' + st.name + ' <small>G puts things down</small>' : 'Harvest ' + st.name + ' <small>ready · q' + Math.round(p.quality) + '</small>';
      if (h && h.kind === 'can') return (S.upgrades.autowater ? 'Auto-watered ' : 'Water ') + st.name + ' ' + info;
      if (h && h.kind === 'nutrients') return (p.fed ? 'Already fed: ' : 'Feed ') + st.name + ' ' + info;
      if (h && h.kind === 'remedy') return (p.hazard ? 'Spray the ' + (p.hazard === 'pest' ? 'pests' : 'mould') + ' on ' : 'Nothing to spray on ') + st.name + ' ' + info;
      return 'Inspect ' + st.name + ' ' + info;
    }
    if (d.kind === 'slot') {
      if (d.noPot) return 'Empty slot <small>bring a pot from the supply rack</small>';
      var soiled = !!(S.potSoil && S.potSoil[d.slot]);
      if (h && h.kind === 'soil') return soiled ? 'That pot already has soil' : 'Fill the pot with soil';
      if (h && h.kind === 'seed') return soiled ? 'Plant ' + strainById(h.strain).name : 'Needs soil first <small>grab a bag from the supply rack</small>';
      return soiled ? 'Pot with soil <small>bring a seed from the supply rack</small>' : 'Empty pot <small>bring soil, then a seed</small>';
    }
    if (d.kind === 'rackItem') { var n = d.item.indexOf('seed_') === 0 ? (S.supplies[d.item] || 0) : (S.supplies[d.item] || 0); return 'Take ' + d.label + ' <small>' + n + ' on the supply rack</small>'; }
    if (d.kind === 'inventory' && h && h.kind === 'crate') return (h.item.indexOf('seed_') === 0 || (supplyById(h.item) && !supplyById(h.item).stock)) ? 'Stock the supply rack with ' + h.n + ' × ' + itemName(h.item) : 'That goes in a machine, not on the supply rack';
    if (d.kind === 'inventory') return 'Supply rack <small>' + (S.supplies.soil || 0) + ' soil · ' + (S.supplies.nutrients || 0) + ' nutrients · ' + (S.supplies.remedy || 0) + ' spray · ' + ((S.supplies.pot || 0) - S.plants.length) + ' pots</small>';
    if (d.kind === 'laptop') return 'Use the PC <small>' + (sit.on && sit.spot === world.officeSeat ? 'supplies · seed bank · gear · licences · staff · bank' : 'E sits you at the desk and brings up the desktop') + '</small>';
    if (d.kind === 'bench') { if (h && h.kind === 'jar') return 'Empty jar into the ' + strainById(h.strain || 'sunflower').name + ' stash <small>' + gram(h.grams) + '</small>'; if (h && h.kind === 'harvest') return 'Hang it on the drying line first'; return 'Workbench <small>' + gram(S.cured.g) + ' cured · ' + S.pkg.bags.n + ' bags · ' + S.pkg.joints.n + ' joints</small>'; }
    if (d.kind === 'lot' && !shutterOpen('goodsShelf')) return 'Goods shelf <small>' + (isLocked('goodsShelf') ? '🔒 locked' : 'gate down') + '</small>';
    if (d.kind === 'lot') { var lot0 = lotOf(d.item, d.strain), sn = strainById(d.strain).name; if (h && (h.kind !== d.item || (h.strain && h.strain !== d.strain)) && hotbarFull()) return 'Hands full <small>G to put down · 1 to 6 picks a slot</small>'; var lot = pileLot(d.item, h, d.strain); return 'Take 1 ' + sn + ' ' + kindName(d.item, 1) + ' <small>' + lot0.n + ' on the shelf · q' + Math.round(lot0.n ? lot0.qSum / lot0.n : 0) + ' · Shift+E takes ' + lot + (S.customer && S.customer.arrived && S.customer.want === d.item ? ' · ' + S.customer.who + ' wants ' + wantText(S.customer) : '') + '</small>'; }
    if (d.kind === 'goodsShelf') { if (isLocked('goodsShelf')) return 'Goods shelf <small>🔒 locked · Shift+E with the keyring</small>'; if (!shutterOpen('goodsShelf')) return 'Goods shelf <small>gate down · E rolls it up' + (hasKeys() ? ' · Shift+E locks it' : '') + '</small>'; return 'Goods shelf <small>' + S.pkg.bags.n + ' bags · ' + S.pkg.joints.n + ' joints · aim at a strain · E rolls the gate down' + (hasKeys() ? ' · Shift+E locks it' : '') + '</small>'; }
    if ((d.kind === 'register' || d.kind === 'pos') && heistDemander()) return 'Hand over the till <small>' + money(S.till + S.tips) + ' · nobody gets hurt</small>';
    if (d.kind === 'ctlDoor') return world.ctl.doorOpen ? 'Close the control cabinet' : 'Open the control cabinet <small>the tablet and the switches are inside</small>';
    if (d.kind === 'ctlTablet') return touchPrompt(world.ctl.sc, 'Controls tablet', CTL_LABEL[CTL_PAGES[world.ctl.page || 0]] + ' · touch screen: E taps, wheel flips');
    if (d.kind === 'ctlSwitch') { var sw = { open: ['Shop', shop().open ? 'open' : 'closed'], lights: ['Lights', shop().lights ? 'on' : 'off'], staffDoor: ['Staff door', shop().staffDoor ? 'open' : 'closed'], roller: ['Roller door', world.rollerOpen ? 'open' : 'closed'], gate: ['Yard gate', world.gateOpen ? 'open' : 'closed'] }[d.id]; return 'Flip the ' + sw[0].toLowerCase() + ' switch <small>' + sw[1] + '</small>'; }
    if (d.kind === 'ctlRoom') return 'Lights: ' + ROOM_NAMES[d.id] + ' <small>' + (shop().lights && powerOn() && roomLit(d.id) ? 'on' : 'off') + '</small>';
    if (d.kind === 'ctlLever') return 'Dehumidifier lever <small>' + (d.id === 'grow' ? 'grow room' : 'dry room') + ' · ' + dehumLabel(d.id) + ' · E steps it</small>';
    if (d.kind === 'ctlMarkup') return 'Markup lever <small>' + Math.round((shop().markup || 1) * 100) + '% · E steps it</small>';
    if (d.kind === 'ctlVol') return 'Volume lever <small>' + Math.round((shop().volume || 0) * 100) + '% · E steps it</small>';
    if (d.kind === 'ctlKnob') return 'Radio knob <small>' + STATIONS[shop().radio].name + ' · E turns it</small>';
    if (d.kind === 'ctlPanic') return 'Silent alarm <small>' + (S.upgrades.panic ? (heist.on && heist.masked ? 'PRESS IT' : 'armed') : 'not installed: Gear on the office PC') + '</small>';
    if (d.kind === 'pos') return touchPrompt(world.reg.sc, 'Till', S.customer && S.customer.stage ? 'take the payment on the screen' : 'touch screen: look and press E');
    if (d.kind === 'secscreen') return touchPrompt(secScreen.sc, 'Security screen', SEC_PAGE_LABEL[SEC_PAGES[secScreen.page]] + ' · touch screen: E taps, wheel flips');
    if (d.kind === 'register' && h && h.kind === 'crate') return (supplyById(h.item) && supplyById(h.item).stock === 'display') ? 'Stock the counter display with ' + h.n + ' × ' + itemName(h.item) + ' <small>' + (S.display[h.item] || 0) + ' there now</small>' : 'That doesn\'t go on the counter display';
    if (d.kind === 'register') { if (S.customer && S.customer.stage) return 'Take payment from ' + S.customer.who + ' <small>' + money(S.customer.due) + ' by ' + S.customer.pay + '</small>'; if (!h && S.till > 0) return 'Empty the till <small>' + money(S.till) + ' · Shift+E opens the till</small>'; if (h && (h.kind === 'joints' || h.kind === 'bags' || h.kind === 'cookies')) { var wl = walkupLeft(), wn = Math.min(h.n, wl); return wl <= 0 ? 'Till closed to walk-ups <small>back tomorrow · serve the window instead</small>' : 'Ring up ' + wn + ' ' + kindName(h.kind, wn) + ' as a walk-up <small>' + money(unitPrice(h.kind, h.qSum / h.n, h.thcSum / h.n) * wn * WALKUP_RATE) + ' at 85% · ' + wl + ' left today</small>'; } return 'Till <small>prices & diary · bring goods to sell</small>'; }
    if (d.kind === 'jar') { var b = batchById(d.bid); if (!b) return 'Jar'; if (h) return 'Hands full <small>G to put down</small>'; return 'Take jar <small>' + gram(b.grams) + ' ' + strainById(b.strain || 'sunflower').name + ' · q' + Math.round(b.quality) + ' · curing</small>'; }
    if (d.kind === 'line') { if (h && h.kind === 'harvest') return 'Hang ' + gram(h.grams) + ' to dry'; var dr = S.batches.filter(function (b) { return !b.cured; }).length; return 'Drying line <small>' + dr + ' hanging' + (dr ? ' · ' + Math.round(dryPct() * 100) + '% dry' : '') + '</small>'; }
    if (d.kind === 'shelf') { var cured = S.batches.filter(function (b) { return b.cured; }).length; return 'Curing shelf <small>' + cured + ' jar' + (cured === 1 ? '' : 's') + ' curing · look at a jar to take it</small>'; }
    if (d.kind === 'customer' && h && h.kind === 'bat') return 'Swing at ' + (S.customer ? S.customer.who : 'them') + ' <small>a paying customer…</small>';
    if (d.kind === 'customer') {
      if (!S.customer) return 'Customer'; var c = S.customer;
      if (c.idPending) return '🪪 Check ' + c.who + "'s ID <small>they're holding it out</small>";
      if (!c.arrived) return c.who + ' <small>still coming through the ID check</small>';
      var open = orderLines(c).filter(function (l) { return l.given.n < l.qty; });
      var cq = (c.cig && c.cig.given < c.cig.qty) ? c.cig : null;   /* the smokes ride on their own line, not in orderLines, so the prompt has to name them itself */
      var cigText = function (q) { return (q.qty - q.given) + ' × ' + CIG_SKUS[q.sku].name; };
      if (h && h.kind === 'cigs') {
        if (!cq) return c.who + ' <small>didn\'t ask for cigarettes</small>';
        if (cq.sku !== h.sku) return c.who + ' <small>asked for ' + CIG_SKUS[cq.sku].name + ', not that pack</small>';
        return 'Hand ' + Math.min(h.n, cq.qty - cq.given) + ' × ' + CIG_SKUS[cq.sku].name + ' to ' + c.who + ' <small>' + (open.length ? 'then ' + open.map(lineText).join(', ') : 'that completes the order') + '</small>';
      }
      var mine = h && open.filter(function (l) { return l.kind === h.kind; })[0];
      if (mine) { var rest = open.filter(function (l) { return l !== mine; }).map(lineText); if (cq) rest.push(cigText(cq)); return 'Hand ' + Math.min(h.n, mine.qty - mine.given.n) + ' ' + kindName(h.kind, Math.min(h.n, mine.qty - mine.given.n)) + ' to ' + c.who + ' <small>' + (rest.length ? 'then ' + rest.join(', ') : 'that completes the order') + '</small>'; }
      var all = open.map(lineText); if (cq) all.push(cigText(cq));
      return c.who + ' <small>still wants ' + all.join(', ') + (c.premium ? ' · quality ' + c.minQ + '+' : '') + ' · see the ticket top left</small>';
    }
    if (d.kind === 'water') return h && h.kind === 'can' ? 'Put the can back' : (h ? 'Hands full <small>G to put down</small>' : 'Pick up the watering can');
//#if desk
    if (d.kind === 'tv') return 'TV <small>' + { off: 'off', desk: 'live desk', growcam: 'grow cam', news: 'house news' }[TV_CHANNELS[tv.channel]] + ' · E next channel</small>';
//#else
    if (d.kind === 'tv') return 'TV <small>' + { off: 'off', desk: 'shop dashboard', growcam: 'grow cam', news: 'house news' }[TV_CHANNELS[tv.channel]] + ' · E next channel</small>';
//#endif
    if (d.kind === 'secdesk') return sec.view.on ? 'Leave the cameras' : sit.on ? 'Watch the cameras' : 'Sit down and watch the cameras';
    if (d.kind === 'seccam') return 'Security camera <small>' + secCamName(d.idx) + ' · feeds the security room</small>';
    if (d.kind === 'couch') return sit.on ? (h && h.kind === 'joints' && !smoke.on ? 'Spark one up' : 'Get up') : (h && h.kind === 'snack' ? 'Eat on the couch' : h && h.kind === 'joints' ? 'Sit down and spark one up' : 'Sit on the couch');
    if (d.kind === 'trash') { var TB = machState(d.propId), tn = TB.trash || 0; return h && isTrash(h) ? (tn >= 12 ? 'The bin is full <small>bag it up first</small>' : 'Throw it in the bin') : tn >= 12 ? (h ? 'The bin is full <small>empty hands to bag it up</small>' : 'Bag up the bin <small>the bin bag goes in the dumpster</small>') : 'Bin <small>' + tn + ' of 12 · E lifts the lid</small>'; }
    if (d.kind === 'cooler') return h ? (h.kind === 'cupWater' ? 'Drink the water' : h.kind === 'cupEmpty' ? 'Refill the cup' : 'Hands full <small>G to put down</small>') : 'Water cooler <small>take a cup and fill it</small>';
    if (d.kind === 'dumpster') return h && h.kind === 'trashbag' ? 'Throw the bag in' : 'Dumpster <small>bin bags from the bins go here</small>';
    if ((d.kind === 'couch' || d.kind === 'eatspot') && isDrink(h)) return 'Drink the ' + HELD_LABEL[h.kind].toLowerCase();
    if (d.kind === 'kfridge') return h ? (h.kind === 'snack' ? 'Put the snack back' : 'Hands full <small>G to put down</small>') : 'Open the fridge <small>grab a snack</small>';
    if (d.kind === 'eatspot') return h && h.kind === 'snack' ? 'Eat at the ' + d.label : 'Dining table <small>bring food from the fridge</small>';
    if (d.kind === 'bed') return sit.on ? 'Get up' : 'Sleep until morning <small>skips to 06:00 · plants keep growing</small>';
    if (d.kind === 'miniFront') return 'Front panel <small>' + (shop().open ? 'open' : 'closed') + ' · front curtains · hall and lounge lights · E</small>';
    if (d.kind === 'miniOffice') return 'Office panel <small>lights back here and the office door · E</small>';
    if (d.kind === 'controls') return 'Control box <small>' + (shop().open ? 'open' : 'closed') + ' · lights ' + (shop().lights ? 'on' : 'off') + ' · radio ' + STATIONS[shop().radio].name + '</small>';
    if (d.kind === 'curtain') { var ct = (curtainOpen(d.key) ? 'Close ' : 'Open ') + d.label; if (d.key === 'service') { if (shop().breakNote && !curtainOpen('service')) return ct + ' <small>Shift+E takes the break note down</small>'; if (lobbySide()) return ct + (curtainOpen('service') ? ' <small>draw it, then Shift+E hangs a "back in 5 minutes" note</small>' : ' <small>Shift+E hangs a "back in 5 minutes" note</small>'); } return ct; }
    if (d.kind === 'staffdoor') { var sdl = staffDoorLocked(), sdk = hasKeys(); if (sdl && !shop().staffDoor) return '🔒 Staff door <small>' + (sdk ? 'Shift+E unlocks it' : 'locked · the keyring hangs in the office') + '</small>'; return (shop().staffDoor ? 'Close' : 'Open') + ' the staff door' + (sdk ? ' <small>Shift+E ' + (sdl ? 'unlocks' : 'locks') + ' it</small>' : ''); }
    if (d.kind === 'frontdoor') return shop().open ? 'Lock the front door <small>closes the shop</small>' : 'Unlock the front door <small>opens the shop</small>';
    if (d.kind === 'broom') return h && h.kind === 'broom' ? 'Hang the broom back up' : (h ? 'Hands full <small>G to put down</small>' : 'Take the broom <small>' + dustList().length + ' dusty spot' + (dustList().length === 1 ? '' : 's') + '</small>');
    if (d.kind === 'dust') return h && h.kind === 'broom' ? 'Sweep up the dirt' : 'Dirt on the floor <small>grab the broom in the processing room</small>';
//#if desk
    if (d.kind === 'deskboard') { var hz = deskBoard.hotZone; return (deskBoard.view === 'shop' ? 'Shop dashboard' : 'Live desk board') + ' <small>' + (hz ? 'tap: ' + esc(hz.label) : deskLabel(DESK_PAGES[deskBoard.page]) + (deskBoard.view === 'shop' ? '' : ' · ' + deskBoard.data.prs.length + ' open PRs') + ' · touch screen: look and press E, wheel flips') + '</small>'; }
//#else
    if (d.kind === 'deskboard') { var hz = deskBoard.hotZone; return 'Shop dashboard <small>' + (hz ? 'tap: ' + esc(hz.label) : DESK_PAGE_LABEL[DESK_PAGES[deskBoard.page]] + ' · touch screen: look and press E, wheel flips') + '</small>'; }
//#endif
    if (d.kind === 'switch') return (roomLit(d.room) ? 'Lights off' : 'Lights on') + ' <small>' + ROOM_NAMES[d.room] + '</small>';
    if (d.kind === 'dehum') return 'Dehumidifier <small>' + dehumLabel(d.zone) + ' · RH ' + Math.round(S.rh[d.zone]) + '% · E next setting</small>';
    if (d.kind === 'storeItem') { var sn = S.storage[d.item] || 0, bayT = d.bay !== undefined ? 'bay ' + rackBayCode(d.bay) + ' · ' : ''; if (h && h.kind === 'crate') return 'Rack your crate <small>' + h.n + ' × ' + itemName(h.item) + (h.item === d.item ? ' back in ' + bayT + 'Shift+E takes the rest of this bay instead' : ' goes in its own bay') + '</small>'; if (h && hotbarFull()) return 'Hands full <small>G to put down · 1 to 6 picks a slot</small>'; return 'Take a crate of ' + itemName(d.item) + ' <small>' + bayT + sn + ' in stock · E takes ' + Math.min(sn, itemPack(d.item)) + ' · Shift+E all</small>'; }
    if (d.kind === 'storage') { if (h && h.kind === 'crate') return 'Rack your crate <small>' + h.n + ' × ' + itemName(h.item) + ' goes in its own labelled bay</small>'; return 'Storage racking <small>' + (Object.keys(S.storage).filter(function (k) { return S.storage[k] > 0; }).length || 'no') + ' items · aim at a crate to take it · Shift+E for the stock list</small>'; }
    if (d.kind === 'vault') return S.pocket > 0 ? 'Put ' + money(S.pocket) + ' in the vault <small>holds ' + money(S.vault) + ' · Shift+E opens it</small>' : 'Open the vault <small>holds ' + money(S.vault) + '</small>';
    if (d.kind === 'tips') return S.tips > 0 ? 'Empty the tip jar <small>' + money(S.tips) + '</small>' : 'Tip jar <small>empty</small>';
    if (d.kind === 'vending') { var MM = machState(d.propId); if (h && h.kind === 'crate') return isVendItem(h.item) ? (MM.vendDoor ? 'Load ' + h.n + ' × ' + itemName(h.item) + ' onto the racks' : 'Open the machine first <small>Shift+E</small>') : 'That doesn\'t go in here'; var vbox = coinBox(d.propId), vst = machStock(d.propId), vtxt = (vst.drink || 0) + ' drinks · ' + (vst.snack || 0) + ' snacks'; if (MM.vendDoor) return (vbox > 0 ? 'Empty the coin box <small>' + money(vbox) + ' · ' : 'Machine open <small>') + vtxt + ' on the racks · Shift+E to shut it</small>'; return 'Vending machine <small>' + vtxt + ' · E buys one for $2' + (vbox > 0 ? ' · Shift+E opens it, the box holds ' + money(vbox) : ' · Shift+E opens it') + '</small>'; }
    if (d.kind === 'fridge') { var FM2 = machState(d.propId), fbox = coinBox(d.propId); if (h && h.kind === 'crate') return h.item === 'drink' ? (FM2.fridgeDoor ? 'Load ' + h.n + ' drinks into the fridge' : 'Open the fridge first <small>Shift+E</small>') : 'Only drinks go in the fridge'; if (FM2.fridgeDoor && fbox > 0) return 'Empty the coin box <small>' + money(fbox) + ' · ' + (FM2.fridge || 0) + ' cold · Shift+E shuts it</small>'; return 'Drinks fridge <small>' + (FM2.fridge || 0) + ' cold' + (FM2.fridgeDoor ? ' · E takes one · Shift+E shuts it' : ' · E takes one' + (fbox > 0 ? ' · Shift+E opens it, the box holds ' + money(fbox) : ' · Shift+E opens it')) + '</small>'; }
    if (d.kind === 'coffeeCup') { var CM2 = machState(d.propId); return CM2.cup > 0 ? (machAnim(d.propId).brewT > 0 ? 'Pouring… <small>give it a second</small>' : 'Fresh coffee <small>E takes the cup</small>') : ''; }
    if (d.kind === 'vendTray') { var MT = machState(d.propId); return MT.tray.length ? 'Delivery tray <small>' + MT.tray.length + ' waiting · E takes one</small>' : ''; }
    if (d.kind === 'lobbyCoffee') { var CD = machState(d.propId); if (h && h.kind === 'crate') return (h.item === 'cup' || h.item === 'beans') ? (CD.coffDoor ? 'Load ' + h.n + ' × ' + itemName(h.item) + ' into the hopper' : 'Lift the hopper lid first <small>Shift+E</small>') : 'That doesn\'t go in here'; var cbox = coinBox(d.propId), cst = machStock(d.propId), cstock = (cst.cup || 0) + ' cups · ' + (cst.beans || 0) + ' servings of beans'; if (CD.coffDoor) return (cbox > 0 ? 'Empty the coin box <small>' + money(cbox) + ' · ' : 'Hopper open <small>') + cstock + ' · Shift+E closes it</small>'; return 'Coffee machine <small>E pours one for $2 · ' + cstock + (cbox > 0 ? ' · Shift+E opens it, the box holds ' + money(cbox) : ' · Shift+E opens it') + '</small>'; }
    if (d.kind === 'atm') return 'Use the ATM <small>bank ' + money(S.bank) + ' · pocket ' + money(S.pocket) + ' · deposits clear at once, 2% fee</small>';
    if (d.kind === 'arcade') { var abox = coinBox(d.propId); return abox > 0 ? 'Empty the coin box <small>' + money(abox) + '</small>' : 'Arcade cabinet <small>coin box empty</small>'; }
    if (d.kind === 'courier') return 'Hand the courier ' + money(S.courier ? S.courier.amount : 0) + ' <small>pocket ' + money(S.pocket) + '</small>';
    if (d.kind === 'roller') return (world.rollerOpen ? 'Close' : 'Open') + ' the roller door';
    if (d.kind === 'gate') return (world.gateOpen ? 'Close' : 'Open') + ' the yard gate';
    if (d.kind === 'garage') return (world.garageOpen ? 'Close' : 'Open') + ' the garage door';
    if (d.kind === 'barrier') return (world.barrierOpen ? 'Lower' : 'Raise') + ' the barrier <small>it lifts by itself when you drive up</small>';
    if (d.kind === 'bat') return h && h.kind === 'bat' ? 'Put the bat back' : h ? 'Hands full <small>G to put things down</small>' : 'Take the baseball bat <small>click to swing · for robbers, not customers</small>';
    if (d.kind === 'robber') return robberPrompt(d, h);
    if (d.kind === 'locker') return isLocked('gunLocker') ? 'Weapon locker <small>🔒 locked · Shift+E with the keyring</small>' : 'Weapon locker <small>pepper spray · taser · firearms' + (hasKeys() ? ' · Shift+E locks it' : '') + '</small>';
    var tobP = tobPrompt(d, h); if (tobP) return tobP;
    var cityP = cityPrompt(d, h); if (cityP) return cityP;
    var vipP = vipPrompt(d, h); if (vipP) return vipP;
    var expP = expPrompt(d, h); if (expP) return expP;
    if (d.kind === 'keyHook') return keyHookPrompt(h);
    var doorP = doorPrompt(d); if (doorP) return doorP;
    if (d.kind === 'queuer') return 'Customer <small>in line · E to have a word</small>'; if (d.kind === 'rope') return 'Rope line <small>E to change it · F2 moves it</small>'; if (d.kind === 'lounger') { var lg = loungers.filter(function (l) { return l.id === d.lid; })[0]; if (!lg) return ''; if (fight && (fight.a === lg || fight.b === lg)) return h && h.kind === 'bat' ? 'Swing <small>or press E to break it up</small>' : 'Break it up <small>' + fight.a.who + ' and ' + fight.b.who + '</small>'; return (h && h.kind === 'bat' ? 'Swing at ' : '') + lg.who + ' <small>' + (lg.state === 'smoke' ? 'having a smoke' : lg.state === 'use' ? 'at the ' + lg.useKind : lg.state === 'down' ? 'on the floor' : 'in the lobby') + '</small>'; }
    if (d.kind === 'stock') return isGoods(h) ? 'Lock ' + h.n + ' ' + kindName(h.kind, h.n) + ' in the stock cabinet <small>' + stockCount() + ' stored · Shift+E opens it</small>' : 'Stock cabinet <small>' + stockCount() + ' packed goods stored · E opens</small>';
    if (d.kind === 'worker') return crewName(d.idx || 0) + ' <small>' + workerTaskLabel(d.idx || 0) + ' · Shift+E gives orders · Ctrl+E sends them home</small>';
    if (d.kind === 'guard') return 'The guard <small>' + guardTaskLabel() + ' · Shift+E gives orders · E to chat</small>';
    return d.label || 'Interact';
  }
  function dryMs() { return DRY_MS_BASE; }
  // hour of the day the lights and sky follow: the in-game clock, the wall clock, or a fixed time from settings
  function gameHour() { if (SET.dayNight === 'day') return 13; if (SET.dayNight === 'evening') return 19.2; if (SET.dayNight === 'night') return 1; if (SET.dayNight === 'cycle') return S.clock || 0; var d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  function clockText() { var h = gameHour(); var hh = Math.floor(h), mm = Math.floor((h - hh) * 60); return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; }
  function dryProgress(b) { return b.cured ? 1 : (b.dry === undefined ? Math.min(1, Math.max(0, (now() - b.startedAt) / dryMs())) : b.dry); }
  // humidity effects: drying speeds up in dry air, mold spreads in damp air, very dry air makes plants thirstier
  function dryFactor() { return clamp(1 + (55 - S.rh.dry) / 40, 0.5, 1.4); }
  function moldMult() { var r = S.rh.grow; return r > 60 ? 1 + (r - 60) / 12 : r < 45 ? 0.6 : 1; }
  function dryPct() { var m = 0; S.batches.forEach(function (b) { if (!b.cured) m = Math.max(m, dryProgress(b)); }); return m; }
  function batchById(bid) { for (var i = 0; i < S.batches.length; i++) if (S.batches[i].id === bid) return S.batches[i]; return null; }
  function cureSlots() { return Math.max(2, S.supplies.jar || 0); }   // one batch cures per jar you own, and two always can so nobody is stuck
  function jarWaits(b) { return !!b && b.cured && S.batches.filter(function (x) { return x.cured; }).indexOf(b) >= cureSlots(); }
  function interact() {
    if (sleep.on || player.downT > 0) return;
    var ht = held(); if (ht && ht.kind === 'tablet' && (!focus || focus.data.kind === 'tabletDock')) { if (focus) tabletTake(); else jobsPanel(); return; }   /* the thing in your hands is a screen: E reads it, unless you are putting it back on its dock */
    if (!focus) return; var d = focus.data; var h = held(); sfx('click');
    if (d.kind === 'plant') {
      var p = plantById(d.pid); if (!p) return;
      if (p.progress >= 1) { if (hotbarFull()) toast('Your hands are full (G puts things down)', 'bad'); else actions.harvest(d.pid); }
      else if (h && h.kind === 'can') actions.water(d.pid);
      else if (h && h.kind === 'nutrients') actions.feed(d.pid);
      else if (h && h.kind === 'remedy') actions.treat(d.pid);
      else ctxPlant(d.pid);
    }
    else if (d.kind === 'slot') {
      if (d.noPot) { toast('No pot here. Buy one at the office PC.', 'bad'); return; }
      if (h && h.kind === 'soil') actions.fillSoil(d.slot);
      else if (h && h.kind === 'seed') actions.plant(h.strain, d.slot);
      else toast(S.potSoil && S.potSoil[d.slot] ? 'Bring a seed from the rack' : 'Bring a bag of soil from the rack', '');
    }
    else if (d.kind === 'rackItem') {
      if (hotbarFull()) { toast('Your hands are full (G puts things down)', 'bad'); return; }
      if ((S.supplies[d.item] || 0) < 1) { toast('None left. Order more at the office PC.', 'bad'); return; }
      S.supplies[d.item]--;
      if (d.item.indexOf('seed_') === 0) take({ kind: 'seed', strain: d.item.slice(5) }); else take({ kind: d.item }); dirtySupply(d.item);
      toast('Took ' + d.label, 'good');
    }
    else if (d.kind === 'inventory') { if (h && h.kind === 'crate') { var okRack = h.item.indexOf('seed_') === 0 || (supplyById(h.item) && !supplyById(h.item).stock); if (!okRack) { toast('That goes in a machine, not on the rack', 'bad'); return; } S.supplies[h.item] = (S.supplies[h.item] || 0) + h.n; sfx('putdown'); toast('🧰 Stocked the supply rack: ' + h.n + ' × ' + itemName(h.item), 'good'); logEvent('🧰 Supply rack stocked: ' + h.n + ' × ' + itemName(h.item), ''); S.held = null; dirtySupply(h.item); } else ui.openPanel('inventory'); }
    else if (d.kind === 'laptop') pcOpen();
    else if (d.kind === 'bench') { if (h && h.kind === 'jar') actions.collectHeld(); else if (h && h.kind === 'harvest') toast('Hang it on the drying line first (back-right)', 'bad'); else ui.openPanel('bench'); }
    else if (d.kind === 'lot' && !shutterOpen('goodsShelf')) { if (player.keys.ShiftLeft || player.keys.ShiftRight) toggleLock('goodsShelf'); else if (!lockedStop('goodsShelf')) setShutter('goodsShelf', true); }
    else if (d.kind === 'lot') {
      var lotX = lotOf(d.item, d.strain); if (lotX.n < 1) { toast('Nothing there', 'bad'); return; }
      if (h && (h.kind !== d.item || (h.strain && h.strain !== d.strain))) { var other = S.hotbar.map(function (x, i2) { return x && x.kind === d.item && (!x.strain || x.strain === d.strain) ? i2 : -1; }).filter(function (i2) { return i2 >= 0; })[0]; if (other !== undefined) { S.slot = other; h = held(); } else if (hotbarFull()) { toast('Your hands are full. Put something down first (G).', 'bad'); return; } else h = null; }
      var n = (player.keys.ShiftLeft || player.keys.ShiftRight) ? pileLot(d.item, h, d.strain) : 1; var dr = lotDraw(d.item, d.strain, n);
      if (h) { h.n += dr.n; h.qSum += dr.q * dr.n; h.thcSum += dr.thc * dr.n; h.strain = d.strain; } else take({ kind: d.item, n: dr.n, qSum: dr.q * dr.n, thcSum: dr.thc * dr.n, strain: d.strain });
      world.dirtyShelf = true; world.lotTakeT = now(); toast('Took ' + dr.n + ' ' + strainById(d.strain).name + ' ' + d.item, 'good');
    }
    else if (d.kind === 'goodsShelf') { if (player.keys.ShiftLeft || player.keys.ShiftRight) toggleLock('goodsShelf'); else if (lockedStop('goodsShelf')) { } else if (!shutterOpen('goodsShelf')) setShutter('goodsShelf', true); else if (now() - (world.lotTakeT || 0) < 1500) { } else { setShutter('goodsShelf', false); toast('Gate rolled down over the goods shelf', ''); } }   /* taking one rebuilds the piles, and a quick second click landed on the shelf itself for a moment and shut the gate */
    else if (d.kind === 'switch') { toggleRoomLight(d.room); }
    else if (d.kind === 'dehum') { dehumCycle(d.zone); }
    else if (d.kind === 'register' && heistDemander()) complyHeist();
    else if (d.kind === 'register' && h && h.kind === 'crate') { if (supplyById(h.item) && supplyById(h.item).stock === 'display') { S.display[h.item] = (S.display[h.item] || 0) + h.n; sfx('putdown'); toast('🧾 Counter display: +' + h.n + ' ' + itemName(h.item) + ' (' + S.display.lighter + ' lighters · ' + S.display.rpaper + ' papers · ' + S.display.rgrinder + ' grinders)', 'good'); logEvent('🧾 Stocked the counter display: ' + h.n + ' × ' + itemName(h.item), ''); S.held = null; world.dirtyDisplay = true; } else toast('That doesn\'t go on the counter display', 'bad'); }
    else if (d.kind === 'register') { if (S.customer && S.customer.stage) toast('💳 Take the payment on the till screen: look at the tablet and press E', ''); else if (h && (h.kind === 'joints' || h.kind === 'bags' || h.kind === 'cookies')) sellHeld(); else if (!h && S.till > 0 && !(player.keys.ShiftLeft || player.keys.ShiftRight)) { var tl = S.till; if (takeCash(tl, 'till')) S.till = 0; } else toast('🧾 The till is the tablet on the counter: look at it and press E', ''); }
    else if (d.kind === 'pos') { if (heistDemander()) complyHeist(); else touchTap(world.reg.sc); }
    else if (d.kind === 'ctlDoor') ctlDoorSet(!world.ctl.doorOpen);
    else if (d.kind === 'ctlTablet') touchTap(world.ctl.sc);
    else if (d.kind === 'ctlSwitch') { ctlAct({ open: 'shopToggle', lights: 'lightsToggle', staffDoor: 'staffDoorToggle', roller: 'rollerToggle', gate: 'gateToggle' }[d.id]); cabinetSync(); }
    else if (d.kind === 'ctlRoom') { ctlAct('roomLight', d.id); cabinetSync(); }
    else if (d.kind === 'ctlLever') { dehumCycle(d.id); cabinetSync(); }
    else if (d.kind === 'ctlMarkup') ctlMarkupStep();
    else if (d.kind === 'ctlVol') ctlVolumeStep();
    else if (d.kind === 'ctlKnob') { ctlKnobStep(); cabinetSync(); }
    else if (d.kind === 'ctlPanic') panicButton();
    else if (d.kind === 'secscreen') touchTap(secScreen.sc);
    else if (d.kind === 'jar') { if (hotbarFull()) { toast('Your hands are full (G puts things down)', 'bad'); return; } var b = batchById(d.bid); if (!b || !b.cured) return; S.batches = S.batches.filter(function (x) { return x.id !== d.bid; }); world.dirtyShelf = true; take({ kind: 'jar', bid: b.id, grams: b.grams, quality: b.quality, baseQ: b.baseQ, thc: b.thc, startedAt: b.startedAt, strain: b.strain }); toast('Took the jar. Empty it at the workbench.', 'good'); }
    else if (d.kind === 'line') { if (h && h.kind === 'harvest') actions.hang(); else ctxShelf(); }
    else if (d.kind === 'shelf') ctxShelf();
    else if (d.kind === 'customer') { if (!S.customer) return; var hb2 = held(); if (hb2 && hb2.kind === 'bat') { swingBat(); return; }
      if (S.customer.id && (S.customer.idPending || player.keys.ShiftLeft || player.keys.ShiftRight)) { idCard(S.customer); return; }   /* they are holding it out, or you have asked to see it again */
      if (!S.customer.arrived && !S.customer.stage) { toast(S.customer.who + ' is still at the ID check', ''); return; }
      var cigWant = h && h.kind === 'cigs' && S.customer.cig && S.customer.cig.given < S.customer.cig.qty;   /* a cigarette side order is not in orderLines, so it needs its own way past the gate */
      if (h && (cigWant || orderLines(S.customer).some(function (l) { return l.kind === h.kind && l.given.n < l.qty; }))) handOver(); else if (h) toast(S.customer.who + ' wants ' + wantText(S.customer), 'bad'); else { toast(S.customer.who + ' wants ' + wantText(S.customer) + '. They\'re on the goods shelf.', ''); npc.say(custLine(S.customer.who, 'remind', wantText(S.customer)), '#6fdc8c'); } }
    else if (d.kind === 'tv') tvCycle();
    else if (d.kind === 'secdesk') { if (sec.view.on) camExit(); else camEnter(); }
    else if (d.kind === 'seccam') { toast('📹 ' + secCamName(d.idx) + ' is recording. Watch it from the security room desk.', ''); sfx('click'); }
    else if ((d.kind === 'couch' || d.kind === 'eatspot') && isDrink(h)) drinkHeld();
    else if (d.kind === 'trash') {
      var TB = machState(d.propId), lid = world.trashLids && world.trashLids[d.propId]; var lift = function () { if (!lid) return; lid.rotation.x = -1.35; setTimeout(function () { lid.rotation.x = 0; }, 1400); };
      if (h && isTrash(h)) { if ((TB.trash || 0) >= 12) toast('The bin is full. Bag it up first.', 'bad'); else { S.held = null; TB.trash = (TB.trash || 0) + 1; lift(); sfx('dust'); if (TB.trash >= 12) toast('🗑️ Binned it, and now the bin is full. Dust builds faster and it costs a point of rep a day until you bag it up', 'bad'); else toast('🗑️ Binned it (' + TB.trash + ' of 12)', ''); save(); } }
      else if (!h && (TB.trash || 0) >= 12) { TB.trash = 0; take({ kind: 'trashbag' }); lift(); toast('Bagged it up. The dumpster is in the yard.', 'good'); save(); }
      else if (h) toast('That doesn\'t go in the bin', 'bad');
      else { lift(); sfx('click'); }
    }
    else if (d.kind === 'cooler') {
      if (!h) { if (hotbarFull()) toast('Your hands are full (G puts things down)', 'bad'); else { take({ kind: 'cupWater' }); sfx('water'); toast('💧 Filled a cup of water', ''); } }
      else if (h.kind === 'cupWater') drinkHeld();
      else if (h.kind === 'cupEmpty') { S.held = null; take({ kind: 'cupWater' }); sfx('water'); toast('💧 Refilled the cup', ''); }
      else toast('Your hands are full (G puts things down)', 'bad');
    }
    else if (d.kind === 'dumpster') { if (h && h.kind === 'trashbag') { S.held = null; var XD = xs(); XD.dumped = (XD.dumped || 0) + 1; sfx('crate'); toast('🗑️ Into the dumpster', 'good'); save(); } else toast('Bring the bin bags from the bins', ''); }
    else if (d.kind === 'couch') { var seat = d.seat === 'sofa' ? world.sofaSeat : world.couchSeat; if (h && h.kind === 'snack') eatSnack(); else if (h && h.kind === 'joints' && !smoke.on) { if (!sit.on) sitDown(seat); sparkUp(); } else sitDown(seat); }
    else if (d.kind === 'kfridge') { if (h && h.kind === 'snack') { S.held = null; toast('Back in the fridge', ''); } else if (hotbarFull()) toast('Your hands are full (G puts things down)', 'bad'); else { take({ kind: 'snack' }); toast('🥪 Grabbed a snack. Eat it at the table or on the couch.', 'good'); } }
    else if (d.kind === 'eatspot') eatSnack();
    else if (d.kind === 'bed') napBed();
    else if (d.kind === 'controls') ui.openPanel('controls');
    else if (d.kind === 'miniFront') ui.openPanel('miniFront');
    else if (d.kind === 'miniOffice') ui.openPanel('miniOffice');
    else if (d.kind === 'curtain') { if (d.key === 'service' && (player.keys.ShiftLeft || player.keys.ShiftRight)) breakNoteToggle(); else toggleCurtain(d.key); }
    else if (d.kind === 'staffdoor') { if (player.keys.ShiftLeft || player.keys.ShiftRight) keyStaffDoor(); else toggleStaffDoor(); }
    else if (d.kind === 'frontdoor') toggleShopOpen();
    else if (d.kind === 'broom') { if (h && h.kind === 'broom') { S.held = null; toast('Broom back on the hook', ''); } else if (hotbarFull()) toast('Your hands are full (G puts things down)', 'bad'); else { take({ kind: 'broom' }); toast('🧹 Got the broom. E on the dust sweeps it.', 'good'); } }
    else if (d.kind === 'dust') sweep(d.id);
    else if (d.kind === 'deskboard') deskTap();
    else if (d.kind === 'storeItem') {
      var shS = player.keys.ShiftLeft || player.keys.ShiftRight;
      if (h && h.kind === 'crate' && !(shS && h.item === d.item)) { rackCrate(); return; }   /* a crate in your hands goes back up; Shift+E on its own bay takes the rest of it instead */
      var have = S.storage[d.item] || 0; if (have < 1) { toast('Nothing left there', 'bad'); return; }
      if (h && (h.kind !== 'crate' || h.item !== d.item)) { var other2 = S.hotbar.map(function (x, i2) { return x && x.kind === 'crate' && x.item === d.item ? i2 : -1; }).filter(function (i2) { return i2 >= 0; })[0]; if (other2 !== undefined) { S.slot = other2; h = held(); } else if (hotbarFull()) { toast('Your hands are full (G puts things down)', 'bad'); return; } else h = null; }
      var take_n = (player.keys.ShiftLeft || player.keys.ShiftRight) ? have : Math.min(have, itemPack(d.item)); S.storage[d.item] = have - take_n;
      if (h) h.n += take_n; else take({ kind: 'crate', item: d.item, n: take_n });
      world.dirtyStorage = true; toast('📦 Took ' + take_n + ' × ' + itemName(d.item), 'good');
    }
    else if (d.kind === 'storage') { if (player.keys.ShiftLeft || player.keys.ShiftRight) ui.openPanel('storage'); else if (h && h.kind === 'crate') rackCrate(); else toast('Aim at a crate to take it · Shift+E for the stock list', ''); }
    else if (d.kind === 'vault') { if (S.pocket > 0 && !(player.keys.ShiftLeft || player.keys.ShiftRight)) { var dep = S.pocket; S.vault += dep; S.pocket = 0; sfx('vault'); toast('🔒 ' + money(dep) + ' into the vault (now ' + money(S.vault) + ')', 'good'); logEvent('🔒 Vault deposit: ' + money(dep) + ' (vault ' + money(S.vault) + ')', ''); } else ui.openPanel('vault'); }
    else if (d.kind === 'tips') { var tp = S.tips; if (takeCash(tp, 'tip jar')) S.tips = 0; }
    else if (d.kind === 'vending') {
      var MD = machState(d.propId), shift = player.keys.ShiftLeft || player.keys.ShiftRight;
      if (shift) { vendDoorToggle(d.propId); }
      else if (h && h.kind === 'crate') {
        if (!isVendItem(h.item)) toast('That doesn\'t go in the vending machine', 'bad');
        else if (!MD.vendDoor) toast('Open the machine first (Shift+E)', 'bad');
        else { var VS = machStock(d.propId); VS[h.item] = (VS[h.item] || 0) + h.n; sfx('putdown'); toast('🥤 Loaded ' + h.n + ' × ' + itemName(h.item) + ' (' + vendKeys(d.propId).map(function (k) { return VS[k] + ' ' + itemName(k).toLowerCase(); }).join(' · ') + ' on the racks)', 'good'); logEvent('🥤 Restocked the vending machine: ' + h.n + ' × ' + itemName(h.item), ''); S.held = null; syncVending(d.propId); save(); }
      }
      else if (MD.vendDoor) { if (coinBox(d.propId) > 0 && coinEmpty(d.propId, 'vending machine')) vendDisplay(d.propId, 'SERVICE'); else toast('Load drinks or snacks onto the racks, or Shift+E to shut it', ''); }
      else { var VP = machStock(d.propId), pickV = vendKeys(d.propId).sort(function (a, b) { return (VP[b] || 0) - (VP[a] || 0); })[0] || ((VP.drink || 0) >= (VP.snack || 0) ? 'drink' : 'snack'); vendDispense(d.propId, pickV); }
    }
    else if (d.kind === 'vendTray') { vendTakeTray(d.propId); }
    else if (d.kind === 'fridge') {
      var FI = machState(d.propId), shf = player.keys.ShiftLeft || player.keys.ShiftRight;
      if (shf) fridgeDoorToggle(d.propId);
      else if (h && h.kind === 'crate') {
        if (h.item !== 'drink') toast('Only drinks go in the fridge', 'bad');
        else if (!FI.fridgeDoor) toast('Open the fridge first (Shift+E)', 'bad');
        else { FI.fridge = (FI.fridge || 0) + h.n; sfx('putdown'); toast('🧊 ' + h.n + ' drinks chilling (' + FI.fridge + ' in the fridge)', 'good'); S.held = null; syncFridge(d.propId); save(); }
      }
      else if (FI.fridgeDoor && coinBox(d.propId) > 0) { coinEmpty(d.propId, 'fridge'); save(); }   /* open, the coin box comes first; once it is empty E takes a can again */
      else fridgeTake(d.propId);
    }
    else if (d.kind === 'coffeeCup') { coffTake(d.propId); }
    else if (d.kind === 'lobbyCoffee') {
      var CI = machState(d.propId), shc = player.keys.ShiftLeft || player.keys.ShiftRight;
      if (shc) { CI.coffDoor = !CI.coffDoor; sfx(CI.coffDoor ? 'drawer' : 'close'); toast(CI.coffDoor ? '☕ Hopper open. Load cups or beans.' : '☕ Hopper closed', ''); save(); }
      else if (h && h.kind === 'crate') {
        if (h.item !== 'cup' && h.item !== 'beans') toast('That doesn\'t go in the coffee machine', 'bad');
        else if (!CI.coffDoor) toast('Lift the hopper lid first (Shift+E)', 'bad');
        else { var CS = machStock(d.propId); CS[h.item] = (CS[h.item] || 0) + h.n; sfx('putdown'); toast('☕ Loaded ' + h.n + ' × ' + itemName(h.item) + ' (' + (CS.cup || 0) + ' cups · ' + (CS.beans || 0) + ' beans)', 'good'); logEvent('☕ Restocked the coffee machine: ' + h.n + ' × ' + itemName(h.item), ''); S.held = null; syncCoffee(d.propId); save(); }
      }
      else if (CI.coffDoor) { if (!(coinBox(d.propId) > 0 && coinEmpty(d.propId, 'coffee machine'))) toast('Load cups or beans, or Shift+E to close the hopper', ''); }
      else coffBrew(d.propId);
    }
    else if (d.kind === 'atm') { ui.openPanel('atm'); }
    else if (d.kind === 'arcade') { coinEmpty(d.propId, 'arcade coin box'); }
    else if (d.kind === 'courier') { courierHandOver(); }
    else if (d.kind === 'roller') { rollerSet(!world.rollerOpen); }
    else if (d.kind === 'gate') { gateSet(!world.gateOpen); }
    else if (d.kind === 'garage') { garageSet(!world.garageOpen); }
    else if (d.kind === 'barrier') { barrierSet(!world.barrierOpen); }
    else if (d.kind === 'bat') { if (h && h.kind === 'bat') { S.held = null; if (world.batMesh) world.batMesh.visible = true; toast('Bat back by the counter', ''); } else if (hotbarFull()) toast('Your hands are full (G puts things down)', 'bad'); else { take({ kind: 'bat' }); if (world.batMesh) world.batMesh.visible = false; toast('🏏 Got the bat. Click to swing. Hitting customers costs you dearly.', ''); } }
    else if (d.kind === 'robber') robberInteract(d, h);
    else if (d.kind === 'locker') { if (player.keys.ShiftLeft || player.keys.ShiftRight) toggleLock('gunLocker'); else if (!lockedStop('gunLocker')) lockerMenu(); }
    else if (tobInteract(d, h)) { }
    else if (cityInteract(d, h)) { }
    else if (vipInteract(d, h)) { }
    else if (expInteract(d, h)) { }
    else if (d.kind === 'door') { if (player.keys.ShiftLeft || player.keys.ShiftRight) keyDoor(d.id); else toggleDoor(d.id); }
    else if (d.kind === 'keyHook') keyHookInteract();
    else if (d.kind === 'rope') ropeMenu(d.propId); else if (d.kind === 'queuer') { var qm = lineup.filter(function (m) { return m.id === d.qid; })[0]; if (qm) { if (h && h.kind === 'bat') swingBat(); else lineChat(qm); } } else if (d.kind === 'lounger') { var lg2 = loungers.filter(function (l) { return l.id === d.lid; })[0]; if (!lg2) return; if (h && h.kind === 'bat') { swingBat(); return; } if (fight && (fight.a === lg2 || fight.b === lg2)) { endFight('player'); return; } loungerSay(lg2, pick(['All good, boss.', 'Nice place.', 'Cheers, boss.', 'Top shelf, this.']), '#e8f1ea'); }
    else if (d.kind === 'stock') { if (isGoods(h) && !(player.keys.ShiftLeft || player.keys.ShiftRight)) stockStore(h); else ui.openPanel('stock'); }
    else if (d.kind === 'worker') { var wi = d.idx || 0;
      if (player.keys.ControlLeft || player.keys.ControlRight) { crewShift(wi, true); return; }   /* Ctrl+E sends this one home */ var wr = crew.filter(function (x) { return x.idx === wi; })[0]; if (wr) worker = wr; if (player.keys.ShiftLeft || player.keys.ShiftRight) workerMenu(wi); else workerSay(crewLine('chat'), '#e8f1ea'); }
    else if (d.kind === 'guard' && (player.keys.ShiftLeft || player.keys.ShiftRight)) { guardMenu(); }
    else if (d.kind === 'guard') { guard.say(pick(['All quiet, boss.', guardIdLine(), nightNow() ? 'No trouble tonight.' : 'No trouble so far.', 'Door\'s covered, boss.']), '#e8f1ea', 2600); }
    else if (d.kind === 'water') { if (h && h.kind === 'can') { S.held = null; toast('Can back on the reel', ''); } else if (hotbarFull()) toast('Your hands are full (G puts things down)', 'bad'); else { take({ kind: 'can' }); toast('💧 Grabbed the watering can. E on a plant waters it.', 'good'); } }
    afterAction();
  }
  function afterAction() { save(); if (world.dirty || dirtyAny()) { rebuildDynamic(); } ui.refreshOpen(); hud(); if (focus) setFocus(focus); }
  // world.dirty means something changed and nobody said what: the whole old rebuild runs, as it does when rebuildDynamic()
  // is called with nothing flagged. The specific flags rebuild only their part, so picking up a jar no longer regrows every
  // plant. dirtyShelf covers the storage room and counter display too, since syncShelf redraws both.
  function dirtyAny() { return !!(world.dirtyPlants || world.dirtyShelf || world.dirtyStorage || world.dirtyRack || world.dirtyDisplay); }
  function dirtySupply(id) { world.dirtyRack = true; if (id === 'jar' || id === 'bag' || id === 'paper' || id === 'grinder') world.dirtyShelf = true; if (id === 'pot') world.dirtyPlants = true; }   /* the rack shows every supply, the bench and cure shelf show these four, and the tent's pots are the pot count */
  function rebuildDynamic() {
    var all = world.dirty || !dirtyAny(), plants = all || world.dirtyPlants, shelf = all || world.dirtyShelf, storage = world.dirtyStorage, display = world.dirtyDisplay, rack = all || world.dirtyRack;
    world.dirty = false; world.dirtyPlants = world.dirtyShelf = world.dirtyStorage = world.dirtyRack = world.dirtyDisplay = false;
    defightSoon();
    if (plants) { buildTent(); if (world.tentGroup) world.tentGroup.traverse(function (o) { if (o.isMesh) o.userData.propId = 'tent'; }); }
    if (shelf) syncShelf(); else { if (storage) syncStorage(); if (display) syncDisplay(); }
    if (rack) syncRack();
  }

  // context card: plant inspection / shelf overview (information, the hands do the work)
  function ctxOpen(title, sub, lines) {
    var c = $('g3-ctx'); $('g3-ctx-title').innerHTML = title; $('g3-ctx-sub').innerHTML = sub || '';
    ctxActions = {}; var box = $('g3-ctx-btns'); box.innerHTML = lines.map(function (l, i) { if (l.act) ctxActions['a' + i] = l.act; return '<div class="g3-ctx-line' + (l.cls ? ' ' + l.cls : '') + (l.act ? ' act' : '') + '"' + (l.act ? ' data-ctx="a' + i + '"' : '') + '>' + l.label + '</div>'; }).join('');
    c.hidden = false; ui.ctxOpen = true; document.exitPointerLock();
  }
  var ctxActions = {};
  $('g3-ctx-btns').addEventListener('click', function (e) { var l = e.target.closest('[data-ctx]'); if (!l) return; var fn = ctxActions[l.getAttribute('data-ctx')]; ctxClose(); sfx('click'); if (fn) fn(); afterAction(); });
  function ctxClose() { $('g3-ctx').hidden = true; ui.ctxOpen = false; if (!ui.panelOpen && !ui.menuOpen) lockPointer(); }
  function ctxPlant(pid) {
    var p = plantById(pid); if (!p) return; var st = strainById(p.strain); var sg = stageFor(p.progress);
    var lines = [];
    lines.push({ label: '⏱ ' + sg.label + ' · ' + Math.round(p.progress * 100) + '% · about ' + daysText((1 - p.progress) * st.growMs / lightObj().spd) + ' to harvest' });
    lines.push({ label: '⭐ quality ' + Math.round(p.quality) + (p.fed ? ' · fed' : ' · not fed yet (nutrients add quality +12)') });
    if (!S.upgrades.autowater) lines.push({ label: '💧 water ' + Math.round((1 - p.thirst) * 100) + '%' + (p.thirst > 0.6 ? ' · thirsty, grab the watering can' : ''), cls: p.thirst > 0.6 ? 'bad' : '' });
    lines.push({ label: '🌫️ room humidity ' + Math.round(S.rh.grow) + '%' + (S.rh.grow > 60 ? ' · mould risk, run the dehumidifier' : S.rh.grow < 42 ? ' · very dry, plants drink faster' : ''), cls: S.rh.grow > 60 ? 'bad' : '' });
    if (p.hazard) lines.push({ label: '⚠ ' + (p.hazard === 'pest' ? 'Spider mites' : 'Mould') + '. Bring pest spray from the supply rack.', cls: 'bad' });
    lines.push({ label: '🌾 expected yield ~' + gram(st.yield * (lightObj().yld || 1) * (p.fed ? 1.15 : 1) * (0.7 + p.quality / 140) * (S.upgrades.trimmer2 ? 1.3 : S.upgrades.trimmer ? 1.15 : 1)) });
    ctxOpen(st.emoji + ' ' + st.name, 'inspecting', lines);
  }
  function ctxShelf() {
    var lines = [];
    S.batches.forEach(function (b) { var drying = !b.cured; var dp = dryProgress(b); lines.push({ label: (drying ? '🌬️ ' : '🏺 ') + gram(b.grams) + ' ' + strainById(b.strain || 'sunflower').name + ' · q' + Math.round(b.quality) + (drying ? ' · drying ' + Math.round(dp * 100) + '%' : jarWaits(b) ? ' · waiting for a jar (buy one at the office PC)' : ' · curing, quality rising') }); });
    if (!lines.length) lines.push({ label: 'Nothing here yet. Harvest a plant and hang it on the drying line.' });
    lines.push({ label: 'Dry batches go to the curing shelf in jars. Look at a jar and press E to carry it to the workbench.', cls: 'muted' });
    ctxOpen('🏺 Drying & curing', (S.upgrades.rack ? 'curing rack installed · faster, higher cap' : 'quality keeps rising while a batch cures') + ' · RH ' + Math.round(S.rh.dry) + '% · drying ×' + dryFactor().toFixed(1), lines);
  }

