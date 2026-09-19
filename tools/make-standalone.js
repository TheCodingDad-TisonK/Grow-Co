// One-time converter: turns the desk-hosted build of grow3d.js into the standalone game.
// It removes every call to the Implementation Desk API and replaces the office wall screen
// with an in-game shop dashboard. Every anchor must match exactly once, or nothing is written.
// Kept in the repo as a record of what differs from the original; it is not part of the game.
var fs = require('fs'), path = require('path');
var file = path.join(__dirname, '..', 'game', 'grow3d.js');
var src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'), n = 0;
function fail(m) { console.error(m); process.exit(1); }
function rep(a, b) { var i = src.indexOf(a); if (i < 0) fail('MISSING: ' + a.slice(0, 90)); if (src.indexOf(a, i + 1) >= 0) fail('NOT UNIQUE: ' + a.slice(0, 90)); src = src.slice(0, i) + b + src.slice(i + a.length); n++; }
function cut(startMark, endMark, replacement) { var a = src.indexOf(startMark); if (a < 0) fail('MISSING start: ' + startMark); var b = src.indexOf(endMark, a); if (b < 0) fail('MISSING end: ' + endMark); src = src.slice(0, a) + replacement + src.slice(b); n++; }

// 1. no network: the screen redraws from the save instead of fetching
cut('  function fetchDesk() {', '  // page rotation: every 12 s', '  function fetchDesk() { deskBoard.lastFetch = now(); drawDeskBoard(); }   /* standalone: nothing is fetched, the dashboard reads the save */\n');

