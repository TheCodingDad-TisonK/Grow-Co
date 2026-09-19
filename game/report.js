// Bug reports. F7, or "Report a bug" in the pause menu and the main menu, opens a form.
// A report is: what the player wrote, what the game knows (version, system, where they were, recent events,
// recent script errors, lifetime stats) and, if they agree, their savegame (gzip + base64).
//
// Sending: a game on someone's PC must never carry a GitHub token, so by default the report is copied to the
// clipboard, saved as a text file, and the player's browser is opened on a pre-filled GitHub issue form whose
// template applies the labels and the assignee. If window.RF_REPORT_ENDPOINT is set (see tools/report-relay),
// the report is posted there instead and the relay files the issue, no GitHub account needed.
(function () {
  'use strict';
  var REPO = 'TheCodingDad-TisonK/RF-Grow-Co';
  var errors = [];   // ring buffer of script errors, recorded from the very start of the page
  window.addEventListener('error', function (e) { errors.push(new Date().toISOString().slice(11, 19) + ' ' + (e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); if (errors.length > 12) errors.shift(); });
  window.addEventListener('unhandledrejection', function (e) { errors.push(new Date().toISOString().slice(11, 19) + ' promise: ' + String(e.reason && e.reason.message || e.reason).slice(0, 160)); if (errors.length > 12) errors.shift(); });

  var FIELDS = {
    category: ['Gameplay and balance', 'Crash, freeze or black screen', 'Graphics and visuals', 'Sound', 'Saving and loading', 'Menus, HUD and controls', 'Performance', 'Customers and selling', 'Growing, drying and the bench', 'Staff (Jo, guard, driver, operator)', 'Robberies, weapons and police', 'Basement, lab and machines', 'Town, car and map', 'Edit mode and creative mode', 'Installer or desktop app', 'Something else'],
    severity: ['Blocker: I cannot continue playing', 'Major: a feature is broken', 'Minor: annoying, but there is a way round it', 'Cosmetic: it just looks or reads wrong'],
    frequency: ['Every time', 'Often', 'Sometimes', 'It happened once'],
    where: ['Main menu', 'Shop floor and service window', 'Office', 'Grow room', 'Dry and cure room', 'Processing room', 'Lobby', 'Back room and yard', 'Security room', 'Upstairs flat', 'Connoisseur lounge', 'Roof greenhouse', 'Basement works', 'Extraction lab', 'In town, on foot', 'In town, driving', 'Bank or gun store interior', 'Not sure']
  };
  var open = false, root = null, last = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function G() { return window.RFGROW || null; }
  function guessWhere() {
    var g = G(); if (!g || !g.ui || !g.ui.started) return 'Main menu'; if (g.drive && g.drive.on) return 'In town, driving'; var p = g.player, x = p.pos.x, z = p.pos.z;
    if (p.floor === 2) return 'Roof greenhouse'; if (p.floor === 1) return x > 2 ? 'Connoisseur lounge' : 'Upstairs flat'; if (p.floor === -1) return x > 28 ? 'Bank or gun store interior' : x > 12 ? 'Extraction lab' : 'Basement works';
    if (Math.abs(x) > 12.3 && !(z < -9 && x < 17.3) || z > 9.3 || z < -18.2) return 'In town, on foot'; if (z < -9) return x >= 8 ? 'Security room' : 'Back room and yard'; if (z > 4) return 'Lobby'; if (z < -2) return x < -1 ? 'Grow room' : 'Dry and cure room'; return x < -4 ? 'Office' : x < 4 ? 'Shop floor and service window' : 'Processing room';
  }
  function gz64(str) {
    if (!('CompressionStream' in window)) return Promise.resolve({ enc: 'base64', data: btoa(unescape(encodeURIComponent(str))) });
    var cs = new CompressionStream('gzip'), w = cs.writable.getWriter(); w.write(new TextEncoder().encode(str)); w.close();
    return new Response(cs.readable).arrayBuffer().then(function (buf) { var u = new Uint8Array(buf), bin = ''; for (var i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return { enc: 'gzip+base64', data: btoa(bin) }; });
  }
  function facts() {
    var g = G(), S = g && g.S, p = g && g.player, out = [];
    out.push('Game version: ' + (window.RF_VERSION || 'unknown') + (window.process && window.process.versions ? '' : '') + ' · ' + (/Electron/i.test(navigator.userAgent) ? 'desktop app' : 'browser'));
    out.push('System: ' + navigator.userAgent); out.push('Screen: ' + window.innerWidth + ' x ' + window.innerHeight + ' @' + (window.devicePixelRatio || 1) + 'x · language ' + navigator.language);
    try { out.push('Settings: ' + (localStorage.getItem('rfgrowco-settings') || 'defaults')); } catch (e) {}
    try { out.push('Save slot: ' + (localStorage.getItem('rfgrowco-slot') || '1')); } catch (e2) {}
    if (S && p) {
      out.push('Player: floor ' + p.floor + ' at x ' + p.pos.x.toFixed(1) + ', z ' + p.pos.z.toFixed(1) + (g.drive && g.drive.on ? ' (driving)' : '') + ' · holding ' + (g.held && g.held() ? JSON.stringify(g.held()) : 'nothing'));
      out.push('Shop: day ' + S.day + ', ' + (typeof S.clock === 'number' ? S.clock.toFixed(1) + ' h' : '') + ' · level ' + S.level + ' · rep ' + Math.round(S.rep) + ' · bank $' + Math.round(S.bank) + ' · till $' + Math.round(S.till) + ' · vault $' + Math.round(S.vault) + ' · pocket $' + Math.round(S.pocket));
      out.push('Open: ' + (g.shop ? g.shop().open : '?') + ' · customer: ' + (S.customer ? S.customer.who + ' wants ' + S.customer.qty + ' ' + S.customer.want + (S.customer.stage ? ' (' + S.customer.stage + ')' : '') : 'none') + ' · licences: ' + Object.keys(S.lic || {}).filter(function (k) { return S.lic[k]; }).join(', '));
      out.push('Upgrades: ' + Object.keys(S.upgrades || {}).filter(function (k) { return S.upgrades[k]; }).join(', '));
      try { var hs = g.heistState && g.heistState(); if (hs && hs.heist.on) out.push('Robbery in progress: ' + hs.heist.kind + ' · ' + hs.robbers.map(function (r) { return r.state; }).join(', ')); } catch (e3) {}
      if (S.x) out.push('Extras: heat ' + Math.round(S.x.heat || 0) + ' · weather ' + (S.x.weather && S.x.weather.kind) + ' · staff ' + JSON.stringify(S.x.staff || {}) + ' · delivery ' + (S.x.delivery ? 'open' : 'none'));
    } else out.push('The game world was not running (report filed from the main menu or before load).');
    return out;
  }
  function buildText(f) {
    var g = G(), S = g && g.S, L = [];
    L.push('===== RF GROW CO. BUG REPORT ====='); L.push('Title: ' + f.title); L.push('Category: ' + f.category); L.push('Severity: ' + f.severity); L.push('How often: ' + f.frequency); L.push('Where: ' + f.where); if (f.contact) L.push('Contact: ' + f.contact);
    L.push(''); L.push('--- What happened ---'); L.push(f.what || '(not filled in)'); L.push(''); L.push('--- What I expected ---'); L.push(f.expected || '(not filled in)'); L.push(''); L.push('--- Steps to make it happen again ---'); L.push(f.steps || '(not filled in)');
    L.push(''); L.push('--- The game says ---'); facts().forEach(function (x) { L.push(x); });
    L.push(''); L.push('--- Recent script errors ---'); L.push(errors.length ? errors.join('\n') : 'none recorded');
    if (S && f.incStats) { L.push(''); L.push('--- Lifetime stats ---'); L.push(JSON.stringify(S.stats || {})); L.push(''); L.push('--- Last events ---'); (S.log || []).slice(0, 25).forEach(function (e) { L.push((e.t ? e.t + ' ' : '') + String(e.msg || e.text || JSON.stringify(e)).replace(/<[^>]+>/g, '')); }); }
    return L.join('\n');
  }
  function download(name, text) { try { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000); return true; } catch (e) { return false; } }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return legacyCopy(text); });
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) { try { var t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(t); t.select(); var ok = document.execCommand('copy'); t.remove(); return ok; } catch (e) { return false; } }
  function issueUrl(f, short) {
    var q = ['template=bug_report.yml', 'title=' + encodeURIComponent('[Bug] ' + f.title), 'category=' + encodeURIComponent(f.category), 'severity=' + encodeURIComponent(f.severity), 'frequency=' + encodeURIComponent(f.frequency), 'where=' + encodeURIComponent(f.where), 'version=' + encodeURIComponent(window.RF_VERSION || 'unknown'), 'what=' + encodeURIComponent(short)];
    return 'https://github.com/' + REPO + '/issues/new?' + q.join('&');
  }

  function view(html) { root.querySelector('.rf-report-body').innerHTML = html; }
  function select(id, opts, val) { return '<select id="rfr-' + id + '">' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>'; }
  function form() {
    var running = !!(G() && G().ui && G().ui.started);
    view('<h2>🐞 Report a bug</h2><p class="rfr-lead">Thank you. The more you fill in, the faster it gets fixed. Nothing is sent until you press the button at the bottom, and you will see everything that goes out.</p>' +
      '<label>A short title <span>required</span><input id="rfr-title" maxlength="110" placeholder="e.g. Jo walks through the counter when serving"></label>' +
      '<div class="rfr-grid"><label>What kind of problem is it?' + select('category', FIELDS.category, 'Gameplay and balance') + '</label><label>How bad is it?' + select('severity', FIELDS.severity, FIELDS.severity[2]) + '</label>' +
      '<label>How often does it happen?' + select('frequency', FIELDS.frequency, 'Sometimes') + '</label><label>Where were you?' + select('where', FIELDS.where, guessWhere()) + '</label></div>' +
      '<label>What happened? <span>required</span><textarea id="rfr-what" rows="4" placeholder="Describe what you saw. What were you doing right before?"></textarea></label>' +
      '<label>What did you expect to happen instead?<textarea id="rfr-expected" rows="2"></textarea></label>' +
      '<label>Steps to make it happen again, if you know them<textarea id="rfr-steps" rows="3" placeholder="1. Open the shop&#10;2. Wait for a customer&#10;3. ..."></textarea></label>' +
      '<label>Discord name or other contact, if you want a reply <span>optional</span><input id="rfr-contact" maxlength="80"></label>' +
      '<div class="rfr-checks"><label class="rfr-check"><input type="checkbox" id="rfr-save"' + (running ? ' checked' : ' disabled') + '> Attach my savegame <small>lets the developer load your exact shop. It contains only game data.</small></label>' +
      '<label class="rfr-check"><input type="checkbox" id="rfr-stats" checked> Attach lifetime stats and the last 25 events</label></div>' +
      '<div class="rfr-note">Always included: game version, your system and screen size, your settings, where you were standing, and any script errors the game recorded. No name, no email, no files from your PC.</div>' +
      '<div class="rfr-btns"><button class="primary" data-rfr="send">Send the report</button><button data-rfr="preview">Preview what will be sent</button><button data-rfr="close">Cancel</button></div><div class="rfr-err" id="rfr-err"></div>');
    if (last) ['title', 'what', 'expected', 'steps', 'contact'].forEach(function (k) { var e = document.getElementById('rfr-' + k); if (e && last[k]) e.value = last[k]; });
    setTimeout(function () { var t = document.getElementById('rfr-title'); if (t) t.focus(); }, 50);
  }
  function read() { function v(id) { var e = document.getElementById('rfr-' + id); return e ? String(e.value || '').trim() : ''; } return { title: v('title'), category: v('category'), severity: v('severity'), frequency: v('frequency'), where: v('where'), what: v('what'), expected: v('expected'), steps: v('steps'), contact: v('contact'), incSave: !!(document.getElementById('rfr-save') || {}).checked, incStats: !!(document.getElementById('rfr-stats') || {}).checked }; }
  function assemble(f) {
    var text = buildText(f), g = G(), S = g && g.S;
    if (!f.incSave || !S) return Promise.resolve({ text: text + '\n\n===== END =====', saveIncluded: false });
    var copyOfSave = JSON.parse(JSON.stringify(S)); if (copyOfSave.log) copyOfSave.log = copyOfSave.log.slice(0, 30);
    return gz64(JSON.stringify(copyOfSave)).then(function (z) { return { text: text + '\n\n----- SAVE (' + z.enc + ') -----\n' + z.data + '\n----- END SAVE -----\n===== END =====', saveIncluded: true }; });
  }
  function send(previewOnly) {
    var f = read(), err = document.getElementById('rfr-err'); last = f;
    if (!previewOnly && (f.title.length < 6 || f.what.length < 10)) { err.textContent = 'Please give it a short title and say what happened (a sentence is enough).'; return; }
    assemble(f).then(function (r) {
      if (previewOnly) { view('<h2>What will be sent</h2><p class="rfr-lead">This exact text. The long block at the end is your savegame, compressed.</p><textarea class="rfr-preview" readonly rows="18">' + esc(r.text) + '</textarea><div class="rfr-btns"><button data-rfr="back">← Back to the form</button></div>'); return; }
      var name = 'RF-Grow-Co-bug-report-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.txt';
      if (window.RF_REPORT_ENDPOINT) { relay(f, r, name); return; }
      var tooBig = r.text.length > 60000, clip = tooBig ? r.text.slice(0, r.text.indexOf('----- SAVE')) + '(the savegame was too large to paste: please attach the downloaded file ' + name + ' to the issue)\n===== END =====' : r.text;
      copy(clip).then(function (copied) {
        var saved = download(name, r.text), url = issueUrl(f, f.what.slice(0, 600));
        window.open(url, '_blank', 'noopener');
        view('<h2>✅ Almost done: one paste</h2><ol class="rfr-steps"><li>Your browser just opened a <b>GitHub bug form</b> with your answers already filled in. You need a free GitHub account to submit it.</li>' +
          '<li>Click into the big box called <b>"Report data"</b> and press <b>Ctrl + V</b>. ' + (copied ? 'The whole report' + (r.saveIncluded && !tooBig ? ', savegame included,' : '') + ' is on your clipboard.' : '<b>Copying failed</b>: use the button below to copy it again.') + '</li>' +
          (tooBig ? '<li>Your savegame is large. <b>Drag the file ' + esc(name) + '</b> (it was just saved to your Downloads) into that same box to attach it.</li>' : '') +
          '<li>Press <b>Submit new issue</b>. It is labelled and assigned to the developer automatically.</li></ol>' +
          '<div class="rfr-note">' + (saved ? 'A copy was also saved as <b>' + esc(name) + '</b>. ' : '') + 'No GitHub account? Send that file on <a href="#" data-rfr="discord">Discord</a> instead.</div>' +
          '<div class="rfr-btns"><button data-rfr="reopen">Open the GitHub form again</button><button data-rfr="recopy">Copy the report again</button><button data-rfr="refile">Save the file again</button><button class="primary" data-rfr="close">Done</button></div>');
        root._ctx = { url: url, clip: clip, text: r.text, name: name };
      });
    }).catch(function (e) { err.textContent = 'Could not build the report: ' + (e && e.message || e); });
  }
  function relay(f, r, name) {
    view('<h2>Sending…</h2><p class="rfr-lead">Filing your report.</p>');
    fetch(window.RF_REPORT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: f.title, category: f.category, severity: f.severity, frequency: f.frequency, where: f.where, version: window.RF_VERSION || 'unknown', report: r.text }) })
      .then(function (res) { return res.json().then(function (j) { if (!res.ok) throw new Error(j && j.error || res.status); return j; }); })
      .then(function (j) { view('<h2>✅ Report sent</h2><p class="rfr-lead">Thank you. It was filed as ' + (j.url ? '<a href="#" data-rfr="openurl" data-url="' + esc(j.url) + '">' + esc(j.url) + '</a>' : 'a new issue') + '.</p><div class="rfr-btns"><button class="primary" data-rfr="close">Done</button></div>'); })
      .catch(function (e) { download(name, r.text); view('<h2>Could not send it</h2><p class="rfr-lead">' + esc(e && e.message || e) + '. The report was saved as <b>' + esc(name) + '</b>; you can attach it to a GitHub issue or post it on Discord.</p><div class="rfr-btns"><button data-rfr="back">← Back</button><button class="primary" data-rfr="close">Close</button></div>'); });
  }

  function show() {
    if (open) return; open = true; try { document.exitPointerLock(); } catch (e) {}
    if (!root) { root = document.createElement('div'); root.className = 'rf-front rf-report'; root.innerHTML = '<div class="rf-report-card"><div class="rf-report-body"></div></div>'; document.body.appendChild(root);
      root.addEventListener('click', function (e) { var t = e.target.closest('[data-rfr]'); if (!t) return; e.preventDefault(); var a = t.getAttribute('data-rfr'), c = root._ctx || {};
        if (a === 'close') hide(); else if (a === 'send') send(false); else if (a === 'preview') send(true); else if (a === 'back') form(); else if (a === 'reopen') window.open(c.url, '_blank', 'noopener'); else if (a === 'recopy') copy(c.clip); else if (a === 'refile') download(c.name, c.text); else if (a === 'discord') window.open('https://discord.gg/8FcgxwJ3dM', '_blank', 'noopener'); else if (a === 'openurl') window.open(t.getAttribute('data-url'), '_blank', 'noopener'); }); }
    root.hidden = false; form();
  }
  function hide() { open = false; if (root) root.hidden = true; }
  // while the form is open the game must not hear the keyboard: typing W would walk the player away
  ['keydown', 'keyup', 'keypress'].forEach(function (ev) { window.addEventListener(ev, function (e) { if (ev === 'keydown' && e.code === 'F7') { e.preventDefault(); e.stopPropagation(); if (open) hide(); else show(); return; } if (!open) return; if (ev === 'keydown' && e.code === 'Escape') { hide(); e.preventDefault(); } e.stopPropagation(); }, true); });
  ['mousedown', 'contextmenu', 'wheel'].forEach(function (ev) { window.addEventListener(ev, function (e) { if (open && root && !root.contains(e.target)) e.stopPropagation(); }, true); });
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-menu="bug"], [data-rf="bug"]'); if (b) { e.preventDefault(); show(); } });
  window.RFREPORT = { show: show, hide: hide, isOpen: function () { return open; }, build: function (f) { return assemble(f); }, fields: FIELDS };
})();
