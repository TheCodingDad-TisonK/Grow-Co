//@ hands-on processing tasks and the panels
  // ── Hands-on processing: small overlay tasks (grind, weigh, roll, trim, bake); automation upgrades skip them ──
  var task = { on: false, kind: null, v: 0, dir: 1, t: 0, hold: false, prog: 0, hits: 0, need: 0, leaves: 0, timer: 0, done: null, el: null, loop: 0, result: null };
  var TASK_INFO = {
    grind:  { title: '⚙️ Grind the bud', hint: 'Tap <b>Space</b> fast to turn the grinder until the bar fills.' },
    weigh:  { title: '⚖️ Weigh an eighth', hint: 'The needle sweeps the scale. Press <b>Space</b> when it sits on <b>3.5 g</b>.' },
    roll:   { title: '🚬 Roll a joint', hint: 'Hold <b>Space</b> to roll it tight. Let go inside the green band. Overdo it and the paper tears.' },
    trim:   { title: '✂️ Trim the harvest', hint: 'Click every leaf before the timer runs out. Each leaf you miss costs a little yield. <b>Esc</b> stops.' },
    bake:   { title: '🍪 Bake the cookies', hint: 'Watch the oven. Press <b>Space</b> when the bar is in the golden band.' }
  };
  function taskEl() { if (task.el) return task.el; var d = document.createElement('div'); d.id = 'g3-task'; d.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:460px;max-width:92vw;padding:18px 20px;background:var(--panel);border:1px solid var(--panel-line);border-radius:14px;color:var(--ink);z-index:40;box-shadow:0 20px 60px rgba(0,0,0,.6);user-select:none'; d.hidden = true; d.addEventListener('mousedown', function (e) { e.preventDefault(); }); d.addEventListener('click', function (e) { var lf = e.target.closest('.g3-leaf'); if (lf && !lf.hidden) { lf.hidden = true; task.hits++; sfx('snip'); if (task.hits >= task.need) taskFinish(); } }); document.body.appendChild(d); task.el = d; return d; }
  function taskStart(kind, sub, done) {
    var el = taskEl(); var info = TASK_INFO[kind]; task.on = true; task.kind = kind; task.done = done; task.v = 0; task.dir = 1; task.t = 0; task.hold = false; task.prog = 0; task.hits = 0; task.result = null; ui.taskOpen = true; document.exitPointerLock(); sfx('panel');
    var bar = '<div class="g3-bar" id="g3-task-bar" style="height:22px;position:relative;margin-top:10px"><span id="g3-task-fill" style="width:0%"></span><i id="g3-task-zone" style="position:absolute;top:0;bottom:0;background:rgba(111,220,140,.28);border-left:1px solid var(--green);border-right:1px solid var(--green)"></i><i id="g3-task-needle" style="position:absolute;top:-4px;bottom:-4px;width:3px;background:#fff;box-shadow:0 0 6px #fff;left:0"></i></div>';
    var body = '<h3 style="margin:0 0 4px">' + info.title + '</h3><div class="desc" style="margin-bottom:4px">' + (sub || '') + '</div><div class="desc">' + info.hint + '</div>';
    if (kind === 'trim') { task.need = 6; body += '<div id="g3-task-field" style="position:relative;height:200px;margin-top:10px;border:1px dashed var(--panel-line);border-radius:10px;background:rgba(0,0,0,.25)">' + Array.apply(null, Array(6)).map(function (_, i) { return '<button class="g3-leaf" style="position:absolute;left:' + (8 + Math.random() * 80) + '%;top:' + (8 + Math.random() * 74) + '%;width:44px;height:44px;border-radius:50% 0;background:#3aa36a;border:2px solid #1f6f3a;transform:rotate(' + (Math.random() * 360) + 'deg);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4)"></button>'; }).join('') + '</div>' + bar; task.timer = 8; }
    else body += bar;
    body += '<div id="g3-task-read" class="desc" style="margin-top:8px;font-family:var(--mono)">…</div>';
    el.innerHTML = body; el.hidden = false;
    var zone = $('g3-task-zone'); if (kind === 'weigh') { zone.style.left = ((3.5 - 0.25) / 7 * 100) + '%'; zone.style.width = (0.5 / 7 * 100) + '%'; } else if (kind === 'roll') { zone.style.left = '68%'; zone.style.width = '22%'; } else if (kind === 'bake') { zone.style.left = '60%'; zone.style.width = '20%'; } else zone.style.display = 'none';
    if (kind !== 'weigh') $('g3-task-needle').style.display = 'none';
    task.last = performance.now(); cancelAnimationFrame(task.loop); task.loop = requestAnimationFrame(taskTick);
  }
  function taskTick(ts) {
    if (!task.on) return; var dt = Math.min(0.1, (ts - task.last) / 1000); task.last = ts; task.t += dt; var read = $('g3-task-read'), fill = $('g3-task-fill');
    if (task.kind === 'weigh') { task.v += task.dir * dt * 4.2; if (task.v > 7) { task.v = 7; task.dir = -1; } if (task.v < 0) { task.v = 0; task.dir = 1; } $('g3-task-needle').style.left = (task.v / 7 * 100) + '%'; read.textContent = task.v.toFixed(2) + ' g'; }
    else if (task.kind === 'grind') { task.prog = Math.max(0, task.prog - dt * 14); fill.style.width = task.prog + '%'; read.textContent = Math.round(task.prog) + '%'; if (task.prog >= 100) { taskFinish(); return; } }
    else if (task.kind === 'roll') { if (task.hold) task.prog += dt * 55; fill.style.width = Math.min(100, task.prog) + '%'; read.textContent = task.prog > 100 ? 'too tight, it tore' : Math.round(task.prog) + '%'; if (task.prog > 108) { taskFinish(); return; } }
    else if (task.kind === 'bake') { task.prog += dt * 22; fill.style.width = Math.min(100, task.prog) + '%'; read.textContent = task.prog < 60 ? 'not yet…' : task.prog <= 80 ? 'golden: now' : 'burning'; if (task.prog >= 100) { taskFinish(); return; } }
    else if (task.kind === 'trim') { task.timer -= dt; fill.style.width = Math.max(0, task.timer / 8 * 100) + '%'; read.textContent = task.hits + ' / ' + task.need + ' leaves · ' + Math.max(0, task.timer).toFixed(1) + ' s'; if (task.timer <= 0) { taskFinish(); return; } }
    task.loop = requestAnimationFrame(taskTick);
  }
  function taskPress(down) {
    if (!task.on) return;
    if (task.kind === 'grind') { if (down) { task.prog = Math.min(100, task.prog + 10); sfx('click'); if (task.prog >= 100) taskFinish(); } }
    else if (task.kind === 'roll') { if (down) task.hold = true; else if (task.hold) { task.hold = false; taskFinish(); } }
    else if (task.kind === 'weigh' || task.kind === 'bake') { if (down) taskFinish(); }
  }
  function taskFinish() {
    if (!task.on) return; var score = 1, note = '';
    if (task.kind === 'weigh') { var off = Math.abs(task.v - 3.5); score = off <= 0.2 ? 1 : off <= 0.5 ? 0.6 : 0.2; note = task.v.toFixed(2) + ' g, ' + (score === 1 ? 'spot on' : score === 0.6 ? 'close enough' : (task.v < 3.5 ? 'light' : 'heavy') + ', that costs quality'); }
    else if (task.kind === 'roll') { score = task.prog > 100 ? 0.2 : task.prog >= 68 && task.prog <= 90 ? 1 : 0.6; note = task.prog > 100 ? 'the paper tore' : score === 1 ? 'tight and even' : 'a bit loose'; }
    else if (task.kind === 'bake') { score = task.prog >= 60 && task.prog <= 80 ? 1 : task.prog < 60 ? 0.5 : 0.3; note = score === 1 ? 'golden brown' : task.prog < 60 ? 'underdone' : 'a little burnt'; }
    else if (task.kind === 'trim') { score = task.hits / task.need; note = task.hits + ' of ' + task.need + ' leaves trimmed'; }
    else note = 'ground fine';
    task.result = { score: score, note: note, value: task.v, prog: task.prog }; task.on = false; ui.taskOpen = false; cancelAnimationFrame(task.loop); if (task.el) task.el.hidden = true; sfx(score >= 1 ? 'ok' : score >= 0.5 ? 'click' : 'bad');
    var cb = task.done; task.done = null; if (cb) cb(task.result); lockPointer(); afterAction();
  }
  function taskCancel() { if (!task.on) return; task.on = false; ui.taskOpen = false; cancelAnimationFrame(task.loop); if (task.el) task.el.hidden = true; task.done = null; toast('Stopped', ''); lockPointer(); }
  // run several tasks one after another, collecting each result, then hand the list to the finish callback
  function taskChain(list, finish) { var results = []; (function next() { if (!list.length) { finish(results); return; } var it = list.shift(); taskStart(it.kind, it.sub, function (r) { results.push(r); next(); }); })(); }
  var lockRetryT = 0;
  function lockPointer(retry) { if (!ui.started) return; try { var r = canvas.requestPointerLock(); if (r && r.catch) r.catch(function () { lockRetry(); }); } catch (e) { lockRetry(); } }
  function lockRetry() {   /* Chromium refuses a lock asked for within about a second of an Esc that released it; ask once more after the cool-down, unless something opened meanwhile */
    var t = now(); if (t - lockRetryT < 1500) return; lockRetryT = t; setTimeout(function () { if (ui.started && !player.locked && !ui.blocked() && !ui.menuOpen) { try { canvas.requestPointerLock(); } catch (e) {} } }, 1200);
  }

  function paneShop() {
    var h = '<div class="g3-grid"><div class="g3-box"><h3>🛒 Supplies</h3><div class="desc">Paid from the bank (' + money(S.bank) + '). Orders are boxed up and the supplier\'s van drops them in the back room a couple of minutes later. Carry crates from there to the supply rack or the machines.</div>' + (S.order ? '<div class="g3-chips"><span class="g3-chip amber">open order: ' + esc(orderSummary(S.order.items)) + '</span></div>' : '') + (S.deliveries.length ? '<div class="g3-chips">' + S.deliveries.map(function (d) { return '<span class="g3-chip">🚚 ' + esc(orderSummary(d.items)) + ' · ~' + Math.max(0, Math.ceil((d.due - now()) / 1000)) + ' s</span>'; }).join('') + '</div>' : '');
    SUPPLIES.forEach(function (it) { var own = it.tool ? (S.supplies[it.id] ? 'owned' : 'not yet') : (S.supplies[it.id] || 0); h += '<div class="g3-row"><span class="ico">' + it.ico + '</span><span class="meta"><span class="n">' + it.name + '</span><span class="own">' + (it.stock === 'vend' ? 'machines: ' + stockTotal('vending', it.id) : it.stock === 'coffee' ? 'machines: ' + stockTotal('lobbyCoffee', it.id) : 'rack: ' + own) + ((S.storage[it.id] || 0) ? ' · back room: ' + S.storage[it.id] : '') + ' · ' + it.hint + '</span></span><span class="price">' + money(Math.round(it.price * supplyDisc())) + '</span><button class="g3-btn" data-act="buy" data-id="' + it.id + '"' + (it.tool && S.supplies[it.id] ? ' disabled' : '') + '>Buy</button></div>'; });
    h += '</div><div class="g3-box"><h3>🌿 Grow room</h3><div class="desc">What you have on hand right now.</div><div class="g3-chips">' +
      chip('cash', money(S.bank)) + chip('soil', S.supplies.soil || 0) + chip('pots free', (S.supplies.pot || 0) - S.plants.length) + chip('nutrients', S.supplies.nutrients || 0) + chip('spray', S.supplies.remedy || 0) + chip('baggies', S.supplies.bag || 0) + chip('papers', S.supplies.paper || 0) + chip('tips', S.supplies.tip || 0) + chip('jars', S.supplies.jar || 0) + '</div>' +
      '<div class="desc">Seeds in stock:</div><div class="g3-chips">' + STRAINS.map(function (s) { return chip(s.emoji + ' ' + s.name, S.supplies['seed_' + s.id] || 0); }).join('') + '</div>' +
      '<div class="desc" style="margin-top:10px">Starter kit: soil + a pot per plant, a seed, then water till harvest. Cure it, grind it, bag or roll it, sell it at the window.</div>' +
      '<button class="g3-btn primary wide" data-act="starter">🧰 Buy starter bundle · ' + money(starterCost()) + ' <small>(soil + Sunflower Kush seed + nutrients)</small></button>' +
      '</div></div>';
    return h;
  }
  function chip(k, v) { return '<span class="g3-chip">' + k + ' <b>' + v + '</b></span>'; }
  function paneSeeds() {
    var h = '<div class="g3-box"><h3>🌱 Seed bank</h3><div class="desc">Higher strains unlock as you level up. Grow time is at windowsill speed; lamps make it faster.</div><div class="g3-strains">';
    STRAINS.forEach(function (s) { var locked = S.level < s.lvl; h += '<div class="g3-strain ' + (locked ? 'locked' : '') + '"><div class="top"><span class="emoji">' + s.emoji + '</span><span class="nm">' + s.name + '</span></div><div class="traits"><span>⏱ <b>' + daysText(s.growMs) + '</b></span><span>🌾 <b>' + s.yield + 'g</b></span><span>💪 <b>' + s.thc.toFixed(1) + '×</b></span></div><div class="traits"><span><i class="sw" style="background:#' + s.bud.toString(16).padStart(6, '0') + '"></i>bud</span><span>seeds: <b>' + (S.supplies['seed_' + s.id] || 0) + '</b></span></div>' + (locked ? '<div class="g3-tier">🔒 level ' + s.lvl + '</div>' : '<button class="g3-btn primary wide" data-act="buySeed" data-id="' + s.id + '">Buy seed · ' + money(Math.round(s.seed * supplyDisc())) + '</button>') + '</div>'; });
    return h + '</div></div>';
  }
  function paneLicences() {
    var h = '<div class="g3-grid"><div class="g3-box"><h3>🪪 Licences & permits</h3><div class="desc">Paid from the bank (' + money(S.bank) + '). Some need a level or some rep first. Level ' + S.level + ' · rep ' + Math.floor(S.rep) + '.</div>';
    LICENCES.forEach(function (L) {
      var own = hasLic(L.id); var why = !own && (L.req && !hasLic(L.req) ? 'needs ' + licById(L.req).name : L.lvl && S.level < L.lvl ? 'level ' + L.lvl : L.rep && S.rep < L.rep ? 'rep ' + L.rep : '');
      h += '<div class="g3-row"><span class="ico">' + L.ico + '</span><span class="meta"><span class="n">' + L.name + '</span><span class="own">' + L.d + '</span></span>' + (own ? '<span class="g3-tier">✓ held</span>' : why ? '<span class="g3-tier">🔒 ' + why + '</span>' : '<button class="g3-btn primary" data-act="buyLic" data-id="' + L.id + '">' + money(L.price) + '</button>') + '</div>';
    });
    h += '</div><div class="g3-box"><h3>📋 What you can do</h3><div class="g3-chips">' + chip('card payments', hasLic('retail') ? 'yes' : 'cash only') + chip('connoisseurs', hasLic('premium') ? 'visit' : 'no') + chip('lounge', hasLic('lounge') ? 'open' : 'closed') + chip('machines', hasLic('catering') ? 'selling' : 'off') + chip('arcade', hasLic('amusement') ? 'on' : 'off') + chip('tent limit', TENTS.filter(function (t) { return !t.lic || hasLic(t.lic); }).reduce(function (m, t) { return Math.max(m, t.slots); }, 0) + ' slots') + chip('supply discount', Math.round((1 - supplyDisc()) * 100) + '%') + chip('export', hasLic('export') ? 'contracts open' : 'no') + '</div><div class="desc" style="margin-top:8px">Shops that were already trading when licensing arrived kept the retail, catering, amusement and lounge permits.</div></div></div>';
    return h;
  }
  function paneUpgrades() {
    var L = lightObj(); var li = lightIdx(); var nextL = LIGHTS[li + 1]; var nextT = TENTS[S.tent + 1];
    var h = '<div class="g3-grid"><div class="g3-box"><h3>⚙️ Gear upgrades</h3><div class="desc">Every upgrade shows up in the room.</div>';
    h += '<div class="g3-row"><span class="ico">💡</span><span class="meta"><span class="n">Lighting</span><span class="own">Faster growth + higher quality. now: ' + L.name + '</span></span>' + (nextL ? '<button class="g3-btn primary" data-act="buyLight">' + nextL.name + ' · ' + money(nextL.price) + '</button>' : '<span class="g3-tier">maxed</span>') + '</div>';
    h += '<div class="g3-row"><span class="ico">⛺</span><span class="meta"><span class="n">Grow tent</span><span class="own">More plant slots. now: ' + slots() + ' slots</span></span>' + (nextT ? (nextT.lic && !hasLic(nextT.lic) ? '<span class="g3-tier">🔒 ' + nextT.slots + ' slots needs ' + licById(nextT.lic).name + '</span>' : '<button class="g3-btn primary" data-act="buyTent">' + nextT.slots + ' slots · ' + money(nextT.price) + '</button>') : '<span class="g3-tier">maxed</span>') + '</div>';
    UPGRADES.forEach(function (u) { var why = !S.upgrades[u.id] && (u.req && !S.upgrades[u.req] ? 'needs ' + (UPGRADES.filter(function (x) { return x.id === u.req; })[0] || { name: u.req }).name : u.lvl && S.level < u.lvl ? 'level ' + u.lvl : ''); h += '<div class="g3-row"><span class="ico">' + u.ico + '</span><span class="meta"><span class="n">' + u.name + '</span><span class="own">' + u.d + '</span></span>' + (S.upgrades[u.id] ? '<span class="g3-tier">✓ installed</span>' : why ? '<span class="g3-tier">🔒 ' + why + '</span>' : '<button class="g3-btn primary" data-act="buyUpg" data-id="' + u.id + '">' + money(u.price) + '</button>') + '</div>'; });
    h += '</div><div class="g3-box"><h3>🥤 Machines</h3><div class="desc">Buy another and it lands beside the one you have. Press <b>F2</b> to drag it anywhere you like. They share the shop\'s stock and float.</div>';
    ['vending', 'lobbyCoffee', 'arcade', 'fridge', 'queueRope'].forEach(function (base) {
      var d = PROPS[base]; if (!d || !d.multi) return;
      var have = unitCount(base), full = have >= d.multi.max, locked = unitLock(base);
      h += '<div class="g3-row"><span class="ico">' + d.multi.ico + '</span><span class="meta"><span class="n">' + (d.multi.name || d.label.replace(/^./, function (m2) { return m2.toUpperCase(); })) + '</span><span class="own">' + have + ' of ' + d.multi.max +
        (locked ? ' · needs the ' + locked : full ? ' · the shop is full' : '') + (base === 'fridge' ? ' · one stood in the lobby sells cold drinks to customers at $2 a can, with the catering permit' : '') + '</span></span>' +
        (full || locked ? '<span class="g3-tier">' + (full ? 'max' : '🔒') + '</span>' : '<button class="g3-btn primary" data-act="buyUnit" data-id="' + base + '">' + money(machCost(base, have + 1)) + '</button>') + '</div>';
    });
    var rDown = unitIds('queueRope').filter(function (u) { return propPlacement(u).hidden; }).length; if (rDown) h += '<div class="g3-row"><span class="ico">🪢</span><span class="meta"><span class="n">Rope lines taken down</span><span class="own">' + rDown + ' in the back, free to put up again where they stood</span></span><button class="g3-btn" data-act="ropeUp">Put one back up</button></div>';
    h += '</div><div class="g3-box"><h3>📈 Business</h3><div class="g3-chips">' + chip('market', S.market.toFixed(2) + '×') + chip('rep', Math.floor(S.rep)) + chip('price mult', '×' + repMult().toFixed(2)) + chip('level', S.level) + '</div><div class="desc">Rep adds up to 10% to a price and brings people through the door. Connoisseurs (🎩) pay 2.2× for quality 70+.</div>' + paneStatsInner() + '</div></div>';
    return h;
  }
  function paneProcess() {
    var h = '<div class="g3-grid"><div class="g3-box"><h3>🏺 Drying &amp; curing</h3><div class="desc">Harvests hang on the drying line, then go to the curing shelf in jars and keep gaining quality. Carry a jar here to empty it into the stash.</div>';
    if (!S.batches.length) h += '<div class="g3-empty">Nothing drying or curing. Harvest a plant and hang it on the drying line.</div>';
    S.batches.forEach(function (b) { var drying = !b.cured; var dp = dryProgress(b); h += '<div class="g3-row"><span class="ico">' + (drying ? '🌬️' : '🏺') + '</span><span class="meta"><span class="n">' + gram(b.grams) + ' ' + strainById(b.strain || 'sunflower').name + ' · q' + Math.round(b.quality) + '</span><span class="own">' + (drying ? 'drying ' + Math.round(dp * 100) + '% on the line' : jarWaits(b) ? 'waiting for a jar: ' + cureSlots() + ' batches cure at once, buy another jar at the office PC' : 'curing in a jar on the curing shelf. Carry it over when you like.') + '</span><div class="g3-bar' + (drying ? '' : ' q') + '"><span style="width:' + Math.round((drying ? dp : b.quality / 100) * 100) + '%"></span></div></span></div>'; });
    h += '</div><div class="g3-box"><h3>✂️ Processing</h3><div class="desc">' + (S.supplies.grinder ? 'Grinder on the bench.' : '⚠ Buy a grinder at the office PC to process.') + '</div><div class="g3-chips">' + chip('stash', gram(S.cured.g) + (S.cured.g ? ' · q' + Math.round(curedAvgQ()) : '')) + chip('baggies', S.supplies.bag || 0) + chip('papers', S.supplies.paper || 0) + chip('tips', S.supplies.tip || 0) + chip('cookie mix', S.supplies.mix || 0) + '</div>' +
      '<div class="desc">' + (S.upgrades.grinder2 ? 'Electric grinder' : 'Hand grinder: you turn it') + ' · ' + (S.upgrades.bagger ? 'auto-bagging line' : S.upgrades.scale ? 'digital scale' : 'kitchen scale: you weigh each eighth') + ' · ' + (S.upgrades.roller ? (S.upgrades.roller2 ? 'industrial roller' : 'rolling machine') : 'hand rolled') + ' · ' + (S.upgrades.oven ? 'convection oven' : 'home oven: you watch the bake') + '</div>' +
      STRAINS.filter(function (st) { return stashOf(st.id).g > 0; }).map(function (st) { var s = stashOf(st.id); return '<div class="g3-row"><span class="ico">' + st.emoji + '</span><span class="meta"><span class="n">' + st.name + ' <small>' + gram(s.g) + ' · q' + Math.round(s.qSum / s.g) + '</small></span><span class="own">bags ' + lotOf('bags', st.id).n + ' · joints ' + lotOf('joints', st.id).n + ' · cookies ' + lotOf('cookies', st.id).n + ' on the shelf</span></span></div><div class="g3-chips"><button class="g3-btn primary" data-act="bagOne" data-id="' + st.id + '">🛍️ Bag ' + bagGrams() + ' g</button>' + (S.upgrades.bagger ? '<button class="g3-btn" data-act="bagAll" data-id="' + st.id + '">🛍️ Bag all</button>' : '') + '<button class="g3-btn primary" data-act="rollOne" data-id="' + st.id + '">🚬 Roll ' + (S.upgrades.roller ? (S.upgrades.roller2 ? '10' : '5') : '1') + '</button>' + (S.upgrades.roller ? '<button class="g3-btn" data-act="rollAll" data-id="' + st.id + '">🚬 Roll all</button>' : '') + '<button class="g3-btn primary" data-act="bakeOne" data-id="' + st.id + '">🍪 Bake 6</button>' + (S.upgrades.oven ? '<button class="g3-btn" data-act="bakeAll" data-id="' + st.id + '">🍪 Bake all</button>' : '') + '</div>'; }).join('') +
      (S.cured.g > 0 ? '' : '<div class="g3-empty">Nothing in the stash. Empty a cured jar here first.</div>') +
      '<div class="g3-chips" style="margin-top:12px">' + chip('bags on the shelf', S.pkg.bags.n) + chip('joints on the shelf', S.pkg.joints.n) + chip('cookies on the shelf', S.pkg.cookies.n) + '</div><div class="desc">Packed goods go on the goods shelf by the window, sorted by strain. Pick them up there (E, or Shift+E for a handful) and carry them to a customer or the till.</div></div></div>';
    return h;
  }
  function panePayment(c) {
    var h = '<div class="g3-box"><h3>' + (c.pay === 'card' ? '💳' : '💵') + ' ' + c.who + ' is paying · ' + money(c.due) + '</h3>';
    if (c.pay === 'card') h += '<div class="desc">Card for ' + esc(wantText(c)) + '. Run it through the terminal.</div><button class="g3-btn primary wide" data-act="payCard">💳 Run the card · ' + money(c.due) + '</button>';
    else if (c.stage === 'pay') h += '<div class="desc">' + c.who + ' holds out <b>' + money(c.tendered) + '</b> in cash for a ' + money(c.due) + ' order.</div><button class="g3-btn primary wide" data-act="payCash">💵 Take the ' + money(c.tendered) + '</button>';
    else h += '<div class="desc">You took <b>' + money(c.tendered) + '</b> for a <b>' + money(c.due) + '</b> order. Count the change out of the till:</div><div class="g3-chips">' + [50, 20, 10, 5, 1].map(function (d) { return '<button class="g3-btn" data-act="chg" data-id="' + d + '">$' + d + '</button>'; }).join('') + '</div><div class="desc">In hand for ' + c.who + ': <b>' + money(c.changeGiven) + '</b></div><div class="inv-row" style="display:flex;gap:6px"><button class="g3-btn primary" data-act="chgGive">🤝 Hand over the change</button><button class="g3-btn" data-act="chgUndo">↺ Back in the till</button></div>';
    return h + '</div>';
  }
  function moneyRows() {
    return '<div class="g3-chips">' + chip('bank', money(S.bank)) + chip('vault', money(S.vault)) + chip('pocket', money(S.pocket)) + '</div><div class="g3-chips">' + chip('till', money(S.till)) + chip('vending', money(coinTotal('vending'))) + chip('fridges', money(coinTotal('fridge'))) + chip('coffee', money(coinTotal('lobbyCoffee'))) + chip('arcade', money(coinTotal('arcade'))) + chip('tip jar', money(S.tips)) + '</div>';
  }
  function paneVault() {
    var h = '<div class="g3-grid"><div class="g3-box"><h3>🔒 Vault · ' + money(S.vault) + '</h3><div class="desc">Cash you carry in your pocket goes in here. The bank courier collects from your pocket, so take out what you booked before they arrive.</div>' + moneyRows();
    h += '<button class="g3-btn primary wide" data-act="vaultDeposit"' + (S.pocket > 0 ? '' : ' disabled') + '>🔒 Put ' + money(S.pocket) + ' from my pocket in the vault</button>';
    h += '<div class="desc" style="margin-top:8px">Take out</div><div class="g3-chips">' + [50, 100, 250, 500].map(function (a) { return '<button class="g3-btn" data-act="vaultWithdraw" data-id="' + a + '"' + (S.vault >= a ? '' : ' disabled') + '>' + money(a) + '</button>'; }).join('') + '<button class="g3-btn" data-act="vaultWithdraw" data-id="all"' + (S.vault > 0 ? '' : ' disabled') + '>everything</button>' + (S.courier ? '<button class="g3-btn primary" data-act="vaultWithdraw" data-id="courier"' + (S.vault >= Math.max(0, S.courier.amount - S.pocket) ? '' : ' disabled') + '>the courier\'s ' + money(S.courier.amount) + '</button>' : '') + '</div>';
    h += '</div><div class="g3-box"><h3>🏦 On its way to the bank</h3>' + (S.pending.length ? S.pending.map(function (p) { return '<div class="g3-row"><span class="ico">🚚</span><span class="meta"><span class="n">' + money(p.amount) + '</span><span class="own">clears ' + (SET.dayNight === 'cycle' ? 'on day ' + p.dueDay : 'tomorrow') + '</span></span></div>'; }).join('') : '<div class="g3-empty">nothing in transit</div>') + (S.courier ? '<div class="desc" style="margin-top:8px">Courier booked for <b>' + money(S.courier.amount) + '</b> · ' + (S.courier.state === 'called' ? 'on their way to the back gate' : 'waiting in the back room') + '</div>' : '<div class="desc" style="margin-top:8px">Book a pickup under Bank on the office laptop.</div>') + '</div></div>';
    return h;
  }
  function paneAtm() {
    var fee = S.upgrades.fintech ? 0 : Math.ceil(S.pocket * 0.02);   /* the payment terminal account waives it, as the deposit itself already did */
    var h = '<div class="g3-grid"><div class="g3-box"><h3>🏧 RF Bank · ' + money(S.bank) + '</h3><div class="desc">Deposit the cash in your pocket straight into the bank. ' + (S.upgrades.fintech ? 'Your payment terminal account waives the handling fee' : 'The machine keeps a 2% handling fee') + '; the courier is free but takes a day.</div>' + moneyRows();
    h += '<button class="g3-btn primary wide" data-act="atmDeposit"' + (S.pocket > 0 ? '' : ' disabled') + '>🏧 Deposit ' + money(S.pocket) + (S.pocket > 0 ? ' <small>(fee ' + money(fee) + ', ' + money(S.pocket - fee) + ' credited)</small>' : '') + '</button>';
    h += '<div class="desc" style="margin-top:8px">Withdraw into your pocket</div><div class="g3-chips">' + [50, 100, 250, 500].map(function (a) { return '<button class="g3-btn" data-act="atmWithdraw" data-id="' + a + '"' + (S.bank >= a ? '' : ' disabled') + '>' + money(a) + '</button>'; }).join('') + '</div>';
    h += '</div><div class="g3-box"><h3>📒 Statement</h3>' + paneLogInner(10) + '</div></div>';
    return h;
  }
  function paneLedger() {
    var B = books(), rows = billLines(), L = B.lastBill, daily = dailyFixed();
    function row(ico, n, own) { return '<div class="g3-row"><span class="ico">' + ico + '</span><span class="meta"><span class="n">' + n + '</span><span class="own">' + own + '</span></span></div>'; }
    var h = '<h3>Profit &amp; loss</h3><div class="desc">The bills fall every morning whether or not there is anything ready to sell. Tax is settled on the first of each month.</div>';
    h += rows.map(function (r) { return row('−', r.k + ' ' + money(r.v), esc(r.d)); }).join('');
    h += row('=', money(daily) + ' a day', 'what the business costs to stand still');
    h += row('$', money(B.dayGross) + ' taken today', money(B.monthGross) + ' so far this month');
    h += row('−', money(B.dayOther) + ' spent on the crop today', 'trimming, testing and compliance at $' + COST.processPerGram.toFixed(2) + ' a gram, ' + money(B.monthOther) + ' this month');
    h += row('%', money(taxDue()) + ' tax owed', Math.round(ECON.excise * 100) + '% excise sits inside every sale, plus ' + Math.round(ECON.taxRate * 100) + '% on the month, and ' + Math.round(ECON.taxHighRate * 100) + '% on what the month takes over ' + money(ECON.taxHighFrom) + '. Due on day ' + taxDay() + '.');
    if (B.arrears > 0.5) h += row('!', money(B.arrears) + ' in arrears', 'unpaid bills. Rep falls every day this stands');
    if (L && L.short > 0.5) h += '<div class="desc">Day ' + L.day + ': ' + money(L.short) + ' of that morning\'s bill went unpaid.</div>';
    return h;
  }
  function paneBank() {
    var h = '<div class="g3-grid"><div class="g3-box"><h3>🏦 Bank · ' + money(S.bank) + '</h3><div class="desc">Online orders and upgrades are paid from the bank. Card sales land here straight away. Cash has to be collected: book a courier, meet them at the back door with the money in your pocket, and it clears the next morning.</div>' + moneyRows();
    h += '<div class="desc" style="margin-top:10px">Book a cash pickup</div><div class="g3-chips">' + [100, 500, 1000, 2500, 5000, 10000, 25000, 50000].map(function (a) { return '<button class="g3-btn' + (a <= S.vault + S.pocket ? ' primary' : '') + '" data-act="courierCall" data-id="' + a + '"' + (S.courier ? ' disabled' : '') + '>' + money(a) + '</button>'; }).join('') + '<button class="g3-btn" data-act="courierCall" data-id="all"' + (S.courier || S.vault + S.pocket < 50 ? ' disabled' : '') + '>all cash on hand · ' + money(S.vault + S.pocket) + '</button></div>';
    if (S.courier) h += '<div class="desc" style="margin-top:8px">Courier booked for <b>' + money(S.courier.amount) + '</b> · ' + (S.courier.state === 'called' ? 'arriving at the back gate shortly' : 'waiting in the back room now') + '</div>';
    if (hasLic('export')) { h += '<div class="desc" style="margin-top:10px">Bulk contracts (70% of gram value, paid tomorrow)</div>'; var anyX = false; STRAINS.forEach(function (st) { var sg = stashOf(st.id).g; if (sg < 20) return; anyX = true; var q = stashOf(st.id).qSum / sg, thc = stashOf(st.id).thcSum / sg; h += '<div class="g3-row"><span class="ico">' + st.emoji + '</span><span class="meta"><span class="n">' + st.name + ' · ' + gram(sg) + ' in the stash</span><span class="own">' + money(gramValue(q, thc) * 0.7) + ' per gram</span></span></div><div class="g3-chips">' + [20, 50, 100].filter(function (n) { return n <= sg; }).map(function (n) { return '<button class="g3-btn" data-act="exportSell" data-id="' + st.id + ':' + n + '">sell ' + n + ' g · ' + money(gramValue(q, thc) * 0.7 * n) + '</button>'; }).join('') + '</div>'; }); if (!anyX) h += '<div class="g3-empty">no strain has 20 g cured yet</div>'; }
    h += '</div><div class="g3-box">' + paneLedger() + '<h3 style="margin-top:12px">📒 In transit</h3>' + (S.pending.length ? S.pending.map(function (p) { return '<div class="g3-row"><span class="ico">🚚</span><span class="meta"><span class="n">' + money(p.amount) + '</span><span class="own">clears ' + (SET.dayNight === 'cycle' ? 'on day ' + p.dueDay : 'tomorrow') + '</span></span></div>'; }).join('') : '<div class="g3-empty">nothing in transit</div>');
    h += '<h3 style="margin-top:12px">🚚 Deliveries</h3>' + (S.order ? '<div class="g3-row"><span class="ico">🛒</span><span class="meta"><span class="n">Open order</span><span class="own">' + esc(orderSummary(S.order.items)) + ' · dispatches in a moment</span></span></div>' : '') + (S.deliveries.length ? S.deliveries.map(function (d) { return '<div class="g3-row"><span class="ico">🚚</span><span class="meta"><span class="n">' + esc(orderSummary(d.items)) + '</span><span class="own">van arrives in ~' + Math.max(0, Math.ceil((d.due - now()) / 1000)) + ' s at the back door</span></span></div>'; }).join('') : (S.order ? '' : '<div class="g3-empty">no deliveries on the road</div>')) + '</div></div>';
    return h;
  }
  function paneStorage() {
    var ids = Object.keys(S.storage).filter(function (k) { return S.storage[k] > 0; });
    var h = '<div class="g3-grid"><div class="g3-box"><h3>📦 Back room stock</h3><div class="desc">Take a crate from the racks (E) and carry it to where it goes: supplies and seeds to the supply rack in the office, drinks and snacks to the vending machine, cups and beans to the coffee machine.</div>';
    h += ids.length ? ids.map(function (k) { return '<div class="g3-row"><span class="ico">' + itemIcon(k) + '</span><span class="meta"><span class="n">' + esc(itemName(k)) + '</span><span class="own">' + S.storage[k] + ' in storage · goes to the ' + (k.indexOf('seed_') === 0 ? 'supply rack' : (supplyById(k) && supplyById(k).stock === 'vend') ? 'vending machine' : (supplyById(k) && supplyById(k).stock === 'coffee') ? 'coffee machine' : (supplyById(k) && supplyById(k).stock === 'display') ? 'counter display by the till' : 'supply rack') + '</span></span></div>'; }).join('') : '<div class="g3-empty">Empty. Order at the office laptop and the supplier\'s van drops it here.</div>';
    h += '</div><div class="g3-box"><h3>🥤 Machines</h3><div class="g3-chips">' + chip('drinks', stockTotal('vending', 'drink')) + chip('snacks', stockTotal('vending', 'snack')) + chip('cups', stockTotal('lobbyCoffee', 'cup')) + chip('beans', stockTotal('lobbyCoffee', 'beans')) + '</div><h3 style="margin-top:12px">🚚 On the road</h3>' + (S.order ? '<div class="desc">Open order: ' + esc(orderSummary(S.order.items)) + '</div>' : '') + (S.deliveries.length ? S.deliveries.map(function (d) { return '<div class="g3-row"><span class="ico">🚚</span><span class="meta"><span class="n">' + esc(orderSummary(d.items)) + '</span><span class="own">~' + Math.max(0, Math.ceil((d.due - now()) / 1000)) + ' s</span></span></div>'; }).join('') : '<div class="g3-empty">nothing on the way</div>') + '</div></div>';
    return h;
  }
  function paneStock() {
    var h = '<div class="g3-grid"><div class="g3-box"><h3>🗄️ Stock cabinet</h3><div class="desc">Packed goods kept off the shop floor: robbers never get at these, and the goods shelf only shows what you put out. Bring bags, joints or cookies here and press E to lock them away.</div>';
    var any = false;
    ['bags', 'joints', 'cookies'].forEach(function (k) { Object.keys(S.stock[k] || {}).forEach(function (id) { var l = S.stock[k][id]; if (l.n <= 0) return; any = true; var st = strainById(id); h += '<div class="g3-row"><span class="ico">' + st.emoji + '</span><span class="meta"><span class="n">' + l.n + ' ' + esc(st.name) + ' ' + kindName(k, l.n) + '</span><span class="own">q' + Math.round(l.qSum / l.n) + ' · shelf has ' + lotCount(k, id) + '</span></span><button class="g3-btn" data-act="stockTake" data-id="' + k + '|' + id + '|1">take 1</button><button class="g3-btn" data-act="stockTake" data-id="' + k + '|' + id + '|5">take 5</button><button class="g3-btn primary" data-act="stockToShelf" data-id="' + k + '|' + id + '">put on the shelf</button></div>'; }); });
    if (!any) h += '<div class="g3-empty">Empty. Bring packed goods here, or pull the shelf in with the button on the right.</div>';
    h += '</div><div class="g3-box"><h3>🛍️ Goods shelf</h3><div class="desc">What is out in the hall right now.</div><div class="g3-chips">' + chip('bags', S.pkg.bags.n) + chip('joints', S.pkg.joints.n) + chip('cookies', S.pkg.cookies.n) + '</div>';
    h += '<button class="g3-btn wide" data-act="shelfToStock">🔒 Lock everything on the shelf in here</button><button class="g3-btn wide" data-act="stockAllToShelf">🛍️ Put everything in here out on the shelf</button></div></div>';
    return h;
  }
  function paneStaff() {
    var st = S.staff, list = crewList();
    var h = '<div class="g3-grid"><div class="g3-box"><h3>🧑‍🔧 Shop floor · ' + list.length + ' of ' + CREW_MAX + '</h3>';
    h += '<div class="desc">Your crew serve the window, restock the supply rack and the machines, sweep and tend the plants. Each one takes ' + money(WORKER_WAGE) + ' a day at the morning bill (the bank first, then the vault, then the till), and walks if it isn\'t there. Give orders with <b>Shift+E</b> on them, or from here.</div>';
    if (!list.length) h += '<div class="g3-empty">Nobody on the floor but you.</div>';
    list.forEach(function (c, i) {
      h += '<div class="g3-row"><span class="ico">' + (c.off ? '🏠' : '🧑‍🔧') + '</span><span class="meta"><span class="n">' + crewName(i) + '</span><span class="own">' + (c.off ? 'at home · no wage while they are off' : workerTaskLabel(i) + (c.post ? ' · posted at ' + c.post.x.toFixed(0) + ', ' + c.post.z.toFixed(0) : '') + ' · ' + money(WORKER_WAGE) + ' a day') + '</span></span><button class="g3-btn' + (c.off ? ' primary' : '') + '" data-act="crewShift" data-id="' + i + '">' + (c.off ? '📞 Call in' : '🏠 Send home') + '</button><button class="g3-btn" data-act="fire" data-id="' + i + '">Let go</button></div>';
      if (!c.off) h += '<div class="g3-chips">' + WORKER_TASKS.map(function (t) { return '<button class="g3-btn' + (c.task === t[0] ? ' primary' : '') + '" data-act="workerTask" data-id="' + i + '|' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    });
    if (list.length < CREW_MAX) h += '<button class="g3-btn primary wide" data-act="hire">🤝 Hire ' + CREW_LOOK[Math.min(list.length, CREW_LOOK.length - 1)].name + ' · ' + money(crewHireCost()) + ' now + ' + money(WORKER_WAGE) + ' a day</button>';
    else h += '<div class="desc">That\'s as many as the shop floor will take.</div>';
    h += '</div><div class="g3-box"><h3>🛡️ The guard · ' + (guardOff() ? 'off shift' : 'on the door') + '</h3>' +
      '<button class="g3-btn wide' + (guardOff() ? ' primary' : '') + '" data-act="guardShift">' + (guardOff() ? '📞 Call the guard in' : '🏠 Send the guard home') + '</button>' +
      '<div class="desc">The guard checks IDs at the door by default. Send him on a patrol to keep robbers away and break up fights faster, or give him a chore. He always comes back to the door when someone walks in. <b>Shift+E</b> on him works too. He draws ' + money(COST.guardWage) + ' a day on the morning bill while he\'s on shift. He and the crew carry a key to every door you leave marked staff key on the control box, and lock it again behind them.</div><div class="g3-chips">' + GUARD_TASKS.map(function (t) { return '<button class="g3-btn' + (st.guardTask === t[0] ? ' primary' : '') + '" data-act="guardTask" data-id="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div></div></div>';
    return h;
  }
  function paneRegister() {
    var h = '<div class="g3-grid"><div class="g3-box"><h3>💵 Price board</h3><div class="desc">Market ' + S.market.toFixed(2) + '× · rep ' + Math.floor(S.rep) + ' (×' + repMult().toFixed(2) + ' price). Hand goods to a customer at the window for the full price. Rung up at the till (E) as a walk-up sale they fetch 85%, and the till takes ' + WALKUP_CAP + ' of those a day (' + walkupLeft() + ' left today).</div>';
    if (S.customer && S.customer.stage) h += panePayment(S.customer);
    h += '<div class="g3-chips">' + chip('in the till', money(S.till)) + chip('pocket', money(S.pocket)) + chip('lighters', S.display.lighter || 0) + chip('papers', S.display.rpaper || 0) + chip('grinders', S.display.rgrinder || 0) + '</div>' + (S.till > 0 ? '<button class="g3-btn wide" data-act="tillEmpty">👛 Empty the till into my pocket · ' + money(S.till) + '</button>' : '');
    if (S.customer && !S.customer.arrived) h += '<div class="g3-customer"><span class="avatar">' + S.customer.avatar + '</span><span style="flex:1"><span class="who">' + S.customer.who + '</span><span class="req">' + (S.customer.fromLine ? 'is stepping up from the line.' : guardOnDuty() ? 'just walked in, and the guard is checking their ID.' : 'just walked in, and they\'ll show you their ID at the window.') + ' You\'ll hear the order at the window.</span></span></div>';
    else if (S.customer && !S.customer.arrived && !S.customer.stage) { h += '<div class="g3-customer"><span class="avatar">' + S.customer.avatar + '</span><span style="flex:1"><span class="who">' + S.customer.who + (S.customer.premium ? ' 🎩' : '') + '</span><span class="req">coming through the ID check. You\'ll hear the order at the window.</span></span></div>'; }
    else if (S.customer) { var c = S.customer; var gv = c.given ? c.given.n : 0; var left = Math.max(0, Math.round((c.until - now()) / 1000)); h += '<div class="g3-customer ' + (c.premium ? 'premium' : '') + '"><span class="avatar">' + c.avatar + '</span><span style="flex:1"><span class="who">' + c.who + (c.premium ? ' 🎩' : '') + '</span><span class="req">wants <b>' + wantText(c) + '</b>' + (c.premium ? ' at quality ' + c.minQ + '+ (pays 2.2×)' : ' (pays 1.15×)') + ' · handed ' + gv + '/' + c.qty + '</span><span class="timer">leaves in ' + left + 's</span></span></div>'; }
    else h += '<div class="g3-empty">No customer at the window. One will wander in…</div>';
    if (lineShown()) h += '<div class="g3-empty">👥 ' + lineShown() + ' more waiting in line</div>';
    var anyGoods = false;
    STRAINS.forEach(function (st) { var bg = lotOf('bags', st.id), jt = lotOf('joints', st.id), ck = lotOf('cookies', st.id); if (!bg.n && !jt.n && !ck.n) return; anyGoods = true;
      h += '<div class="g3-row"><span class="ico">' + st.emoji + '</span><span class="meta"><span class="n">' + st.name + '</span><span class="own">' + (bg.n ? bg.n + ' bags q' + Math.round(bg.qSum / bg.n) + ' · ' + money(bagPrice(bg.qSum / bg.n, bg.thcSum / bg.n)) + ' each' : 'no bags') + ' &nbsp;·&nbsp; ' + (jt.n ? jt.n + ' joints q' + Math.round(jt.qSum / jt.n) + ' · ' + money(jointPrice(jt.qSum / jt.n, jt.thcSum / jt.n)) + ' each' : 'no joints') + (ck.n ? ' &nbsp;·&nbsp; ' + ck.n + ' cookies q' + Math.round(ck.qSum / ck.n) + ' · ' + money(cookiePrice(ck.qSum / ck.n, ck.thcSum / ck.n)) + ' each' : '') + '</span></span></div>'; });
    if (!anyGoods) h += '<div class="g3-row"><span class="ico">🛍️</span><span class="meta"><span class="n">Board prices</span><span class="own">bags ' + money(bagPrice(curedAvgQ() || 60, curedAvgThc())) + ' · joints ' + money(jointPrice(curedAvgQ() || 60, curedAvgThc())) + ' at current stash quality (nothing packed yet)</span></span></div>';
    var hh = held(); if (hh && (hh.kind === 'joints' || hh.kind === 'bags' || hh.kind === 'cookies')) h += '<button class="g3-btn primary wide" data-act="sellHeld"' + (walkupLeft() > 0 ? '' : ' disabled') + '>💵 Ring up what I\'m holding as a walk-up (' + Math.min(hh.n, walkupLeft()) + ' ' + hh.kind + ' at 85%)</button>';
    h += '</div><div class="g3-box"><h3>📜 Recent activity</h3>' + paneLogInner(14) + '</div></div>';
    return h;
  }
  function paneInventory() {
    var h = '<div class="g3-grid"><div class="g3-box"><h3>🎒 Supplies</h3>';
    SUPPLIES.forEach(function (it) { h += '<div class="g3-row"><span class="ico">' + it.ico + '</span><span class="meta"><span class="n">' + it.name + '</span><span class="own">' + it.hint + '</span></span><span class="price" style="color:var(--ink)">' + (it.tool ? (S.supplies[it.id] ? '✓' : 'no') : (S.supplies[it.id] || 0)) + '</span></div>'; });
    h += '</div><div class="g3-box"><h3>🌱 Seeds &amp; product</h3><div class="g3-chips">' + STRAINS.map(function (s) { return chip(s.emoji + ' ' + s.name, S.supplies['seed_' + s.id] || 0); }).join('') + '</div><div class="g3-chips">' + chip('cured stash', gram(S.cured.g)) + chip('avg quality', Math.round(curedAvgQ())) + chip('bags', S.pkg.bags.n) + chip('joints', S.pkg.joints.n) + '</div><div class="g3-chips">' + chip('plants growing', S.plants.length + ' / ' + slots()) + chip('batches', S.batches.length) + chip('light', lightObj().name) + '</div>' + '<div class="desc" style="margin-top:8px">Upgrades: ' + (Object.keys(S.upgrades).filter(function (k) { return S.upgrades[k]; }).map(function (k) { for (var i = 0; i < UPGRADES.length; i++) if (UPGRADES[i].id === k) return UPGRADES[i].ico + ' ' + UPGRADES[i].name; return k; }).join(', ') || 'none yet') + '</div></div></div>';
    return h;
  }
  function paneLog() { return '<div class="g3-box"><h3>📜 Grow diary</h3>' + paneLogInner(60) + '</div>'; }
  function paneLogInner(n) { if (!S.log.length) return '<div class="g3-empty">Your grow diary will fill up here.</div>'; return '<div class="g3-log">' + S.log.slice(0, n).map(function (e) { return '<div class="' + e.kind + '"><span class="t">' + e.t + '</span>' + e.msg + '</div>'; }).join('') + '</div>'; }
  function paneStats() { return '<div class="g3-box"><h3>📊 Lifetime stats</h3>' + paneStatsInner() + '</div>'; }
  function paneStatsInner() { var days = Math.max(1, Math.floor((now() - (S.created || now())) / 86400000) + 1); return '<div class="g3-chips">' + chip('planted', S.stats.plants) + chip('harvested', gram(S.stats.harvested)) + chip('units sold', S.stats.sold) + chip('earned', money(S.stats.earned)) + chip('day', days) + chip('level', S.level) + chip('rep', Math.floor(S.rep)) + '</div>'; }

  // panel clicks
  function panelClick(e) {
    var b = e.target.closest('[data-act]'); if (!b) return; var act = b.getAttribute('data-act'); var id = b.getAttribute('data-id'); sfx('click');
    if (runHooks(hooks.panelClick, act, b)) { afterAction(); return; }
    if (act === 'starter') { if (S.bank < starterCost()) { toast('The starter bundle is ' + money(starterCost()) + ', and the bank\'s short', 'bad'); return; } actions.buy('soil'); actions.buySeed('sunflower'); actions.buy('nutrients'); }
    else if (act === 'stockTake') { var sp = id.split('|'); stockTake(sp[0], sp[1], +sp[2]); }
    else if (act === 'stockToShelf') { var sp2 = id.split('|'); stockToShelf(sp2[0], sp2[1]); toast('Out on the shelf', ''); sfx('putdown'); }
    else if (act === 'shelfToStock') { ['bags', 'joints', 'cookies'].forEach(function (k) { Object.keys(S.lots[k]).forEach(function (sid) { shelfToStock(k, sid); }); }); toast('🔒 Shelf cleared into the cabinet', 'good'); sfx('vault'); }
    else if (act === 'stockAllToShelf') { ['bags', 'joints', 'cookies'].forEach(function (k) { Object.keys(S.stock[k] || {}).forEach(function (sid) { stockToShelf(k, sid); }); }); toast('🛍️ Everything is out on the shelf', ''); sfx('putdown'); }
    else if (act === 'buyUnit') { buyUnit(id); } else if (act === 'ropeUp') { ropeUp(); }
    else if (act === 'hire') { hireWorker(); }
    else if (act === 'fire') { fireWorker(+id); }
    else if (act === 'workerTask') { var wt = String(id).split('|'); workerTask(wt[1], +wt[0]); }
    else if (act === 'guardTask') { guardTask(id); }
    else if (act === 'crewShift') { crewShift(+id); }
    else if (act === 'guardShift') { guardShift(); }
    else if (act === 'tillEmpty') { var tl2 = S.till; if (takeCash(tl2, 'till')) S.till = 0; }
    else if (act === 'vaultDeposit') { if (S.pocket > 0) { var dp2 = S.pocket; S.vault += dp2; S.pocket = 0; sfx('vault'); toast('🔒 ' + money(dp2) + ' into the vault', 'good'); logEvent('🔒 Vault deposit: ' + money(dp2), ''); } }
    else if (act === 'vaultWithdraw') { var amt = id === 'all' ? S.vault : id === 'courier' ? Math.max(0, (S.courier ? S.courier.amount : 0) - S.pocket) : +id; amt = Math.min(amt, S.vault); if (amt > 0) { S.vault -= amt; S.pocket += amt; sfx('vault'); toast('👛 Took ' + money(amt) + ' out (pocket ' + money(S.pocket) + ')', 'good'); } }
    else if (act === 'atmDeposit') { if (S.pocket > 0) { var feeA = S.upgrades.fintech ? 0 : Math.ceil(S.pocket * 0.02), netA = S.pocket - feeA; S.bank += netA; logEvent('🏧 ATM deposit ' + money(S.pocket) + ': ' + money(netA) + ' credited, ' + money(feeA) + ' fee', 'good'); S.pocket = 0; sfx('atm'); toast('🏧 ' + money(netA) + ' in the bank (fee ' + money(feeA) + ')', 'good'); } }
    else if (act === 'atmWithdraw') { var wa = Math.min(+id, S.bank); if (wa > 0) { S.bank -= wa; S.pocket += wa; sfx('atm'); toast('🏧 Withdrew ' + money(wa) + ' (pocket ' + money(S.pocket) + ')', 'good'); logEvent('🏧 ATM withdrawal ' + money(wa), ''); } }
    else if (act === 'courierCall') { callCourier(id === 'all' ? Math.floor(S.vault + S.pocket) : +id); }
    else if (act === 'sellHeld') sellHeld();
    else if (act === 'bagOne' || act === 'rollOne' || act === 'bakeOne') { actions[act === 'bagOne' ? 'bagUp' : act === 'rollOne' ? 'roll' : 'bake'](id); world.dirtyShelf = world.dirtyRack = true; return; }
    else if (payActions[act]) payActions[act](act === 'chg' ? +id : undefined);
    else if (act === 'deskRefresh') { fetchDesk(); setTimeout(function () { if (ui.panelOpen && ui.panelKind === 'desk') ui.render(); }, 1500); toast('Refreshing…', ''); return; }
    else if (act === 'deskOpen') { window.open('/', 'rf-desk'); return; }
    else if (act === 'deskPage') { deskSetPage(+id); ui.render(); return; }
    else if (act === 'shopToggle') toggleShopOpen();
    else if (act === 'lightsToggle') toggleLights();
    else if (act === 'staffDoorToggle') toggleStaffDoor();
    else if (act === 'roomLight') { if (!shop().lights) { shop().lights = true; shop().rooms = {}; Object.keys(ROOM_NAMES).forEach(function (r) { if (r !== id) shop().rooms[r] = false; }); applyShopState(); save(); ui.refreshOpen(); } else toggleRoomLight(id); }
    else if (act === 'rollerToggle') { rollerSet(!world.rollerOpen); ui.refreshOpen(); }
    else if (act === 'gateToggle') { gateSet(!world.gateOpen); ui.refreshOpen(); }
    else if (act === 'tvNext') { tvCycle(); }
    else if (act === 'curtainToggle') { toggleCurtain(id); ui.refreshOpen(); }
    else if (act === 'doorToggle') { var dd = doorById[id]; if (dd) { setDoor(id, !dd.open, dd.open ? undefined : false); sfx('curtain'); save(); } ui.refreshOpen(); }
    else if (act === 'doorKey') { if (doorById[id]) { if (!S.staffKeys) S.staffKeys = {}; S.staffKeys[id] = !staffKey(id); sfx('click'); save(); } ui.refreshOpen(); }
    else if (act === 'doorLock') { var dl = doorById[id]; if (dl) { setDoor(id, dl.open, !dl.locked); sfx('click'); save(); } ui.refreshOpen(); }
    else if (act === 'doorsAll') { doorsAll(id); ui.refreshOpen(); }
    else if (act === 'curtainsOpen') { setAllCurtains(true); toast('Curtains open', ''); }
    else if (act === 'curtainsClose') { setAllCurtains(false); toast('Curtains closed', ''); }
    else if (act === 'radioSet') { radio.set(id); applyShopState(); toast('♪ ' + STATIONS[id].name, ''); save(); }
    else if (act === 'dehumSet') { var zp = id.split(':'); dehumSet(zp[0], +zp[1]); }
    else if (actions[act]) { actions[act](id); if (act === 'bagUp' || act === 'bagAll' || act === 'roll' || act === 'rollAll' || act === 'bake' || act === 'bakeAll') world.dirtyShelf = world.dirtyRack = true; }
    afterAction();
  }
  $('g3-panel-body').addEventListener('click', panelClick);
  $('g3-panel-tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (!b) return; ui.panelTab = b.getAttribute('data-tab'); ui.render(); sfx('click'); });
  $('g3-panel-close').addEventListener('click', function () { ui.closePanel(); });

  // screenshots: the scene as it is, without the HUD. The desktop app files them under Pictures\Grow Co, a browser downloads them.
  function screenshot() {
    var url; try { renderer.render(scene, camera); url = canvas.toDataURL('image/png'); } catch (e) { toast('⚠ Could not take a screenshot', 'bad'); return; }
    var d = new Date(), p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    var name = 'growco-day' + (S.day || 1) + '-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()) + '.png';
    var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 1000);
    sfx('click'); toast('📸 ' + name + (/Electron/i.test(navigator.userAgent) ? ' saved in Pictures\\Grow Co' : ' downloaded'), 'good');
  }
  // save file: export writes the slot as .json, import replaces it after a look at what is in the file
  var pendingImport = null;
  function saveSlotName() { return SAVE.replace(/^rf-?grow(co)?-/, '') || 'save'; }
  function savesHtml() { return '<h4>Save file</h4><p>Export writes this shop to a .json file you can keep, or carry to another PC. Import loads one in its place: the shop in this slot is replaced, the other slots are not touched.</p><div class="g3-menu-btns"><button class="g3-btn" data-menu="save-export">⬇ Export this save</button><button class="g3-btn" data-menu="save-import">📂 Import a save file</button></div><input type="file" id="g3-save-file" accept=".json,application/json" hidden>'; }
  function saveExport() {
    saveNow(); var name = 'growco-' + saveSlotName() + '-day' + (S.day || 1) + '.json';
    var bl = new Blob([JSON.stringify(S)], { type: 'application/json' }); var a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('💾 Exported ' + name, 'good');
  }
  function saveImportRead(file) {
    var rd = new FileReader(); rd.onload = function () {
      var raw = String(rd.result || ''), s = null; try { s = JSON.parse(raw); } catch (e) {}
      if (!s || typeof s !== 'object' || typeof s.bank !== 'number' || typeof s.day !== 'number') { toast('⚠ That is not a Grow Co. save file', 'bad'); return; }
      pendingImport = raw; var body = $('g3-menu-body'); body.hidden = false;
      body.innerHTML = '<h4>Load this save?</h4><p>Day ' + (s.day || 1) + ', level ' + (s.level || 1) + ', ' + money(s.bank) + ' in the bank' + (typeof s.v === 'number' && s.v > SAVE_V ? '. It comes from a newer version of the game, so parts of it may not load' : '') + '. It replaces the shop in this slot.</p><div class="g3-menu-btns"><button class="g3-btn danger" data-menu="save-import-yes">Yes, load it</button><button class="g3-btn" data-menu="saves">← Keep mine</button></div>';
    }; rd.readAsText(file);
  }
  function saveImportApply() {
    if (!pendingImport) return; saveBlocked = true;   /* the running shop must not autosave over the file between here and the reload */
    try { localStorage.setItem(SAVE, pendingImport); sessionStorage.setItem('rfgc-skip-splash', '1'); sessionStorage.setItem('rfgc-autoplay', '1'); } catch (e) { saveBlocked = false; toast('⚠ Could not store the save', 'bad'); return; }
    toast('📂 Loading the save…', ''); setTimeout(function () { location.reload(); }, 250);
  }
  // pause menu
  function openMenu() { if (!ui.menuOpen) sfx('panel'); ui.menuOpen = true; $('g3-menu').hidden = false; $('g3-menu-body').hidden = true; document.exitPointerLock(); }
  function closeMenu() { if (ui.menuOpen) sfx('close'); ui.menuOpen = false; $('g3-menu').hidden = true; if (!ui.panelOpen) lockPointer(); }
  $('g3-menu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-menu]'); if (!b) return; var m = b.getAttribute('data-menu'); var body = $('g3-menu-body'); sfx('click');
    if (m === 'resume') closeMenu();
    else if (m === 'settings') { body.hidden = false; body.innerHTML = settingsHtml(); }
    else if (m === 'guide') { body.hidden = false; body.innerHTML = guideHtml(); }
    else if (m === 'intro') { body.hidden = false; body.innerHTML = introMenuHtml(); }
    else if (m === 'stats') { body.hidden = false; body.innerHTML = '<h4>Lifetime</h4>' + paneStatsInner(); }
    else if (m === 'saves') { body.hidden = false; body.innerHTML = savesHtml(); var fi = $('g3-save-file'); if (fi) fi.addEventListener('change', function () { if (fi.files[0]) saveImportRead(fi.files[0]); fi.value = ''; }); }
    else if (m === 'save-export') saveExport();
    else if (m === 'save-import') { var fi2 = $('g3-save-file'); if (fi2) fi2.click(); }
    else if (m === 'save-import-yes') saveImportApply();
//#if desk
    else if (m === 'reset') { if (confirm('Reset Grow Co.? All progress is lost (both the 3D and desk versions share this save).')) { S = fresh(); bindHotbar(); save(); world.dirty = true; rebuildDynamic(); hud(); closeMenu(); toast('Fresh start', ''); } }
//#else
    else if (m === 'reset') { if (confirm('Reset Grow Co.? All progress is lost.')) { S = fresh(); bindHotbar(); save(); world.dirty = true; rebuildDynamic(); hud(); closeMenu(); toast('Fresh start', ''); } }
//#endif
    else if (m === 'edit') { closeMenu(); if (!edit.on) editToggle(); }
    else if (m === 'dev') { body.hidden = false; body.innerHTML = devHtml(); }
    else if (m === 'creative') { closeMenu(); if (window.RFGROW && window.RFGROW.creative) window.RFGROW.creative.toggle(true); }
//#if desk
    else if (m === 'quit') { saveNow(); window.close(); setTimeout(function () { toast('Close this tab to return to the desk', ''); }, 200); }
//#else
    else if (m === 'quit') { saveNow(); window.close(); setTimeout(function () { toast('Your game is saved. You can close the window.', ''); }, 200); }
//#endif
  });
  var DEV = [
    ['money', '💵 +$1,000 bank'], ['pocket', '👛 +$500 pocket'], ['till', '🧾 Till +$120 · tips +$20 · machines +$30'], ['stash', '🌿 +20 g cured of every strain'], ['goods', '🛍️ +5 bags, joints, cookies of every strain'],
    ['supplies', '🧰 +10 of every supply · seeds ×5'], ['storage', '📦 A crate of everything in the back room'], ['machines', '🥤 Fill vending, coffee and the counter display'], ['plants', '🌱 Fill the tent with ready-to-harvest plants'], ['batches', '🌬️ Hang three batches, jar two'],
    ['customer', '🚪 Spawn a customer'], ['premium', '🎩 Spawn a connoisseur'], ['robbery', '🚨 Start a robbery (by shop level)'], ['robSnatch', '🧤 Snatch thief'], ['robKnife', '🔪 Knife robbery'], ['robGun', '🔫 Gunman and the vault'], ['robCrew', '👥 Two-man gang'], ['arm', '🧰 Every weapon, ammo, licence, alarm'], ['basement', '🏭 Go to the basement works'], ['toCar', '🚗 Teleport next to your car'], ['vip', '🥂 Send a lounge guest up'], ['roof', '🌿 Go to the roof greenhouse'], ['heat', '🚔 Heat +40'], ['blackout', '⚡ Power cut now'], ['delivery', '📱 Burner job now'], ['round', '📋 Two tablet round jobs'], ['tobFill', '🚬 Fill the tobacco line + cabinet'], ['fight', '👊 Start a lobby fight (needs two visitors)'], ['van', '🚚 Van arrives now with the open order'], ['courier', '🏦 Courier arrives now for $100'],
    ['dust', '🪣 Spawn 6 dirt patches'], ['clean', '🧹 Clear every dirt patch'], ['morning', '🌅 Clock to 06:00'], ['noon', '☀️ Clock to 12:00'], ['evening', '🌆 Clock to 19:00'], ['night', '🌙 Clock to 23:00'], ['day', '⏭ Skip to the next day'],
    ['level', '⭐ Level +1'], ['rep', '🏆 Rep +25'], ['upgrades', '⚙️ Every upgrade'], ['licences', '🪪 Every licence'], ['clear', '🧯 Clear cooldowns, robber, fight, courier'], ['empty', '🫙 Empty every hotbar slot'], ['humid', '💧 Humidity to 80% in both rooms'],
    ['tp_lobby', '📍 Teleport: lobby'], ['tp_office', '📍 Teleport: office'], ['tp_grow', '📍 Teleport: grow room'], ['tp_annex', '📍 Teleport: back room'], ['tp_security', '📍 Teleport: security room'], ['tp_yard', '📍 Teleport: yard']
  ];
  function devHtml() { return '<h4>Dev tools</h4><p class="desc">Cheats for testing. Everything applies to the current save at once.</p><div class="g3-chips">' + DEV.map(function (d) { return '<button class="g3-btn" data-dev="' + d[0] + '">' + d[1] + '</button>'; }).join('') + '</div>'; }
  function devAction(id) {
    var tp = function (x, z) { closeMenu(); standUp(); player.pos.set(x, 1.65, z); player.floor = 0; toast('📍 Teleported', ''); };
    switch (id) {
      case 'money': S.bank += 1000; break; case 'pocket': S.pocket += 500; break; case 'till': S.till += 120; S.tips += 20; ['vending', 'lobbyCoffee', 'fridge', 'arcade'].forEach(function (b) { unitIds(b).forEach(function (u) { coinPay(u, 10); }); }); break;
      case 'stash': STRAINS.forEach(function (st) { stashAdd(st.id, 20, 70 + st.lvl * 2, st.thc); }); break;
      case 'goods': STRAINS.forEach(function (st) { ['bags', 'joints', 'cookies'].forEach(function (k) { lotAdd(k, st.id, 5, 72, st.thc); }); }); break;
      case 'supplies': SUPPLIES.forEach(function (it) { if (it.tool) S.supplies[it.id] = 1; else S.supplies[it.id] = (S.supplies[it.id] || 0) + 10; }); STRAINS.forEach(function (st) { S.supplies['seed_' + st.id] = (S.supplies['seed_' + st.id] || 0) + 5; }); break;
      case 'storage': SUPPLIES.forEach(function (it) { if (!it.tool) S.storage[it.id] = (S.storage[it.id] || 0) + (it.qty || 10); }); STRAINS.forEach(function (st) { S.storage['seed_' + st.id] = (S.storage['seed_' + st.id] || 0) + 5; }); break;
      case 'machines': unitIds('vending').forEach(function (u) { var v = machStock(u); v.drink = 24; v.snack = 24; }); unitIds('lobbyCoffee').forEach(function (u) { var c = machStock(u); c.cup = 80; c.beans = 80; }); S.display.lighter = 20; S.display.rpaper = 10; S.display.rgrinder = 5; unitIds('fridge').forEach(function (u) { machState(u).fridge = 16; }); break;   /* the fridge holds its own cans rather than drawing on the shop's, so it needs filling by name */
      case 'plants': S.plants = []; S.potSoil = {}; for (var i = 0; i < slots(); i++) { var st2 = STRAINS[i % STRAINS.length]; S.potSoil[i] = true; S.plants.push({ id: 'p' + now() + i, strain: st2.id, progress: 1, quality: 75, thirst: 0.1, fed: true, hazard: null, slot: i }); } S.supplies.pot = Math.max(S.supplies.pot || 0, slots()); break;
      case 'batches': STRAINS.slice(0, 5).forEach(function (st, i) { S.batches.push({ id: 'b' + now() + i, grams: 18, quality: 70, baseQ: 70, thc: st.thc, startedAt: now(), cured: i >= 3, dry: i >= 3 ? 1 : 0.2, strain: st.id }); }); break;
      case 'customer': case 'premium': closeMenu(); if (!customerArrives(id === 'premium')) toast('The line is full (' + LINE_MAX + ' waiting)', ''); break;
      case 'robbery': case 'robSnatch': case 'robKnife': case 'robGun': case 'robCrew': closeMenu(); S.till = Math.max(S.till, 40); startRobbery({ robSnatch: 'snatch', robKnife: 'knife', robGun: 'gun', robCrew: 'crew' }[id]); break; case 'basement': closeMenu(); goBasement(); break; case 'vip': closeMenu(); S.lic.premium = true; shop().open = true; if (!startVip()) toast('A lounge guest is already here', ''); break; case 'roof': closeMenu(); expInteract({ kind: 'roofUp' }, null); break; case 'heat': addHeat(40); break; case 'blackout': xs().blackoutUntil = now() + 60000; break; case 'delivery': closeMenu(); S.pkg.joints.n = Math.max(S.pkg.joints.n, 2); jobSpawn('phone'); break;
      case 'round': closeMenu(); S.lic.tobacco = true; jobSpawn('tablet'); jobSpawn('tablet'); break; case 'toCar': closeMenu(); standUp(); player.floor = 0; player.pos.set(drive.g.position.x - 2.4, 1.65, drive.g.position.z); break; case 'tobFill': S.lic.tobacco = true; var TF = tob(); TF.leaf = 8; TF.cured = 2; TF.cut = 1; TF.sticks.normal = 400; TF.sticks.light = 400; TF.mat = 200; CIG_KEYS.forEach(function (k) { TF.packs[k] = 30; S.cigStock[k] = cigStock(k) + 10; }); syncTobRack(); syncCigCab(); break; case 'arm': S.lic.firearm = true; S.upgrades.panic = true; S.armory = { pepper: true, taser: true, pistol: true, shotgun: true, rifle: true, ak: true, spray: 6, rounds: 64, shells: 32, cartridges: 30, bullets: 270 }; break; case 'fight': closeMenu(); startFight(); if (!fight) toast('Need two visitors in the lobby first', 'bad'); break;
      case 'van': if (S.order) { S.deliveries.push({ items: S.order.items, due: now() }); S.order = null; } else if (!S.deliveries.length) S.deliveries.push({ items: { drink: 12, cup: 50, lighter: 20 }, due: now() }); else S.deliveries[0].due = now(); closeMenu(); break;
      case 'courier': if (!S.courier) S.courier = { amount: 100, state: 'called', at: now() }; else S.courier.at = now(); S.courierBanUntil = 0; closeMenu(); break;
      case 'dust': spawnDust(6); break; case 'clean': S.dust = []; world.dustDirty = true; break;
      case 'morning': S.clock = 6; break; case 'noon': S.clock = 12; break; case 'evening': S.clock = 19; break; case 'night': S.clock = 23; break; case 'day': S.clock = 23.999; break;
      case 'level': gainXp(9999); break; case 'rep': S.rep += 25; break;
      case 'upgrades': UPGRADES.forEach(function (u) { S.upgrades[u.id] = true; }); S.light = LIGHTS[LIGHTS.length - 1].id; S.tent = TENTS.length - 1; if (!propInst.lobbyCoffee || !propInst.lobbyCoffee.g.children.length) buildProp('lobbyCoffee'); break;
      case 'licences': if (!S.lic) S.lic = {}; LICENCES.forEach(function (L) { S.lic[L.id] = true; }); break;
      case 'clear': S.noCustomersUntil = 0; S.courierBanUntil = 0; clearHeist(); if (fight) endFight('guard'); if (S.courier) S.courier = null; break;
      case 'empty': S.hotbar = [null, null, null, null, null, null]; break; case 'humid': S.rh.grow = 80; S.rh.dry = 80; break;
      case 'tp_lobby': tp(0, 6.5); return; case 'tp_office': tp(-8, 1); return; case 'tp_grow': tp(-3, -4); return; case 'tp_annex': tp(4, -10.5); return; case 'tp_yard': tp(4.5, -15); return; case 'tp_security': tp(10, -10); return;
    }
    world.dirty = true; rebuildDynamic(); syncRack(); syncDust(); syncMachines(); hud(); save(); applyShopState(); updateDayNight(); sfx('rare'); toast('🛠 ' + (DEV.filter(function (d) { return d[0] === id; })[0] || [id, id])[1], 'good');
  }
  $('g3-menu-body').addEventListener('click', function (e) { var ia = e.target.closest('[data-act]'); if (ia) { var act = ia.getAttribute('data-act'); if (act === 'introSkip') introSkip(); else if (act === 'introRestart') introRestart(); else return; $('g3-menu-body').innerHTML = introMenuHtml(); return; } var b = e.target.closest('[data-dev]'); if (!b) return; devAction(b.getAttribute('data-dev')); });   /* the pause menu carries its own actions as well as the dev buttons */
  function settingsHtml() {
    return '<h4>Settings</h4><div id="g3-settings">' +
      slider('Field of view', 'fov', 60, 110, 1, SET.fov, '°') +
      slider('Mouse sensitivity', 'sens', 0.3, 2.5, 0.1, SET.sens, '×') +
      check('Invert mouse Y', 'invertY', SET.invertY) +
      check('Head bob', 'headBob', SET.headBob) +
      check('Sound effects', 'sound', SET.sound) +
      check('Show FPS', 'fps', SET.fps) +
      select('Graphics quality', 'quality', [['high', 'High (shadows, full res)'], ['medium', 'Medium (soft shadows off)'], ['low', 'Low (no shadows, half res)']], SET.quality) +
      select('Time of day', 'dayNight', [['cycle', 'Day/night cycle'], ['clock', 'Follow the real clock'], ['day', 'Always day'], ['evening', 'Golden hour'], ['night', 'Always night']], SET.dayNight) +
      select('Day length', 'dayLength', [['10', '10 real minutes'], ['20', '20 real minutes'], ['40', '40 real minutes'], ['60', '1 real hour']], SET.dayLength) +
//#if desk
      '</div><p style="margin-top:8px">Settings also live on the desk tab, and apply live.</p>';
//#else
      '</div><p style="margin-top:8px">Settings apply live and are remembered.</p>';
//#endif
  }
  function slider(label, key, min, max, step, val, unit) { return '<div class="g3-slider"><label>' + label + '</label><input type="range" data-set="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><small>' + val + unit + '</small></div>'; }
  function check(label, key, val) { return '<div class="g3-slider"><label>' + label + '</label><input type="checkbox" data-set="' + key + '"' + (val ? ' checked' : '') + '></div>'; }
  function select(label, key, opts, val) { return '<div class="g3-slider"><label>' + label + '</label><select data-set="' + key + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === val ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>'; }
  function panelInput(e) { var el = e.target; if (runHooks(hooks.panelInput, el)) return; if (el.getAttribute('data-ctl') === 'volume') { shop().volume = parseFloat(el.value); var sm = el.parentNode.querySelector('small'); if (sm) sm.textContent = Math.round(shop().volume * 100) + '%'; save(); } if (el.getAttribute('data-ctl') === 'markup') { shop().markup = parseFloat(el.value); var sm2 = el.parentNode.querySelector('small'); if (sm2) sm2.textContent = Math.round(shop().markup * 100) + '%'; save(); } }
  $('g3-panel-body').addEventListener('input', panelInput);
  function settingsInput(e) {
    var el = e.target; var key = el.getAttribute('data-set'); if (!key) return;
    var v = el.type === 'checkbox' ? el.checked : el.type === 'range' ? parseFloat(el.value) : el.value;
    SET[key] = v; saveSettings(); applySettings();
    var sm = el.parentNode.querySelector('small'); if (sm) sm.textContent = v + (key === 'fov' ? '°' : '×');
  }
  $('g3-menu-body').addEventListener('input', settingsInput);
  function guideHtml() {
//#if desk
    if (window.RF_GUIDE) return window.RF_GUIDE.map(function (c) { return '<h4>' + c.icon + ' ' + c.title + '</h4>' + c.html; }).join('');   /* the shared 13-chapter guide, same text as the main menu */
//#else
    if (window.RF_GUIDE) return window.RF_GUIDE.map(function (c) { return '<h4>' + c.icon + ' ' + c.title + '</h4>' + c.html; }).join('');   /* standalone: the full guide, same text as the main menu */
//#endif
    return '<h4>Your hands do the work</h4><p>Everything is carried. <b>E</b> picks a thing up, or uses what you\'re holding on what you look at. <b>G</b> puts it back. One thing at a time.</p>' +
      '<h4>The loop</h4><p>The <b>office PC</b> in the office: order soil and baggies under Supplies, a seed in the Seed bank, and a grinder. Orders land on the <b>supply rack</b> next to it, or as crates in the back room. Take a bag of soil to the <b>tent</b>, fill a pot, fetch a seed and plant it. Grab the <b>watering can</b> by the tent when a plant says it\'s thirsty, feed it <b>nutrients</b> once for quality, and <b>spray</b> pests or mould fast.</p>' +
      '<h4>Harvest</h4><p>A plant that\'s ready glows. Harvest it with empty hands, carry the bunch to the <b>drying line</b> in the dry room and hang it. Dry batches go to the <b>curing shelf</b> in jars and keep gaining quality. Take a jar to the <b>workbench</b>, empty it into your stash, then bag, roll or bake there. Finished goods go on the <b>goods shelf</b>.</p>' +
      '<h4>Money</h4><p>Customers come to <b>the window</b>. Take what they want off the goods shelf and hand it over. They pay when the order is complete, and you take the money at the <b>till</b>. Connoisseurs (🎩) pay 2.2× for quality 70+. Goods rung up at the till as a walk-up sale fetch 85% of the board price, 12 a day.</p>' +
      '<h4>Edit mode</h4><p>Press <b>F2</b> (or Edit layout in this menu) to rearrange the place: look at any piece of furniture, <b>E</b> grabs it, carry it to a spot, <b>R</b> turns it, <b>E</b> drops it, <b>Backspace</b> puts it back where it came from. Your layout is saved.</p>' +
      '<h4>Upstairs</h4><p>The stairs in the office lead to your <b>flat</b>: a kitchen (fridge snacks, eat at the table), a couch and a <b>big TV</b> (E cycles: shop dashboard, grow cam, house news), and a bed. Eating gives you a speed boost for 10 min.</p>' +
      '<h4>The shop</h4><p>The <b>control box</b> in the security room opens or closes the shop, runs the lights and picks a radio station. The <b>front panel</b> behind the till and the <b>office panel</b> do part of the same job where you stand. <b>Curtains</b> on every window and the door open with E. The <b>staff door</b> opens with E and shuts itself 4 s after people are through. Dust settles on the floors, and the <b>broom</b> hangs in the processing room.</p>' +
      '<h4>Keys</h4><p><b>WASD</b> move · <b>Shift</b> run · <b>Space</b> jump · <b>Ctrl</b> crouch · <b>E</b> or click: pick up, use, talk · <b>Shift+E</b> the second action · <b>Ctrl+E</b> sends a crew member home · <b>G</b> put back · <b>I</b> inventory · <b>Tab</b> quick wheel · <b>F</b> phone · <b>Esc</b> pause</p>';
  }
  var appliedQuality = null;   /* the quality the materials were last compiled for */
  function applySettings() {
    camera.fov = SET.fov; camera.updateProjectionMatrix();
    var q = SET.quality; renderer.shadowMap.enabled = q !== 'low'; renderer.shadowMap.type = q === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    var ms = q === 'high' ? 2048 : 1024; if (sun.shadow.mapSize.x !== ms) { sun.shadow.mapSize.set(ms, ms); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    renderer.shadowMap.needsUpdate = true; lightBudget.point = q === 'high' ? 12 : q === 'medium' ? 8 : 5;
    renderer.setPixelRatio(q === 'low' ? Math.min(window.devicePixelRatio, 1) * 0.66 : q === 'medium' ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 2));
    if (q !== appliedQuality) { appliedQuality = q; scene.traverse(function (o) { if (o.material) o.material.needsUpdate = true; }); }   /* recompiling every shader is only needed when the shadow type changes with quality, never for FOV, sensitivity or HUD scale */
    $('h-fps').hidden = !SET.fps;
    document.documentElement.style.fontSize = (SET.hudScale || 1) * 100 + '%';
  }
  window.addEventListener('storage', function (e) { if (e.key === SETTINGS_KEY) { loadSettings(); applySettings(); } });

  // HUD
  var lastHudKey = '';
  function hud() {
    syncTotals();
    var need = XP_PER_LEVEL(S.level);
    $('h-cash').textContent = money(S.bank); var hv = $('h-vault'); if (hv) { var heavy = tillHeavy(); hv.textContent = money(S.vault) + (S.pocket > 0 ? ' · 👛' + money(S.pocket) : '') + (heavy ? ' · 🧾' + money((S.till || 0) + (S.tips || 0)) : ''); if (hv.parentNode && hv.parentNode.classList) hv.parentNode.classList.toggle('heavy', heavy); }   /* a till worth robbing shows up here, amber */
    $('h-cured').textContent = gram(S.cured.g) + (S.cured.g > 0 ? ' q' + Math.round(curedAvgQ()) : '');
    $('h-pkg').textContent = S.pkg.bags.n + ' / ' + S.pkg.joints.n + (S.pkg.cookies.n ? ' / 🍪' + S.pkg.cookies.n : '');
    $('h-rep').textContent = Math.floor(S.rep);
    $('h-market').textContent = S.market.toFixed(2) + '×';
    $('h-lvl').textContent = 'Level ' + S.level; $('h-xp').textContent = S.xp + ' / ' + need + ' xp'; $('h-xpbar').style.width = Math.round(S.xp / need * 100) + '%';
    var ev = $('h-event'); if (S.event) { ev.hidden = false; ev.textContent = '🎪 ' + S.event.label + ' · ' + Math.max(0, Math.round((S.event.until - now()) / 1000)) + ' s'; } else if (!shop().open) { ev.hidden = false; ev.textContent = '🔴 Shop closed · no customers'; } else ev.hidden = true;
    drawRegister();
    var hl = $('h-held'); if (held()) { hl.hidden = false; hl.innerHTML = '<span class="k">slot ' + (S.slot + 1) + '</span>' + heldLabel() + '<small>' + (useHint(held()) ? useHint(held()) + ' · ' : '') + 'G puts it back · 1 to 6 or the wheel switch</small>'; } else hl.hidden = true;
    $('h-clock').textContent = clockText();
    $('h-day').textContent = 'Day ' + (SET.dayNight === 'cycle' ? (S.day || 1) : (Math.floor((now() - (S.created || now())) / 86400000) + 1));
    // order ticket
    var ot = $('h-order'); if (ot) { if (S.customer && (S.customer.arrived || S.customer.stage)) { var oh = orderTicketHtml(S.customer); ot.hidden = false; if (ot.innerHTML !== oh) ot.innerHTML = oh; } else ot.hidden = true; }
    // objective
    var obj = objective(); var o = $('h-objective'); if (o.innerHTML !== obj) o.innerHTML = obj;
    // hotbar
    var key = S.slot + '|' + S.hotbar.map(function (it) { return it ? it.kind + (it.n || '') + (it.strain || '') + (it.item || '') + (it.grams || '') : '-'; }).join('|');
    if (key !== lastHudKey) { lastHudKey = key; $('h-hotbar').innerHTML = S.hotbar.map(function (it, i) { return '<div class="' + (i === S.slot ? 'active' : '') + (it ? '' : ' zero') + '" title="slot ' + (i + 1) + '">' + slotIcon(it) + '<small>' + slotLabel(it) + '</small><span class="n">' + (i + 1) + '</span></div>'; }).join(''); }
    if (drive.on) drawDash();
  }
  function objective() {
    if (drive.on) { var jn = xs().jobs.length; return '<b>At the wheel</b>' + (jn ? '🚚 ' + jn + ' drop' + (jn === 1 ? '' : 's') + ' waiting: <b class="kk">J</b> the board, <b class="kk">M</b> the map.<br>' : '') + 'Mouse looks around · wheel zooms · <b class="kk">I</b> ignition · <b class="kk">P</b> handbrake · <b class="kk">L</b> lights · <b class="kk">W</b> and <b class="kk">S</b> drive · <b class="kk">A</b> and <b class="kk">D</b> steer · <b class="kk">Space</b> brake · <b class="kk">T</b> boot · <b class="kk">B</b> bonnet · <b class="kk">C</b> centre · <b class="kk">E</b> get out'; }
    if (introRunning()) return '';   /* the intro card is the guidance while it runs: two boxes competing is noise */
    var t = '<b>Next up' + (lineShown() ? ' · 👥 ' + lineShown() + ' in line' : '') + '</b>'; var h = held();
    if (h && h.kind === 'tablet') return t + '📋 The delivery round is in your hands. <b class="kk">E</b> or <b class="kk">J</b> opens it, and it slots into the dash cradle once you\'re at the wheel.';
    if (h && h.kind === 'broom') return t + '🧹 ' + dustList().length + ' dusty spot' + (dustList().length === 1 ? '' : 's') + ' left. E on the dust sweeps it.';
    if (!S.customer && !h && dustList().length >= 8) return t + '🧹 The floors are dusty. Grab the broom in the processing room.';
    if (h && h.kind === 'harvest') return t + '🌬️ Hang the fresh harvest on the drying line in the dry room.';
    if (h && h.kind === 'jar') return t + '🏺 Carry the jar to the workbench in the processing room and empty it into the stash.';
    if (S.customer && !S.customer.arrived) return t + '🚪 ' + S.customer.who + (S.customer.fromLine ? ' is next in line and stepping up.' : ' just walked in' + (guardOnDuty() ? ' and the guard is checking their ID.' : '.')) + ' Head to the window.';
    var hh = heistHint(); if (hh) return t + hh;
    if (fight) return t + '👊 ' + fight.a.who + ' and ' + fight.b.who + ' are fighting in the lobby. Press E on one of them to break it up.';
    if (S.customer && S.customer.stage) return t + '💵 ' + S.customer.who + ' is paying by ' + S.customer.pay + '. Take it at the till.';
    if (S.courier && S.courier.state === 'waiting') return t + '🏦 The bank courier is waiting in the back room for ' + money(S.courier.amount) + (S.pocket >= S.courier.amount ? '. Hand it over.' : '. Get it from the vault first.');
    if (h && h.kind === 'crate') return t + '📦 Carry the ' + itemName(h.item) + ' to ' + (h.item.indexOf('seed_') === 0 || (supplyById(h.item) && !supplyById(h.item).stock) ? 'the supply rack in the office.' : supplyById(h.item).stock === 'vend' ? 'the vending machine in the lobby.' : supplyById(h.item).stock === 'display' ? 'the counter display by the till.' : 'the coffee machine in the lobby.');
    if (S.pocket >= 200) return t + '👛 ' + money(S.pocket) + ' in your pocket. Put it in the office vault.';
    if (S.customer && !S.customer.arrived && !S.customer.stage) return t + '🪪 ' + S.customer.who + ' just walked in' + (guardOnDuty() ? ' and the guard is checking their ID.' : '.') + ' Head to the window.';
    if (S.customer) { var c = S.customer; var gv = c.given ? c.given.n : 0; if (h && h.kind === c.want) return t + '🤝 Hand the ' + kindName(c.want, c.qty) + ' to ' + c.who + ' (' + gv + ' of ' + c.qty + ' handed over).'; return t + '🚪 ' + c.who + ' is at the window and wants ' + wantText(c) + (lotCount(c.want, c.strain) + gv >= c.qty ? '. Take them off the goods shelf and bring them over.' : c.strain && S.pkg[c.want].n + gv >= c.qty ? '. No ' + strainById(c.strain).name + ' is packed, but another strain sells at 15% off.' : '. Pack more at the workbench first.'); }
    if (h && (h.kind === 'joints' || h.kind === 'bags')) return t + '💵 Hand those to a customer at the window, or ring them up at the till as a walk-up (85%).';
    var XJ = xs();   /* deliveries sit below anything happening in the shop: a customer at the window beats a drop across town */
    if (hasLic('tobacco') && XJ.tablet === 'dock' && !XJ.seenTablet) return t + '📋 The delivery tablet on the office dock is live now. Take it, and <b class="kk">J</b> brings up the RF Smoking round.';
    if (XJ.jobs.length) { var soon = XJ.jobs.filter(function (j) { return j.until - now() < 120000; }).length; return t + '🚚 ' + XJ.jobs.length + ' drop' + (XJ.jobs.length === 1 ? '' : 's') + ' waiting' + (soon ? ', ' + soon + ' close to running out' : '') + '. <b class="kk">J</b> for the board, <b class="kk">M</b> for the map.'; }
    var ready = S.plants.filter(function (p) { return p.progress >= 1; }).length; if (ready) return t + '✂️ ' + ready + ' plant' + (ready > 1 ? 's are' : ' is') + ' ready. Empty your hands and press E on the plant.';
    var haz = S.plants.filter(function (p) { return p.hazard; }).length; if (haz) return t + '⚠ ' + haz + ' plant' + (haz > 1 ? 's have' : ' has') + ' a problem. ' + (h && h.kind === 'remedy' ? 'Spray it.' : (S.supplies.remedy || 0) ? 'Grab pest spray from the supply rack.' : 'Buy pest spray at the office PC.');
    var thirsty = !S.upgrades.autowater && S.plants.filter(function (p) { return p.thirst > 0.6; }).length; if (thirsty) return t + '💧 ' + thirsty + ' plant' + (thirsty > 1 ? 's are' : ' is') + ' thirsty. ' + (h && h.kind === 'can' ? 'E on each plant waters it.' : 'Grab the watering can from the hose reel in the grow room.');
    var cured = S.batches.filter(function (b) { return b.cured; }).length; if (cured && S.cured.g < 3.5) return t + '🏺 ' + cured + ' jar' + (cured > 1 ? 's are' : ' is') + ' on the curing shelf. Take one to the workbench when you want to pack.';
    if (S.cured.g >= 3.5 && !S.supplies.grinder) return t + '⚙️ You\'ve got bud but no grinder. Buy one at the office PC.';
    if (S.cured.g >= 3.5 && S.supplies.grinder && ((S.supplies.bag || 0) || ((S.supplies.paper || 0) && (S.supplies.tip || 0)) || S.upgrades.roller)) return t + '✂️ Bag or roll your stash at the workbench.';
    if (S.cured.g >= 3.5 && S.supplies.grinder) return t + '🛍️ Buy baggies, or papers and tips, at the office PC to pack it.';
    if (S.pkg.bags.n + S.pkg.joints.n > 0) return t + '💵 ' + (S.pkg.bags.n + S.pkg.joints.n) + ' bags and joints on the goods shelf. Wait for a customer at the window, or ring some up at the till as walk-ups.';
    var anySeed = STRAINS.some(function (s) { return (S.supplies['seed_' + s.id] || 0) > 0; });
    if (h && h.kind === 'soil') return t + '🪴 Fill an empty pot in the tent with the soil.';
    if (h && h.kind === 'seed') return t + '🌱 Plant the seed in a pot that has soil.';
    var freePots = (S.supplies.pot || 0) - S.plants.length;
    if (!S.plants.length || (S.plants.length < slots() && freePots > 0 && (S.supplies.soil || 0) > 0 && anySeed)) {
      if (!anySeed || !(S.supplies.soil || 0)) return t + '🛒 Order soil and a seed at the office laptop. They land on the supply rack next to it.';
      if (freePots < 1) return t + '🫙 Buy a pot at the office PC.';
      return t + '🌱 Take soil from the supply rack, fill a pot, then bring a seed and plant it.';
    }
    var growing = S.plants.length; return t + '🌿 ' + growing + ' plant' + (growing > 1 ? 's' : '') + ' growing. ' + (S.plants.some(function (p) { return !p.fed; }) && (S.supplies.nutrients || 0) ? 'Bring nutrients from the supply rack for quality.' : 'Relax, or stock up at the office PC.');
  }

