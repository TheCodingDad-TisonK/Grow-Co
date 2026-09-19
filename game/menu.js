// Splash screen and main menu for the standalone game.
// The game boots underneath as usual; this layer only decides when to press its "Enter" button.
(function () {
  'use strict';
  var KEY = (function () { try { var q = new URLSearchParams(location.search).get('save'); return q ? 'rfgrowco-' + q.replace(/[^a-z0-9_-]/gi, '') : 'rfgrowco-v1'; } catch (e) { return 'rfgrowco-v1'; } })();
  function $(id) { return document.getElementById(id); }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
  function readSave() { try { var raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }

  var splash = document.getElementById('rf-splash') || el('<div class="rf-front" id="rf-splash"><div class="rf-splash-inner"><img src="rf-icon.png" alt="RF"><div class="rf-splash-by">a game by <b>TheCodingDad</b></div><div class="rf-disclaimer"><b>NOT a Farming Simulator product.</b> This game has nothing to do with Farming Simulator, GIANTS Software, or any Farming Simulator mod. It is a separate, standalone hobby project that exists only because its author enjoyed making it.</div></div><div class="rf-splash-skip">click or press any key</div></div>');
  var menu = el('<div class="rf-front" id="rf-mainmenu" hidden><div class="rf-menu-card"><img src="rf-icon.png" alt="RF"><h1>RF Grow Co.</h1><div class="rf-menu-sub">first-person shop simulator</div><div id="rf-menu-body"></div><div class="rf-disclaimer"><b>NOT a Farming Simulator product.</b> This game has nothing to do with Farming Simulator, GIANTS Software, or any Farming Simulator mod. It is a separate, standalone hobby project that exists only because its author enjoyed making it.</div><div class="rf-menu-foot">a game by TheCodingDad</div></div></div>');
  document.body.appendChild(menu); if (!splash.parentNode) document.body.appendChild(splash);

  var skipSplash = false; try { skipSplash = sessionStorage.getItem('rfgc-skip-splash') === '1'; sessionStorage.removeItem('rfgc-skip-splash'); } catch (e) {}
  var splashDone = false;
  function endSplash() { if (splashDone) return; splashDone = true; menu.hidden = false; showMain(); splash.classList.add('fade'); setTimeout(function () { splash.hidden = true; }, 750); }
  if (skipSplash) { splash.hidden = true; splashDone = true; menu.hidden = false; }
  else { setTimeout(endSplash, 5000); splash.addEventListener('click', endSplash); window.addEventListener('keydown', function once() { window.removeEventListener('keydown', once); endSplash(); }); }

  var card = menu.querySelector('.rf-menu-card');
  function body(html) { $('rf-menu-body').innerHTML = html; }
  function showMain() {
    var s = readSave(), has = !!(s && (s.day > 1 || (s.stats && s.stats.earned > 0) || (s.plants && s.plants.length)));
    body('<div class="rf-menu-btns">' +
      '<button class="primary" data-rf="play">' + (has ? '▶ Continue' : '▶ Start your shop') + '</button>' +
      (has ? '<button data-rf="new">✚ New game</button>' : '') +
      '<button data-rf="how">📖 Guide</button>' +
      '<button data-rf="discord">💬 Join the Discord</button>' +
      '<button data-rf="site">🌐 realisticfarming.com</button>' +
      '<button data-rf="quit">⏏ Quit</button></div>' +
      '<div class="rf-menu-save">' + (has ? 'Day ' + (s.day || 1) + ' · level ' + (s.level || 1) + ' · ' + money(s.bank) + ' in the bank · rep ' + Math.round(s.rep || 0) : 'No shop yet. It starts with a tent, a seed and ' + money(220) + '.') + '</div>');
  }
  var LINKS = { discord: 'https://discord.gg/Th2pnq36', site: 'https://realisticfarming.com' };
  var chapter = 0;
  function showHow() {
    var G = window.RF_GUIDE || []; card.classList.add('wide');
    body('<div class="rf-guide"><div class="rf-guide-nav">' + G.map(function (c, i) { return '<button data-rf="ch" data-i="' + i + '"' + (i === chapter ? ' class="on"' : '') + '>' + c.icon + ' ' + c.title + '</button>'; }).join('') + '</div><div class="rf-guide-page"><h2>' + (G[chapter] ? G[chapter].icon + ' ' + G[chapter].title : '') + '</h2>' + (G[chapter] ? G[chapter].html : '') + '</div></div><div class="rf-menu-btns" style="margin-top:12px"><button data-rf="back">← Back to the menu</button></div>');
  }
  function showNew() {
    body('<div class="rf-how">Start over? This erases your current shop for good: money, stock, licences, layout, everything.</div><div class="rf-menu-btns"><button class="danger" data-rf="new-yes">Yes, erase it and start fresh</button><button data-rf="back">← Keep my shop</button></div>');
  }
  function play() { menu.classList.add('fade'); setTimeout(function () { menu.hidden = true; }, 700); var b = $('g3-start-btn'); if (b) b.click(); }
  menu.addEventListener('click', function (e) {
    var t = e.target.closest('[data-rf]'); if (!t) return; var a = t.getAttribute('data-rf');
    if (a === 'play') play(); else if (a === 'how') showHow(); else if (a === 'back') { card.classList.remove('wide'); showMain(); } else if (a === 'ch') { chapter = +t.getAttribute('data-i') || 0; showHow(); } else if (a === 'discord' || a === 'site') window.open(LINKS[a], '_blank', 'noopener'); else if (a === 'new') showNew();
    else if (a === 'new-yes') { try { localStorage.removeItem(KEY); sessionStorage.setItem('rfgc-skip-splash', '1'); } catch (err) {} location.reload(); }
    else if (a === 'quit') { window.close(); setTimeout(function () { body('<div class="rf-how">You can close this window now.</div><div class="rf-menu-btns"><button data-rf="back">← Back</button></div>'); }, 300); }
  });
  if (skipSplash) showMain();
  window.RFFRONT = { endSplash: endSplash, showMain: showMain, play: play, key: KEY };
})();
