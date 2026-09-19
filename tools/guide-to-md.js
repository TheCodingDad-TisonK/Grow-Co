// Writes docs/Player-Guide.md from game/guide.js, so the in-game guide and the wiki never drift apart.
// Run with: npm run guide
var fs = require('fs'), path = require('path'), vm = require('vm');
var sandbox = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'game', 'guide.js'), 'utf8'), sandbox);
var G = sandbox.window.RF_GUIDE;
function md(html) {
  return html
    .replace(/<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/g, function (_, a, b) { return '| ' + a + ' | ' + b + ' |\n'; })
    .replace(/<table>/g, '\n| Key | What it does |\n|---|---|\n').replace(/<\/table>/g, '\n')
    .replace(/<ol>([\s\S]*?)<\/ol>/g, function (_, inner) { var i = 0; return '\n' + inner.replace(/<li>([\s\S]*?)<\/li>/g, function (_2, t) { i++; return i + '. ' + t + '\n'; }) + '\n'; })
    .replace(/<ul>([\s\S]*?)<\/ul>/g, function (_, inner) { return '\n' + inner.replace(/<li>([\s\S]*?)<\/li>/g, function (_2, t) { return '- ' + t + '\n'; }) + '\n'; })
    .replace(/<p>([\s\S]*?)<\/p>/g, '\n$1\n').replace(/<b>(.*?)<\/b>/g, '**$1**').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/\\'/g, "'").replace(/\n{3,}/g, '\n\n').trim();
}
var out = '# Player guide\n\nThis page is generated from `game/guide.js`, the same text the game shows in its main menu and pause menu. Edit that file, then run `npm run guide`.\n\n' +
  G.map(function (c) { return '- [' + c.title + '](#' + c.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().replace(/ +/g, '-') + ')'; }).join('\n') + '\n\n' +
  G.map(function (c) { return '## ' + c.title + '\n\n' + md(c.html) + '\n'; }).join('\n');
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'Player-Guide.md'), out);
console.log('docs/Player-Guide.md written: ' + G.length + ' chapters');
