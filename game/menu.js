// Splash screen and main menu. One file, used by both builds; the page sets window.RF_MENU to configure it.
//   slots: 3        three save slots (standalone).  slots: 0  one save, no slot list (desk build).
//   saveKey: 'k'    the single save's key when slots is 0.
//   bug: true       show the "Report a bug" button (needs report.js).
//   quitLabel       wording for the last button.
// The game boots underneath as usual; this layer decides when to press its "Enter" button.
(function () {
  'use strict';
  var CFG = window.RF_MENU || {};
  var SLOTS = typeof CFG.slots === 'number' ? CFG.slots : 3;
  var SINGLE_KEY = CFG.saveKey || 'rfgrowco-slot1';
  function $(id) { return document.getElementById(id); }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
  function money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  var urlSave = (function () { try { return new URLSearchParams(location.search).get('save'); } catch (e) { return null; } })();   // ?save=name is a developer save outside the slots
  function active() { var n = +(ls('rfgrowco-slot') || 1); return n >= 1 && n <= SLOTS ? n : 1; }
  function keyOf(n) { return SLOTS ? 'rfgrowco-slot' + n : SINGLE_KEY; }
  function readSlot(n) { try { var raw = ls(keyOf(n)); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function used(s) { return !!s; }   /* any save at all counts: show its real numbers rather than guessing whether it has been played */

  var NOTE = '<div class="rf-disclaimer"><b>NOT a Farming Simulator product.</b> This game has nothing to do with Farming Simulator, GIANTS Software, or any Farming Simulator mod. It is a separate, standalone hobby project that exists only because its author enjoyed making it.</div>';
  var splash = $('rf-splash') || el('<div class="rf-front" id="rf-splash"><div class="rf-splash-inner"><img src="rf-icon.png" alt="RF"><div class="rf-splash-by">a game by <b>TheCodingDad</b></div></div><div class="rf-splash-skip">click or press any key</div></div>');
  var menu = el('<div class="rf-front" id="rf-mainmenu" hidden><div class="rf-menu-card"><img src="rf-icon.png" alt="RF"><h1>RF Grow Co.</h1><div class="rf-menu-sub">first-person shop simulator</div>' + NOTE + '<div id="rf-menu-body"></div><div class="rf-menu-foot">a game by TheCodingDad' + (window.RF_VERSION ? ' · version ' + window.RF_VERSION : '') + (CFG.bug ? ' · F7 reports a bug' : '') + '</div></div></div>');
  document.body.appendChild(menu); if (!splash.parentNode) document.body.appendChild(splash);
  var card = menu.querySelector('.rf-menu-card');

  var flags = {}; try { ['rfgc-skip-splash', 'rfgc-autoplay'].forEach(function (k) { flags[k] = sessionStorage.getItem(k) === '1'; sessionStorage.removeItem(k); }); } catch (e) {}
  var splashDone = false;
  function endSplash() { if (splashDone) return; splashDone = true; menu.hidden = false; showMain(); splash.classList.add('fade'); setTimeout(function () { splash.hidden = true; }, 750); }
  if (flags['rfgc-skip-splash']) { splash.hidden = true; splashDone = true; menu.hidden = false; }
  else { setTimeout(endSplash, 3000); splash.addEventListener('click', endSplash); window.addEventListener('keydown', function once(e) { if (e.code === 'F7') return; window.removeEventListener('keydown', once); endSplash(); }); }

  function body(html) { $('rf-menu-body').innerHTML = html; }
  function line(s) { return 'Day ' + (s.day || 1) + ' · level ' + (s.level || 1) + ' · ' + money(s.bank) + ' · rep ' + Math.round(s.rep || 0); }
  function slotRow(n) {
    var s = readSlot(n), has = used(s), on = !urlSave && n === active();
    return '<div class="rf-slot' + (on ? ' on' : '') + '"><div class="rf-slot-info"><b>Slot ' + n + (on ? ' · loaded' : '') + '</b><span>' + (has ? line(s) : 'Empty slot: starts with a tent, a seed and ' + money(220)) + '</span></div>' +
      '<button class="' + (on ? 'primary' : '') + '" data-rf="slot" data-n="' + n + '">' + (has ? '▶ Continue' : '▶ Start') + '</button>' + (has ? '<button class="danger small" data-rf="del" data-n="' + n + '" title="Delete this save">🗑</button>' : '<span class="rf-slot-gap"></span>') + '</div>';
  }
  function showMain() {
    card.classList.remove('wide');
    var head = '';
    if (urlSave) head = '<div class="rf-how">Developer save "' + urlSave + '" is loaded. <button data-rf="play" class="primary" style="margin-top:8px;width:100%">▶ Play it</button></div>';
    else if (SLOTS) { var rows = ''; for (var n = 1; n <= SLOTS; n++) rows += slotRow(n); head = '<div class="rf-slots">' + rows + '</div>'; }
    else { var one = readSlot(1); head = '<div class="rf-menu-btns"><button class="primary" data-rf="play">' + (used(one) ? '▶ Continue' : '▶ Start your shop') + '</button></div><div class="rf-menu-save">' + (used(one) ? line(one) : 'No shop yet. It starts with a tent, a seed and ' + money(220)) + '</div>'; }
    body(head + '<div class="rf-menu-btns row"><button data-rf="how">📖 Guide</button>' + (CFG.bug ? '<button data-rf="bug">🐞 Report a bug</button>' : '') + '</div>' +
      '<div class="rf-menu-btns row"><button data-rf="discord">💬 Discord</button><button data-rf="site">🌐 realisticfarming.com</button><button data-rf="quit">' + (CFG.quitLabel || '⏏ Quit') + '</button></div>');
  }
  var LINKS = { discord: 'https://discord.gg/8FcgxwJ3dM', site: 'https://realisticfarming.com' };
  var chapter = 0;
  function showHow() {
    var G = window.RF_GUIDE || []; card.classList.add('wide');
    body('<div class="rf-guide"><div class="rf-guide-nav">' + G.map(function (c, i) { return '<button data-rf="ch" data-i="' + i + '"' + (i === chapter ? ' class="on"' : '') + '>' + c.icon + ' ' + c.title + '</button>'; }).join('') + '</div><div class="rf-guide-page"><h2>' + (G[chapter] ? G[chapter].icon + ' ' + G[chapter].title : '') + '</h2>' + (G[chapter] ? G[chapter].html : '') + '</div></div><div class="rf-menu-btns" style="margin-top:12px"><button data-rf="back">← Back to the menu</button></div>');
  }
  function showDelete(n) {
    var s = readSlot(n); body('<div class="rf-how"><b>Delete slot ' + n + '?</b><br>Day ' + (s && s.day || 1) + ', level ' + (s && s.level || 1) + ', ' + money(s && s.bank) + ' in the bank. This erases that shop for good: money, stock, licences, layout, everything. The other slots are not touched.</div><div class="rf-menu-btns"><button class="danger" data-rf="del-yes" data-n="' + n + '">Yes, delete slot ' + n + '</button><button data-rf="back">← Keep it</button></div>');
  }
  function play() { menu.classList.add('fade'); setTimeout(function () { menu.hidden = true; }, 700); var b = $('g3-start-btn'); if (b) b.click(); }
  function reloadInto(n, autoplay) { try { localStorage.setItem('rfgrowco-slot', String(n)); sessionStorage.setItem('rfgc-skip-splash', '1'); if (autoplay) sessionStorage.setItem('rfgc-autoplay', '1'); } catch (e) {} if (urlSave) location.href = location.pathname; else location.reload(); }
  menu.addEventListener('click', function (e) {
    var t = e.target.closest('[data-rf]'); if (!t) return; var a = t.getAttribute('data-rf'), n = +t.getAttribute('data-n');
    if (a === 'play') play();
    else if (a === 'slot') { if (!urlSave && n === active()) play(); else reloadInto(n, true); }
    else if (a === 'del') showDelete(n);
    else if (a === 'del-yes') { try { localStorage.removeItem(keyOf(n)); } catch (err) {} if (!urlSave && n === active()) reloadInto(n, false); else showMain(); }   // the loaded slot lives in memory too, so deleting it needs a reload
    else if (a === 'how') showHow(); else if (a === 'back') showMain(); else if (a === 'ch') { chapter = +t.getAttribute('data-i') || 0; showHow(); }
    else if (a === 'discord' || a === 'site') window.open(LINKS[a], '_blank', 'noopener');
    else if (a === 'quit') { window.close(); setTimeout(function () { body('<div class="rf-how">You can close this window now.</div><div class="rf-menu-btns"><button data-rf="back">← Back</button></div>'); }, 300); }
  });
  if (flags['rfgc-skip-splash']) { showMain(); if (flags['rfgc-autoplay']) setTimeout(play, 60); }
  window.RFFRONT = { endSplash: endSplash, showMain: showMain, play: play, active: active, slots: SLOTS };
})();
