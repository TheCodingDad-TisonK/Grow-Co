//@ DLC: Bank & Insurance. A savings account that pays interest, a business loan with daily repayments, and cover that pays out after a bad night
  // ── DLC: Bank & Insurance ──
  var FIN = { rate: 0.005, cap: 500, loans: [{ id: 'small', name: 'Starter loan', sum: 2000, lvl: 1 }, { id: 'mid', name: 'Business loan', sum: 6000, lvl: 4 }, { id: 'big', name: 'Expansion loan', sum: 15000, lvl: 8 }], days: 10, interest: 0.12,
    cover: [{ id: 'robbery', ico: '🦹', name: 'Robbery cover', day: 35, d: 'Pays back 75% of whatever robbers got away with, the morning after.' }, { id: 'power', ico: '⚡', name: 'Power cover', day: 12, d: 'Pays $150 for every power cut, for the stock that spoils and the trade you lose.' }, { id: 'stock', ico: '🌙', name: 'Break-in cover', day: 18, d: 'Pays $400 after a night break-in.' }] };
  function finState() { var F = dlcState('finance', { savings: 0, earned: 0, loan: null, cover: {}, claims: [], seen: null }); if (!F.seen) F.seen = { robbed: S.stats.robbed || 0, breakins: S.stats.breakins || 0, cuts: 0 }; return F; }
  function finLog(F, text, sum) { F.claims.unshift({ day: S.day || 1, text: text, sum: sum }); F.claims.length = Math.min(F.claims.length, 10); }
  function finMove(n, into) {
    var F = finState(); n = Math.floor(n); if (into) { n = Math.min(n, Math.floor(S.bank)); if (n <= 0) { toast('Nothing in the bank to move', 'bad'); return; } S.bank -= n; F.savings += n; toast('🏦 Moved ' + money(n) + ' into savings', 'good'); }
    else { n = Math.min(n, Math.floor(F.savings)); if (n <= 0) { toast('The savings account is empty', 'bad'); return; } F.savings -= n; S.bank += n; toast('🏦 Moved ' + money(n) + ' back to the bank', 'good'); } sfx('cash');
  }
  function finBorrow(id) {
    var F = finState(), L = FIN.loans.filter(function (l) { return l.id === id; })[0]; if (!L || F.loan) return; if ((S.level || 1) < L.lvl) { toast('The bank wants to see level ' + L.lvl + ' first', 'bad'); return; }
    var owe = Math.round(L.sum * (1 + FIN.interest)); F.loan = { name: L.name, sum: L.sum, left: owe, daily: Math.ceil(owe / FIN.days), missed: 0 }; S.bank += L.sum; sfx('cash');
    toast('🏦 ' + money(L.sum) + ' is in the bank. ' + money(F.loan.daily) + ' goes back every morning for ' + FIN.days + ' days.', 'good'); logEvent('🏦 Took a ' + L.name.toLowerCase() + ' of ' + money(L.sum), '');
  }
  function finSettle() { var F = finState(), L = F.loan; if (!L) return; var n = Math.round(L.left * 0.95); if (!payBank(n, 'Settling the loan')) return; F.loan = null; S.rep += 1; toast('🏦 The loan is paid off (rep +1)', 'good'); logEvent('🏦 Settled the loan early for ' + money(n), 'good'); }
  function paneFinance() {
    var F = finState(), h = '<div class="g3-grid"><div class="g3-box"><h3>💰 Savings · ' + money(F.savings) + '</h3><div class="desc">Money you don\'t need this week earns ' + (FIN.rate * 100).toFixed(1) + '% a day here, up to ' + money(FIN.cap) + ' a day. Robbers can\'t reach it and the morning bills don\'t draw on it. Interest so far: ' + money(F.earned) + '.</div>';
    h += '<div class="desc">Pay in from the bank (' + money(S.bank) + ')</div><div class="g3-chips">' + [100, 500, 1000, 5000].map(function (n) { return '<button class="g3-btn" data-act="finIn" data-id="' + n + '"' + (S.bank >= n ? '' : ' disabled') + '>' + money(n) + '</button>'; }).join('') + '<button class="g3-btn" data-act="finIn" data-id="all"' + (S.bank >= 1 ? '' : ' disabled') + '>all of it</button></div>';
    h += '<div class="desc">Take out</div><div class="g3-chips">' + [100, 500, 1000, 5000].map(function (n) { return '<button class="g3-btn" data-act="finOut" data-id="' + n + '"' + (F.savings >= n ? '' : ' disabled') + '>' + money(n) + '</button>'; }).join('') + '<button class="g3-btn" data-act="finOut" data-id="all"' + (F.savings >= 1 ? '' : ' disabled') + '>all of it</button></div>';
    h += '<h3 style="margin-top:16px">🏦 Borrowing</h3>';
    if (F.loan) h += '<div class="g3-customer premium"><span class="avatar">📄</span><div><span class="who">' + F.loan.name + ' · ' + money(F.loan.left) + ' to pay</span><span class="req">' + money(F.loan.daily) + ' every morning' + (F.loan.missed ? ' · ' + F.loan.missed + ' payment' + (F.loan.missed === 1 ? '' : 's') + ' missed' : '') + '</span></div></div>' + barHtml(1 - F.loan.left / (F.loan.sum * (1 + FIN.interest)), 'q') + '<button class="g3-btn wide" data-act="finSettle">Pay it off now · ' + money(Math.round(F.loan.left * 0.95)) + '</button>';
    else { h += '<div class="desc">One loan at a time. It costs ' + Math.round(FIN.interest * 100) + '% and goes back in ' + FIN.days + ' daily payments. A morning you can\'t pay costs you rep and adds to the debt.</div>'; FIN.loans.forEach(function (L) { var ok = (S.level || 1) >= L.lvl; h += '<div class="g3-row"><span class="ico">💵</span><span class="meta"><span class="n">' + L.name + ' · ' + money(L.sum) + '</span><span class="own">' + (ok ? money(Math.ceil(L.sum * (1 + FIN.interest) / FIN.days)) + ' a day for ' + FIN.days + ' days' : 'from level ' + L.lvl) + '</span></span><button class="g3-btn" data-act="finBorrow" data-id="' + L.id + '"' + (ok ? '' : ' disabled') + '>Borrow</button></div>'; }); }
    h += '</div><div class="g3-box"><h3>🛡️ Insurance</h3><div class="desc">The premium goes out with the morning bills. A claim is paid into the bank the morning after.</div>';
    FIN.cover.forEach(function (c) { var on = !!F.cover[c.id]; h += '<div class="g3-row"><span class="ico">' + c.ico + '</span><span class="meta"><span class="n">' + c.name + ' · ' + money(c.day) + ' a day</span><span class="own">' + c.d + '</span></span><button class="g3-btn' + (on ? ' primary' : '') + '" data-act="finCover" data-id="' + c.id + '">' + (on ? 'Covered' : 'Take it out') + '</button></div>'; });
    h += '<h3 style="margin-top:16px">📬 Statements</h3>'; if (!F.claims.length) h += '<div class="g3-empty">Nothing has been paid out yet.</div>';
    F.claims.forEach(function (c) { h += '<div class="g3-row"><span class="ico">📄</span><span class="meta"><span class="n">Day ' + c.day + ' · ' + money(c.sum) + '</span><span class="own">' + esc(c.text) + '</span></span></div>'; });
    return h + '</div></div>';
  }
  hooks.panel.finance = function () { return { title: '🏦 Bank and insurance', body: paneFinance() }; };
  hooks.panelClick.push(function (act, b) {
    var id = b.getAttribute('data-id'), F;
    if (act === 'finIn' || act === 'finOut') { F = finState(); finMove(id === 'all' ? (act === 'finIn' ? S.bank : F.savings) : +id, act === 'finIn'); return true; }
    if (act === 'finBorrow') { finBorrow(id); return true; }
    if (act === 'finSettle') { finSettle(); return true; }
    if (act === 'finCover') { F = finState(); F.cover[id] = !F.cover[id]; var c = FIN.cover.filter(function (x) { return x.id === id; })[0]; if (c) toast(F.cover[id] ? c.ico + ' ' + c.name + ' starts tomorrow morning: ' + money(c.day) + ' a day' : c.ico + ' ' + c.name + ' cancelled', F.cover[id] ? 'good' : ''); return true; }
    return false;
  });
  dlcDefine({ id: 'finance', name: 'Bank & Insurance', kinds: [],
    tick: function () { var F = finState(), X = xs(); if (X.blackoutUntil && X.blackoutUntil !== F.seen.cutAt) { F.seen.cutAt = X.blackoutUntil; F.seen.cuts = (F.seen.cuts || 0) + 1; } },
    newDay: function () {
      var F = finState(), paid = 0;
      if (F.savings > 0) { var i = Math.min(FIN.cap, Math.floor(F.savings * FIN.rate)); if (i > 0) { F.savings += i; F.earned += i; logEvent('💰 Savings interest: ' + money(i), 'good'); } }
      FIN.cover.forEach(function (c) { if (F.cover[c.id]) spendOp(c.day); });
      var robbed = (S.stats.robbed || 0) - (F.seen.robbed || 0); F.seen.robbed = S.stats.robbed || 0;
      if (F.cover.robbery && robbed > 0) { var r = Math.round(robbed * 0.75); S.bank += r; paid += r; finLog(F, 'Robbery cover: 75% of the ' + money(robbed) + ' taken', r); }
      if (F.cover.power && F.seen.cuts > 0) { var p = 150 * F.seen.cuts; S.bank += p; paid += p; finLog(F, 'Power cover: ' + F.seen.cuts + ' power cut' + (F.seen.cuts === 1 ? '' : 's'), p); }
      var breaks = (S.stats.breakins || 0) - (F.seen.breakins || 0); F.seen.breakins = S.stats.breakins || 0;
      if (F.cover.stock && breaks > 0) { var b = 400 * breaks; S.bank += b; paid += b; finLog(F, 'Break-in cover: ' + breaks + ' break-in' + (breaks === 1 ? '' : 's'), b); }
      F.seen.cuts = 0;
      if (paid) { logEvent('🛡️ The insurer paid out ' + money(paid), 'good'); toast('🛡️ The insurer paid out ' + money(paid), 'good'); }
      var L = F.loan; if (L) { var due = Math.min(L.daily, L.left); if (S.bank >= due) { S.bank -= due; L.left -= due; if (L.left <= 0) { F.loan = null; S.rep += 1; logEvent('🏦 The loan is paid off (rep +1)', 'good'); toast('🏦 The loan is paid off (rep +1)', 'good'); } } else { L.missed++; L.left = Math.round(L.left * 1.05); S.rep = Math.max(0, S.rep - 3); logEvent('🏦 Missed a loan payment of ' + money(due) + ': 5% added to the debt (rep -3)', 'bad'); toast('🏦 You missed a loan payment (rep -3)', 'bad'); } }
    }
  });
