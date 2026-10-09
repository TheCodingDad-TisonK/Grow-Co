//@ DLC upgrades: every DLC has three upgrades of its own, bought in the Upgrades app on the office PC
  // ── DLC upgrades ──
  // An upgrade belongs to one DLC and is kept in S.dlcUpg[dlc][id]. It counts only while its DLC is switched on, so switching
  // a DLC off puts its numbers back and switching it on again brings the upgrades back with it.
  // Most upgrades change one number. upgProp() turns that number into a getter, so every place that reads it (the rule, the
  // prompt, the sign on the machine) sees the upgraded figure without being told.
  var DLC_UPG = {}, DLC_UPG_ORDER = [];
  function dlcUpgDefine(dlc, ico, list) { DLC_UPG[dlc] = { ico: ico, list: list }; DLC_UPG_ORDER.push(dlc); }
  function dlcUpgState() { if (!S.dlcUpg || typeof S.dlcUpg !== 'object' || Array.isArray(S.dlcUpg)) S.dlcUpg = {}; return S.dlcUpg; }
  function dlcOwns(dlc, id) { var u = dlcUpgState()[dlc]; return !!(u && u[id]); }
  function dlcHas(dlc, id) { return dlcOwns(dlc, id) && dlcOn(dlc); }
  function dlcUpgFind(dlc, id) { var G = DLC_UPG[dlc]; return G ? G.list.filter(function (u) { return u.id === id; })[0] : null; }
  function dlcUpgGive(dlc, id) { var st = dlcUpgState(); if (!st[dlc] || typeof st[dlc] !== 'object') st[dlc] = {}; st[dlc][id] = true; var u = dlcUpgFind(dlc, id); if (u && u.after) { try { u.after(); } catch (e) { console.error('[dlc upgrade ' + dlc + ':' + id + ']', e); } } }
  function dlcUpgBuy(dlc, id) {
    var u = dlcUpgFind(dlc, id); if (!u || dlcOwns(dlc, id)) return false; if (!dlcOn(dlc)) { dlcOff(dlc); return false; }
    if ((S.level || 1) < (u.lvl || 1)) { sfx('bad'); toast(u.name + ' needs level ' + u.lvl, 'bad'); return false; }
    if (!payBank(u.price, u.name)) return false;
    dlcUpgGive(dlc, id); gainXp(15); toast(u.ico + ' ' + u.name + ' is in', 'good'); logEvent(u.ico + ' Bought ' + u.name + ' for ' + money(u.price), 'good'); hud(); save(); return true;
  }
  function upgProp(obj, key, fn) { var base = obj[key]; Object.defineProperty(obj, key, { get: function () { return fn(base); }, set: function (v) { base = v; }, configurable: true, enumerable: true }); }

  dlcUpgDefine('tobacco', '🚬', [
    { id: 'kiln', ico: '🔥', name: 'Forced-air kiln', price: 1800, lvl: 3, d: 'A load cures in 40 s, down from 60.' },
    { id: 'maker', ico: '⚙️', name: 'High-speed maker', price: 2400, lvl: 5, d: 'Rolls 10 sticks a second, up from 6, and the packer closes a pack in 0.8 s.' },
    { id: 'humidor', ico: '🗄️', name: 'Cedar humidor', price: 1500, lvl: 4, d: 'Cigars age in half the time and the humidor holds 80, up from 40.' }]);
  dlcUpgDefine('lab', '🧪', [
    { id: 'column', ico: '🧯', name: 'Second column', price: 2200, lvl: 4, d: 'Every batch takes a third less time.' },
    { id: 'still', ico: '⚗️', name: 'Short-path still', price: 1800, lvl: 5, d: 'Every batch makes a quarter more.' },
    { id: 'bench', ico: '🔬', name: 'Test bench', price: 1200, lvl: 3, d: 'Every batch comes out 10 points of quality higher.' }]);
  dlcUpgDefine('greenhouse', '🌿', [
    { id: 'barrels', ico: '🛢️', name: 'Rain barrels and drip lines', price: 900, lvl: 2, d: 'Barrels fill when it rains and water the beds. Watered beds grow half as fast again.', after: function () { roofExtrasSync(); } },
    { id: 'hives', ico: '🐝', name: 'Two beehives', price: 1400, lvl: 3, d: 'A bed gives 30 g instead of 25, and the hives make a jar of honey a day outside winter.', after: function () { roofExtrasSync(); } },
    { id: 'vents', ico: '🪟', name: 'Shade cloth and vents', price: 1100, lvl: 4, d: 'What you cut on the roof is 12 points of quality better.' }]);
  dlcUpgDefine('breeding', '🧬', [
    { id: 'culture', ico: '🧫', name: 'Tissue culture', price: 1200, lvl: 4, d: 'A cross takes 5 minutes, down from 8.' },
    { id: 'tumbler', ico: '🌰', name: 'Seed tumbler', price: 800, lvl: 3, d: 'A cross gives 10 seeds, up from 6.' },
    { id: 'library', ico: '📚', name: 'Genetic library', price: 1500, lvl: 5, d: 'Room for 20 cultivars of your own, and twice the chance of a plant that stands out.' }]);
  dlcUpgDefine('hydrobay', '💧', [
    { id: 'doser', ico: '🎚️', name: 'Auto doser', price: 1600, lvl: 4, d: 'The pH holds itself at 6.0.' },
    { id: 'tank', ico: '🛢️', name: 'Bigger tank', price: 900, lvl: 3, d: 'The feed lasts twice as long.' },
    { id: 'chiller', ico: '❄️', name: 'Root chiller', price: 1400, lvl: 5, d: 'Quality on the rack climbs to 100, up from 90.' }]);
  dlcUpgDefine('cup', '🏆', [
    { id: 'jar', ico: '🫙', name: 'Presentation jar', price: 600, lvl: 2, d: 'Your entry scores 4 points more with the judges.' },
    { id: 'sponsor', ico: '🤝', name: 'A sponsor', price: 1500, lvl: 5, d: 'Prize money is half as much again.' },
    { id: 'press', ico: '📰', name: 'Press coverage', price: 900, lvl: 3, d: 'The rep you win at the Cup is doubled.' }]);
  dlcUpgDefine('merch', '👕', [
    { id: 'hoodie', ico: '🧥', name: 'Hoodies', price: 700, lvl: 3, d: 'A new line on the stand, and the dearest: costs $16, sells for $42.', after: function () { if (propInst.merchStand) growBuildProp('merchStand'); } },
    { id: 'express', ico: '⚡', name: 'Express printing', price: 500, lvl: 2, d: 'A box arrives in 30 s, down from 90.' },
    { id: 'racks', ico: '🗄️', name: 'Bigger stand', price: 650, lvl: 3, d: 'The stand holds 80 of each, up from 40.' }]);
  dlcUpgDefine('farm', '🚜', [
    { id: 'drip', ico: '💧', name: 'Drip irrigation', price: 1800, lvl: 4, d: 'The rows water themselves from the tank by the gate.' },
    { id: 'tunnels', ico: '⛺', name: 'Polytunnels', price: 2600, lvl: 6, d: 'Frost takes nothing, and rows keep growing through the winter.', after: function () { if (typeof farmSync === 'function') farmSync(); } },
    { id: 'fans', ico: '🌬️', name: 'Barn fans', price: 1200, lvl: 3, d: 'The crop dries in half the time.' }]);
  dlcUpgDefine('finance', '💰', [
    { id: 'premium', ico: '💎', name: 'Premium account', price: 2000, lvl: 5, d: 'Savings earn 0.8% a day, up to $1,000 a day.' },
    { id: 'standing', ico: '📄', name: 'Good standing', price: 1000, lvl: 3, d: 'A loan costs 8%, down from 12%.' },
    { id: 'full', ico: '🛡️', name: 'Full cover', price: 1500, lvl: 4, d: 'Robbery cover pays back everything that was taken.' }]);

  upgProp(TOB, 'kilnT', function (b) { return dlcHas('tobacco', 'kiln') ? 40 : b; });
  upgProp(TOB, 'sticksS', function (b) { return dlcHas('tobacco', 'maker') ? 10 : b; });
  upgProp(TOB, 'packS', function (b) { return dlcHas('tobacco', 'maker') ? 0.8 : b; });
  upgProp(BREED, 'ms', function (b) { return dlcHas('breeding', 'culture') ? 300000 : b; });
  upgProp(BREED, 'seeds', function (b) { return dlcHas('breeding', 'tumbler') ? 10 : b; });
  upgProp(BREED, 'max', function (b) { return dlcHas('breeding', 'library') ? 20 : b; });
  upgProp(HYDRO, 'phDrift', function (b) { return dlcHas('hydrobay', 'doser') ? 0 : b; });
  upgProp(HYDRO, 'feedUse', function (b) { return dlcHas('hydrobay', 'tank') ? b / 2 : b; });
  upgProp(MERCH, 'wait', function (b) { return dlcHas('merch', 'express') ? 30 : b; });
  upgProp(FARM, 'dryS', function (b) { return dlcHas('farm', 'fans') ? b / 2 : b; });
  upgProp(FIN, 'rate', function (b) { return dlcHas('finance', 'premium') ? 0.008 : b; });
  upgProp(FIN, 'cap', function (b) { return dlcHas('finance', 'premium') ? 1000 : b; });
  upgProp(FIN, 'interest', function (b) { return dlcHas('finance', 'standing') ? 0.08 : b; });

  function paneDlcUpg() {
    var h = '', any = false;
    DLC_UPG_ORDER.forEach(function (dlc) {
      if (!dlcOn(dlc)) return; any = true;
      var G = DLC_UPG[dlc], own = G.list.filter(function (u) { return dlcOwns(dlc, u.id); }).length;
      h += '<div class="g3-box"><h3>' + G.ico + ' ' + esc(DLC_NAME[dlc] || dlc) + ' · ' + own + ' of ' + G.list.length + '</h3>';
      G.list.forEach(function (u) {
        var has = dlcOwns(dlc, u.id), lv = (S.level || 1) >= (u.lvl || 1), ok = !has && lv && S.bank >= u.price;
        h += '<div class="g3-row"><span class="ico">' + u.ico + '</span><span class="meta"><span class="n">' + u.name + (has ? '' : ' · ' + money(u.price)) + '</span><span class="own">' + u.d + (has || lv ? '' : ' From level ' + u.lvl + '.') + '</span></span><button class="g3-btn' + (has ? ' primary' : '') + '" data-act="dlcUpgBuy" data-id="' + dlc + ':' + u.id + '"' + (ok ? '' : ' disabled') + '>' + (has ? 'Fitted' : 'Buy') + '</button></div>';
      });
      h += '</div>';
    });
    if (!any) return '<div class="g3-grid"><div class="g3-box"><h3>⬆️ Upgrades</h3><div class="g3-empty">Every DLC has three upgrades of its own, and no DLC is switched on. Switch one on under Workshop and DLC in the main menu.</div></div></div>';
    return '<div class="desc" style="margin:0 0 12px">Three upgrades for every DLC you have switched on. They are paid from the bank and last for good. The bank holds ' + money(S.bank) + '.</div><div class="g3-grid">' + h + '</div>';
  }
  hooks.panel.dlcupg = function () { return { title: '⬆️ DLC upgrades', body: paneDlcUpg() }; };
  hooks.panelClick.push(function (act, b) { if (act !== 'dlcUpgBuy') return false; var id = String(b.getAttribute('data-id') || '').split(':'); dlcUpgBuy(id[0], id[1]); return true; });
