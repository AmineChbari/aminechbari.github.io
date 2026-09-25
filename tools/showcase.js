// Composes "hero shot" images for each project from its real screenshots.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// Run from the repo root: node tools/showcase.js  (requires playwright)
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'images/showcase');
const uri = (f) => {
  const ext = path.extname(f).slice(1).replace('jpg', 'jpeg').replace('svg', 'svg+xml');
  return `data:image/${ext};base64,` + fs.readFileSync(path.join(ROOT, f)).toString('base64');
};

// main: primary screenshot, url: fake address bar label, c1/c2: glow colours,
// second: optional secondary window, backdrop: optional art behind everything
const projects = [
  { id: 'codelens', main: 'images/codelens.svg', url: 'codelens-mauve.vercel.app', c1: '#a78bfa', c2: '#22d3ee' },
  { id: 'vlille', crop: '16/8.7', main: 'images/vlille.jpg', url: "V'Lille — Swing GUI", c1: '#818cf8', c2: '#34d399', app: true },
  { id: 'vote', crop: '16/8.7', main: 'images/vote.jpg', url: 'localhost:3000/admin', c1: '#f472b6', c2: '#60a5fa' },
  { id: 'students', main: 'images/gestion-etudiants.svg', url: 'localhost:3000/etudiants', c1: '#34d399', c2: '#22d3ee' },
  { id: 'pandemic', main: 'images/pandemic.jpg', url: 'java -jar pandemic.jar', c1: '#ef4444', c2: '#f59e0b', backdrop: 'images/pndmc.jpg', term: true },
  { id: 'boutique', crop: '16/8.7', main: 'images/boutique.jpg', url: 'localhost:5173', c1: '#fb923c', c2: '#f472b6' },
  { id: 'games', main: 'images/pong.jpg', url: 'pong.html', c1: '#38bdf8', c2: '#facc15', second: { img: 'images/hit-target.jpg', url: 'hit-the-target.html' } },
  { id: 'motel', crop: '16/8.7', main: 'images/motel.jpg', url: 'south-motel.app', c1: '#f59e0b', c2: '#fb7185', second: { img: 'images/acceuil.png', url: 'south-motel.app/accueil' } },
];

const win = (img, url, cls, opts = {}) => `
  <div class="win ${cls} ${opts.term ? 'term' : ''}">
    <div class="bar"><i></i><i></i><i></i><span class="url">${opts.app || opts.term ? '' : '<b>⌁</b>'}${url}</span></div>
    <div class="shot" style="aspect-ratio:${opts.crop || 'auto'}"><img src="${uri(img)}"></div>
  </div>`;

const page = (p) => `<!doctype html><html><head><style>
  *{box-sizing:border-box} body{margin:0;width:1600px;height:1000px;overflow:hidden;background:#07070a;font-family:ui-monospace,Menlo,monospace}
  .stage{position:absolute;inset:0;perspective:2400px;overflow:hidden}
  .ambient{position:absolute;inset:-10%;background:url(${uri(p.backdrop || p.main)}) center/cover;filter:blur(${p.backdrop ? 2 : 70}px) saturate(1.3);opacity:${p.backdrop ? .38 : .35};transform:scale(1.1)}
  .glow1{position:absolute;width:1100px;height:900px;left:-200px;top:-300px;background:radial-gradient(closest-side,${p.c1}66,transparent);filter:blur(20px)}
  .glow2{position:absolute;width:1100px;height:900px;right:-250px;bottom:-350px;background:radial-gradient(closest-side,${p.c2}55,transparent);filter:blur(20px)}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:64px 64px;-webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 50%,#000,transparent 80%)}
  .vignette{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 45%,rgba(7,7,10,.85) 100%)}
  .win{position:absolute;border-radius:16px;overflow:hidden;background:#0d0d12;border:1px solid rgba(255,255,255,.14);
       box-shadow:0 60px 120px -20px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.04) inset,0 0 90px -10px ${p.c1}88}
  .win img{display:block;width:100%}.shot{overflow:hidden}.shot img{height:100%;object-fit:cover;object-position:top}
  .bar{height:40px;display:flex;align-items:center;gap:8px;padding:0 16px;background:linear-gradient(#1b1b22,#141419);border-bottom:1px solid rgba(255,255,255,.08)}
  .bar i{width:12px;height:12px;border-radius:50%;background:#3f3f46}.bar i:nth-child(1){background:#ff5f57}.bar i:nth-child(2){background:#febc2e}.bar i:nth-child(3){background:#28c840}
  .url{margin:0 auto;padding:6px 20px;border-radius:8px;background:rgba(255,255,255,.06);color:#a1a1aa;font-size:16px;min-width:340px;text-align:center}
  .url b{color:#71717a;font-weight:400;margin-right:8px}
  .term .bar{background:#0c0c0c}
  .main{width:1280px;left:170px;top:${p.second ? 70 : 95}px;transform:rotateY(-16deg) rotateX(7deg) rotateZ(1deg);transform-origin:60% 50%}
  .second{width:800px;left:40px;top:430px;transform:rotateY(-10deg) rotateX(6deg) rotateZ(-2deg);box-shadow:0 60px 120px -20px rgba(0,0,0,.9),0 0 90px -10px ${p.c2}88}
  .shine{position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.10),transparent 35%);pointer-events:none}
  .floor{position:absolute;left:0;right:0;bottom:-240px;height:520px;background:radial-gradient(ellipse at 50% 0%,${p.c1}33,transparent 65%);transform:rotateX(75deg)}
</style></head><body><div class="stage">
  <div class="ambient"></div><div class="glow1"></div><div class="glow2"></div><div class="grid"></div><div class="floor"></div>
  ${win(p.main, p.url, 'main', p)}
  ${p.second ? win(p.second.img, p.second.url, 'second') : ''}
  <div class="vignette"></div><div class="shine"></div>
</div></body></html>`;

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  for (const p of projects) {
    await pg.setContent(page(p), { waitUntil: 'load' });
    await pg.waitForTimeout(200);
    await pg.screenshot({ path: path.join(OUT, p.id + '.jpg'), type: 'jpeg', quality: 84 });
    console.log(p.id, fs.statSync(path.join(OUT, p.id + '.jpg')).size);
  }
  await b.close();
})();
