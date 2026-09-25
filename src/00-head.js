//@ file header, the closure, utilities and the save keys
/* ============================================================
   Grow Co.: a first-person shop simulator in 3D.
   Runs in its own window (grow3d.html). Same save key as the 2D
   game (rf-grow-v1) so progress carries over both ways. Economy
   is the same engine: buy, grow, cure, package, sell for cash.
   Rendering: three.js r128 (vendor/three), procedural everything.
   ============================================================ */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') { document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">three.js failed to load (vendor/three/three.min.js).</p>'; return; }

  // ── Utilities ─────────────────────────────────────────────────────
//#if desk
  var SAVE = (function () { try { var q = new URLSearchParams(location.search).get('save'); return q ? 'rf-grow-' + q.replace(/[^a-z0-9_-]/gi, '') : 'rf-grow-v1'; } catch (e) { return 'rf-grow-v1'; } })();
  var SETTINGS_KEY = 'rf-grow3d-settings';
//#else
  var SAVE = (function () { try { var q = new URLSearchParams(location.search).get('save'); if (q) return 'rfgrowco-' + q.replace(/[^a-z0-9_-]/gi, ''); var sl = +(localStorage.getItem('rfgrowco-slot') || 1); if (!(sl >= 1 && sl <= 3)) sl = 1; if (!localStorage.getItem('rfgrowco-slot1') && localStorage.getItem('rfgrowco-v1')) { localStorage.setItem('rfgrowco-slot1', localStorage.getItem('rfgrowco-v1')); localStorage.removeItem('rfgrowco-v1'); } return 'rfgrowco-slot' + sl; } catch (e) { return 'rfgrowco-slot1'; } })();   /* three save slots; the main menu picks one and reloads */
  var SETTINGS_KEY = 'rfgrowco-settings';
//#endif
  var now = function () { return Date.now(); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var money = function (n) { return '$' + Math.floor(n).toLocaleString('en-US'); };
  var gram = function (n) { return (Math.round(n * 10) / 10) + 'g'; };
  var randi = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  var randf = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

