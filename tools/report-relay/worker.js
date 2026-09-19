// Optional Cloudflare Worker: turns a bug report from the game into a GitHub issue,
// so players never need a GitHub account. The token lives here, never in the game.
//
// Deploy:
//   npm create cloudflare@latest rf-report-relay -- --type hello-world
//   copy this file over src/index.js, then:
//   npx wrangler secret put GITHUB_TOKEN        (a fine-grained token with Issues: read and write on the repo only)
//   npx wrangler deploy
// Then in game/version.js add:  window.RF_REPORT_ENDPOINT = 'https://<your-worker>.workers.dev/report';
const REPO = 'TheCodingDad-TisonK/RF-Grow-Co';
const MAX = 400_000;             // a report larger than this is refused: a savegame is normally a few kB
const PER_HOUR = 5;              // per IP
const AREAS = { 'Gameplay and balance': 'area: gameplay', 'Crash, freeze or black screen': 'area: crash', 'Graphics and visuals': 'area: graphics', 'Sound': 'area: sound', 'Saving and loading': 'area: saves', 'Menus, HUD and controls': 'area: ui', 'Performance': 'area: performance', 'Customers and selling': 'area: selling', 'Growing, drying and the bench': 'area: growing', 'Staff (Jo, guard, driver, operator)': 'area: staff', 'Robberies, weapons and police': 'area: crime', 'Basement, lab and machines': 'area: production', 'Town, car and map': 'area: town', 'Edit mode and creative mode': 'area: building', 'Installer or desktop app': 'area: app' };

export default {
  async fetch(request, env) {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'POST a report here' }, 405, cors);

    const body = await request.text();
    if (body.length > MAX) return json({ error: 'That report is too large. Please untick the savegame and try again.' }, 413, cors);
    let r; try { r = JSON.parse(body); } catch { return json({ error: 'malformed report' }, 400, cors); }
    if (!r.title || !r.report) return json({ error: 'a title and a report are required' }, 400, cors);

    if (env.RATE) {   // optional KV namespace bound as RATE; without it the relay simply does not rate limit
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown', key = 'rl:' + ip + ':' + new Date().toISOString().slice(0, 13);
      const n = +(await env.RATE.get(key) || 0);
      if (n >= PER_HOUR) return json({ error: 'Too many reports from here in the last hour. Please try again later, or post on Discord.' }, 429, cors);
      await env.RATE.put(key, String(n + 1), { expirationTtl: 3600 });
    }

    const labels = ['bug', 'player-report', 'needs-triage', 'via-relay'];
    if (AREAS[r.category]) labels.push(AREAS[r.category]);
    const sev = String(r.severity || '').split(':')[0].toLowerCase();
    if (['blocker', 'major', 'minor', 'cosmetic'].includes(sev)) labels.push('severity: ' + sev);
    if (/----- SAVE \(/.test(r.report)) labels.push('has-savegame');

    const issue = {
      title: '[Bug] ' + String(r.title).slice(0, 120),
      labels,
      assignees: ['TheCodingDad-TisonK'],
      body: ['**Filed from inside the game.**', '', '| | |', '|---|---|', '| Category | ' + (r.category || '?') + ' |', '| Severity | ' + (r.severity || '?') + ' |', '| How often | ' + (r.frequency || '?') + ' |', '| Where | ' + (r.where || '?') + ' |', '| Version | ' + (r.version || '?') + ' |', '', '<details><summary>Full report and savegame</summary>', '', '```text', String(r.report).slice(0, MAX), '```', '', '</details>'].join('\n')
    };

    const res = await fetch('https://api.github.com/repos/' + REPO + '/issues', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.GITHUB_TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'rf-grow-co-report-relay', 'Content-Type': 'application/json' },
      body: JSON.stringify(issue)
    });
    if (!res.ok) return json({ error: 'GitHub refused it (' + res.status + '). Please post the saved file on Discord.' }, 502, cors);
    const made = await res.json();
    return json({ ok: true, url: made.html_url, number: made.number }, 201, cors);
  }
};
function json(o, status, cors) { return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...cors } }); }
