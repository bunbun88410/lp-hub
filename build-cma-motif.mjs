// cma.html の地に敷くモチーフを組み立てて、CSSに貼れる形（data URI）で吐く。
// テーマは「観測」＝ 相場を、星を見るように観る。
//   --star-motif   … 星（タイル）。明るい地なので、白ではなく紺の点で打つ
//   --orbit-motif  … 方位環（目盛つき）・軌道の楕円・星座線。固定で1枚
//   --candle-motif … ローソク足と出来高と移動平均。固定で画面の下に敷く
//
// 使い方: node build-cma-motif.mjs → 出た3行を cma.html の :root の同名の行と入れ替える。
//
// 2026-08-05：もとはデータベース（表・ER図・円柱）だったが、
// 「保管」の絵で止まっていて分析が出ないため、チャート＋宇宙に組み替えた。

const INK = '%2316233A';   // 紺
const GOLD = '%23A87F2B';  // 真鍮

const svg = (w, h, par, body) =>
  `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='${par}'%3E${body}%3C/svg%3E`;

const r1 = n => Math.round(n * 10) / 10;
const mkRnd = seed => () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

// ============================================================
// 1) 星（タイル）
// ============================================================
// 🔴 明るい地なので、星は白ではなく紺で打つ。白い星は紙に沈んで見えない。
function stars(tile, count, seed, maxR, op) {
  const rnd = mkRnd(seed);
  let s = '';
  for (let i = 0; i < count; i++) {
    const cx = r1(rnd() * tile);
    const cy = r1(rnd() * tile);
    const r = r1(0.5 + rnd() * maxR);
    const o = r1(op * (0.4 + rnd() * 0.6));
    s += `%3Ccircle cx='${cx}' cy='${cy}' r='${r}' fill-opacity='${o}'/%3E`;
  }
  return svg(tile, tile, 'xMidYMid slice', `%3Cg fill='${INK}'%3E${s}%3C/g%3E`);
}
const star = stars(380, 30, 20260805, 1.0, 0.30);

// ============================================================
// 2) 方位環・軌道・星座（固定で1枚）
// ============================================================
const OW = 1400, OH = 900;
const CX = 1080, CY = 300;   // 環の中心。右上に寄せて本文とぶつけない

// 方位環：同心円3本＋外周の目盛
const rings = `%3Ccircle cx='${CX}' cy='${CY}' r='120'/%3E`
  + `%3Ccircle cx='${CX}' cy='${CY}' r='196'/%3E`
  + `%3Ccircle cx='${CX}' cy='${CY}' r='268'/%3E`;
let ticks = '';
for (let a = 0; a < 360; a += 6) {
  const long = a % 30 === 0;
  const rad = (a * Math.PI) / 180;
  const r0 = 268, rr = 268 + (long ? 12 : 6);
  ticks += `%3Cline x1='${r1(CX + r0 * Math.cos(rad))}' y1='${r1(CY + r0 * Math.sin(rad))}'`
    + ` x2='${r1(CX + rr * Math.cos(rad))}' y2='${r1(CY + rr * Math.sin(rad))}'/%3E`;
}

// 軌道：傾いた楕円。画面の外まで伸ばして弧だけ見せる
const orbits =
  `%3Cellipse cx='${CX}' cy='${CY}' rx='420' ry='150' transform='rotate(-22 ${CX} ${CY})'/%3E` +
  `%3Cellipse cx='${CX}' cy='${CY}' rx='330' ry='300' transform='rotate(14 ${CX} ${CY})'/%3E` +
  `%3Cellipse cx='260' cy='700' rx='380' ry='128' transform='rotate(-12 260 700)'/%3E`;

// 星座：頂点を線でつなぐ。左下に置いて、右上の環と対角にする
const CONST = [[120, 640], [212, 592], [286, 664], [402, 618], [470, 706], [352, 754], [212, 592]];
let clines = '';
for (let i = 0; i < CONST.length - 1; i++) {
  clines += `%3Cline x1='${CONST[i][0]}' y1='${CONST[i][1]}' x2='${CONST[i + 1][0]}' y2='${CONST[i + 1][1]}'/%3E`;
}
const cdots = CONST.map(([x, y]) => `%3Ccircle cx='${x}' cy='${y}' r='3'/%3E`).join('');

// 惑星：軌道の上に1つ。宇宙だと分かる決め手はこれ。
// 🔴 固定背景なので画面上の位置が動かない。ヒーロー画像（右側 y320〜）と
//    本文（左側 x150〜680）を避けた、上側の帯に置いている。
const PX = 860, PY = 210, PR = 34;
const planet =
  `%3Ccircle cx='${PX}' cy='${PY}' r='${PR}'/%3E` +
  `%3Cellipse cx='${PX}' cy='${PY}' rx='${PR + 30}' ry='${r1(PR * 0.34)}' transform='rotate(-20 ${PX} ${PY})'/%3E` +
  `%3Cellipse cx='${PX}' cy='${PY}' rx='${PR + 46}' ry='${r1(PR * 0.5)}' transform='rotate(-20 ${PX} ${PY})'/%3E`;