// 2. the wall screen and its panel become a shop dashboard
var dash = [
"  function dashRows() {",
"    var X = typeof xs === 'function' ? xs() : { heat: 0, staff: {}, weather: { kind: 'clear' } }, T = typeof tob === 'function' ? tob() : null, packs = T ? CIG_KEYS.reduce(function (a, k) { return a + T.packs[k]; }, 0) : 0;",
"    var staffN = (S.staff && S.staff.worker ? 1 : 0) + 1 + (X.staff.driver ? 1 : 0) + (X.staff.operator ? 1 : 0) + (X.staff.night ? 1 : 0);",
"    return {",
"      overview: [['Bank', money(S.bank), 'cash on site ' + money(cashOnSite())], ['Reputation', String(Math.round(S.rep)), 'level ' + S.level], ['Market', (S.market || 1).toFixed(2) + 'x', shop().open ? 'shop is open' : 'shop is closed'], ['Day', String(S.day || 1), (typeof season === 'function' ? season() : '') + ' · ' + X.weather.kind]],",
"      prs: [['Cured stash', Math.round(S.cured.g) + ' g', 'ready to pack'], ['Eighth bags', String(S.pkg.bags.n), 'on the goods shelf'], ['Joints', String(S.pkg.joints.n), 'on the goods shelf'], ['Cookies', String(S.pkg.cookies.n), 'on the goods shelf']],",
"      seats: [['People on the payroll', String(staffN), 'guard included'], ['Driver', X.staff.driver ? 'hired' : 'none', 'wholesale and deliveries'], ['Basement operator', X.staff.operator ? 'hired' : 'none', 'keeps the line running'], ['Night guard', X.staff.night ? 'hired' : 'none', 'stops break-ins']],",
"      fleet: [['Cigarette packs', String(packs), 'on the basement rack'], ['Plants growing', String(S.plants.length), 'in the tent'], ['Roof beds', String((X.roof || []).filter(function (b) { return b.stage !== 'empty'; }).length), 'sown'], ['Lab', X.lab && X.lab.job ? 'running' : 'idle', 'extraction and edibles']],",
"      watch: [['Police heat', Math.round(X.heat) + ' / 100', X.heat >= 60 ? 'inspections likely' : X.heat >= 30 ? 'noticed' : 'quiet'], ['Robberies', String(S.stats.heists || 0), (S.stats.foiled || 0) + ' foiled'], ['Lost to robbers', money(S.stats.robbed || 0), 'all time'], ['Power', typeof powerOn === 'function' && !powerOn() ? 'CUT' : 'on', S.upgrades.generator ? 'generator standing by' : 'no generator']]",
"    };",
"  }",
"  function drawDeskBoard() {",
"    var c = deskBoard.canvas; if (!c) return; var ctx = c.getContext('2d'), W = c.width, H = c.height, page = DESK_PAGES[deskBoard.page], rows = dashRows()[page] || [];",
"    ctx.fillStyle = '#07110b'; ctx.fillRect(0, 0, W, H); ctx.textBaseline = 'top'; ctx.textAlign = 'left';",
"    ctx.fillStyle = DESK_OK; ctx.font = '800 40px \"Segoe UI\",system-ui,sans-serif'; ctx.fillText('RF GROW CO.', 40, 26);",
"    ctx.fillStyle = DESK_DIM; ctx.font = '26px \"Segoe UI\",system-ui,sans-serif'; ctx.textAlign = 'right'; ctx.fillText(DESK_PAGE_LABEL[page], W - 40, 34); ctx.textAlign = 'left';",
"    DESK_PAGES.forEach(function (p, i) { deskDot(ctx, W / 2 - (DESK_PAGES.length - 1) * 14 + i * 28, 52, i === deskBoard.page ? DESK_OK : 'rgba(255,255,255,.18)', 6); });",
"    rows.forEach(function (r, i) { deskTile(ctx, 40 + (i % 2) * 770, 120 + Math.floor(i / 2) * 330, 740, 300, r[0], r[1], r[2], DESK_OK); });",
"    ctx.fillStyle = DESK_MUTE; ctx.font = '22px \"Segoe UI\",system-ui,sans-serif'; ctx.fillText('shop dashboard · E for the full sheet', 40, H - 50);",
"    deskBoard.tex.needsUpdate = true;",
"  }",
"  function paneDesk() {",
"    var all = dashRows(); var h = '<div class=\"g3-box\"><div class=\"g3-chips\">' + DESK_PAGES.map(function (p, i) { return '<button class=\"g3-btn' + (i === deskBoard.page ? ' primary' : '') + '\" data-act=\"deskPage\" data-id=\"' + i + '\">' + DESK_PAGE_LABEL[p] + '</button>'; }).join('') + '</div></div>';",
"    (all[DESK_PAGES[deskBoard.page]] || []).forEach(function (r) { h += '<div class=\"g3-row\"><span class=\"ico\">📊</span><span class=\"meta\"><span class=\"n\">' + esc(r[0]) + ' · ' + esc(r[1]) + '</span><span class=\"own\">' + esc(r[2]) + '</span></span></div>'; });",
"    return h;",
"  }",
""].join('\n');
cut('  function drawDeskBoard() {', '\n  // ── Decoration ', dash);
rep("var DESK_PAGE_LABEL = { overview: 'Overview', prs: 'Pull requests', seats: 'Seats & ledger', fleet: 'Fleet readiness', watch: 'Watchdogs & health' };", "var DESK_PAGE_LABEL = { overview: 'Overview', prs: 'Stock', seats: 'Staff', fleet: 'Production', watch: 'Security' };");
rep("signPlane(['LIVE DESK', 'PRs · seats · fleet · watchdogs · E for the panel'],", "signPlane(['SHOP DASHBOARD', 'money · stock · staff · production · security'],");
rep("return 'Live desk board <small>' + DESK_PAGE_LABEL[DESK_PAGES[deskBoard.page]] + ' · ' + deskBoard.data.prs.length + ' open PRs · E for the panel</smal", "return 'Shop dashboard <small>' + DESK_PAGE_LABEL[DESK_PAGES[deskBoard.page]] + ' · E for the full sheet</smal");

// 3. wording that pointed back at the desk
rep("setTimeout(function () { toast('Close this tab to return to the desk', ''); }, 200);", "setTimeout(function () { toast('Your game is saved. You can close the window.', ''); }, 200);");
rep("<p style=\"margin-top:8px\">Settings also live on the desk tab, and apply live.</p>", "<p style=\"margin-top:8px\">Settings apply live and are remembered.</p>");
rep("'Progress is shared with the desk tab.'", "'Your shop is waiting.'");
rep("the Implementation Desk API (refreshes every 30 s)", "the save itself (standalone build: no network)");

// 4. a save of its own, so the standalone never touches a desk-hosted save in the same browser
rep("SETTINGS_KEY = 'rf-grow3d-settings';", "SETTINGS_KEY = 'rfgrowco-settings';");
rep("return q ? 'rf-grow-' + q.replace(/[^a-z0-9_-]/gi, '') : 'rf-grow-v1'; } catch (e) { return 'rf-grow-v1'; } })();", "return q ? 'rfgrowco-' + q.replace(/[^a-z0-9_-]/gi, '') : 'rfgrowco-v1'; } catch (e) { return 'rfgrowco-v1'; } })();");
fs.writeFileSync(file, src); console.log('standalone conversion applied: ' + n + ' edits');