const orbit = svg(OW, OH, 'xMidYMid meet',
  `%3Cg fill='none' stroke='${INK}' stroke-opacity='0.075' stroke-width='1'%3E${rings}%3C/g%3E` +
  `%3Cg stroke='${INK}' stroke-opacity='0.10' stroke-width='1'%3E${ticks}%3C/g%3E` +
  `%3Cg fill='none' stroke='${GOLD}' stroke-opacity='0.20' stroke-width='1.2'%3E${orbits}%3C/g%3E` +
  `%3Cg stroke='${INK}' stroke-opacity='0.13' stroke-width='1'%3E${clines}%3C/g%3E` +
  `%3Cg fill='${GOLD}' fill-opacity='0.42'%3E${cdots}%3C/g%3E` +
  `%3Cg fill='none' stroke='${INK}' stroke-opacity='0.16' stroke-width='1.3'%3E${planet}%3C/g%3E`
);

// ============================================================
// 3) ローソク足と出来高（画面の下に固定で敷く）
// ============================================================
const CW = 1600, CHH = 360;
const BASE = 250;    // 終値の基準線
const VOL_TOP = 286; // 出来高の上端

let seed = 20260805;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

let candles = '';
let volumes = '';
const closes = [];
let price = BASE;
const N = 46, STEP = CW / N;

for (let i = 0; i < N; i++) {
  const open = price;
  price += (rnd() - 0.48) * 26;            // 少しだけ上げ基調
  price = Math.max(120, Math.min(330, price));
  const close = price;
  const hi = Math.min(open, close) - rnd() * 16;   // y は上が小さい
  const lo = Math.max(open, close) + rnd() * 16;
  closes.push([i * STEP + STEP / 2, close]);

  const x = i * STEP + STEP / 2;
  const w = STEP * 0.46;
  const top = Math.min(open, close);
  const h = Math.max(2, Math.abs(close - open));
  const up = close < open;                  // y が小さい＝価格が高い＝上昇

  candles += `%3Cg class='${up ? 'u' : 'd'}'%3E`
    + `%3Cline x1='${r1(x)}' y1='${r1(hi)}' x2='${r1(x)}' y2='${r1(lo)}'/%3E`
    + `%3Crect x='${r1(x - w / 2)}' y='${r1(top)}' width='${r1(w)}' height='${r1(h)}'/%3E`
    + `%3C/g%3E`;

  const vh = 12 + rnd() * 56;
  volumes += `%3Crect x='${r1(x - w / 2)}' y='${r1(VOL_TOP + (74 - vh))}' width='${r1(w)}' height='${r1(vh)}'/%3E`;
}

// 移動平均（5本）
const ma = closes.map((_, i) => {
  const s = closes.slice(Math.max(0, i - 4), i + 1);
  return [closes[i][0], s.reduce((t, p) => t + p[1], 0) / s.length];
});
const maLine = `%3Cpolyline points='${ma.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}'/%3E`;

// 価格の目盛（水平の破線）
const levels = [140, 200, 260].map(y => `%3Cline x1='0' y1='${y}' x2='${CW}' y2='${y}'/%3E`).join('');

// 上昇と下降で色を分ける（上昇＝真鍮の中空、下降＝紺の塗り）
const upG = candles.replace(/%3Cg class='d'%3E[\s\S]*?%3C\/g%3E/g, '').replace(/%3Cg class='u'%3E|%3C\/g%3E/g, '');
const dnG = candles.replace(/%3Cg class='u'%3E[\s\S]*?%3C\/g%3E/g, '').replace(/%3Cg class='d'%3E|%3C\/g%3E/g, '');

const chart = svg(CW, CHH, 'xMidYMax slice',
  `%3Cg stroke='${INK}' stroke-opacity='0.07' stroke-width='1' stroke-dasharray='6 10'%3E${levels}%3C/g%3E` +
  `%3Cg fill='${INK}' fill-opacity='0.075'%3E${volumes}%3C/g%3E` +
  `%3Cg stroke='${INK}' stroke-opacity='0.18' fill='${INK}' fill-opacity='0.11' stroke-width='1'%3E${dnG}%3C/g%3E` +
  `%3Cg stroke='${GOLD}' stroke-opacity='0.34' fill='%23ffffff' fill-opacity='0.8' stroke-width='1'%3E${upG}%3C/g%3E` +
  `%3Cg fill='none' stroke='${GOLD}' stroke-opacity='0.45' stroke-width='1.6'%3E${maLine}%3C/g%3E`
);

console.log(`      --star-motif: url("data:image/svg+xml,${star}");`);
console.log(`      --orbit-motif: url("data:image/svg+xml,${orbit}");`);
console.log(`      --candle-motif: url("data:image/svg+xml,${chart}");`);
console.error(`長さ star=${star.length} orbit=${orbit.length} candle=${chart.length}`);
