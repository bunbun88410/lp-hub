// cma.html の地に敷く「データベース」のモチーフを組み立てて、CSSに貼れる形（data URI）で吐く。
//   --table-motif … レコードの行と、幅がばらばらな列。タイルで繰り返す
//   --er-motif    … ER図（テーブル3つ＋1対多の線）と、DBの円柱。固定で1枚だけ置く
//
// 使い方: node build-db-motif.mjs → 出た2行を cma.html の :root の同名の行と入れ替える。
// 方眼と違って「列の幅が不揃い」なのが肝。等間隔だとただの方眼紙に見えてしまう。

const INK = '%2316233A';   // 紺
const GOLD = '%23A87F2B';  // 真鍮

const svg = (w, h, par, body) =>
  `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='${par}'%3E${body}%3C/svg%3E`;

// ============================================================
// 1) テーブル（タイル）：レコードの行 × 幅の違う列
// ============================================================
const TW = 720, TH = 340, ROW = 34;

let bands = '';   // 1行おきの薄い帯＝レコードの縞
let hlines = '';  // 行の罫
for (let i = 0, y = 0; y < TH; i++, y += ROW) {
  if (i % 2 === 1) bands += `%3Crect x='0' y='${y}' width='${TW}' height='${ROW}'/%3E`;
  if (y > 0) hlines += `%3Cline x1='0' y1='${y}' x2='${TW}' y2='${y}'/%3E`;
}

// 列の境目。わざと不等間隔にする（ID・日付・名前・金額…と幅が違う想像）
const COLS = [96, 208, 268, 392, 470, 604];
const vlines = COLS.map(x => `%3Cline x1='${x}' y1='0' x2='${x}' y2='${TH}'/%3E`).join('');

// 値が入っているセルを少しだけ濃く（全部だと重いので数個）
const cells = [[0, 1], [2, 0], [3, 4], [5, 2], [1, 6], [7, 3], [8, 5], [4, 2]]
  .map(([r, c]) => {
    const x = c === 0 ? 0 : COLS[c - 1];
    const w = (COLS[c] ?? TW) - x;
    return `%3Crect x='${x + 8}' y='${r * ROW + 12}' width='${Math.max(14, w - 26)}' height='9' rx='2'/%3E`;
  }).join('');

const table = svg(TW, TH, 'none',
  `%3Cg fill='${INK}' fill-opacity='0.020'%3E${bands}%3C/g%3E` +
  `%3Cg fill='${INK}' fill-opacity='0.045'%3E${cells}%3C/g%3E` +
  `%3Cg stroke='${INK}' stroke-opacity='0.045' stroke-width='1'%3E${hlines}%3C/g%3E` +
  `%3Cg stroke='${INK}' stroke-opacity='0.075' stroke-width='1'%3E${vlines}%3C/g%3E`
);

// ============================================================
// 2) ER図＋円柱（固定で1枚）
// ============================================================
// テーブルの箱。ヘッダー帯と、中の行を数本
const box = (x, y, w, rows) => {
  let inner = `%3Crect x='${x}' y='${y}' width='${w}' height='${22 + rows * 17}' rx='4'/%3E`;
  let head = `%3Cpath d='M${x} ${y + 4}a4 4 0 0 1 4-4h${w - 8}a4 4 0 0 1 4 4v18h-${w}z'/%3E`;
  let lines = '';
  for (let i = 1; i <= rows; i++) {
    lines += `%3Cline x1='${x + 9}' y1='${y + 22 + i * 17 - 6}' x2='${x + w - 9}' y2='${y + 22 + i * 17 - 6}'/%3E`;
  }
  return { inner, head, lines };
};

const boxes = [box(80, 120, 190, 4), box(430, 330, 210, 5), box(150, 520, 175, 3)];
const outline = boxes.map(b => b.inner).join('');
const heads = boxes.map(b => b.head).join('');
const rowlines = boxes.map(b => b.lines).join('');

// つなぎ線と、1対多のしるし（カラスの足）
const crow = (x, y, dir) =>
  `%3Cpath d='M${x} ${y}l${12 * dir} -7M${x} ${y}l${12 * dir} 0M${x} ${y}l${12 * dir} 7'/%3E`;
const links =
  `%3Cpath d='M270 175H350V352H430'/%3E` + crow(430, 352, -1) +
  `%3Cpath d='M237 520V430H430'/%3E` + crow(430, 430, -1) +
  `%3Cpath d='M640 400H700V560'/%3E`;

// DBの円柱
const CX = 700, CY = 560, RX = 78, RY = 24, CH = 96;
const cylinder =
  `%3Cpath d='M${CX - RX} ${CY}v${CH}a${RX} ${RY} 0 0 0 ${RX * 2} 0V${CY}'/%3E` +
  `%3Cellipse cx='${CX}' cy='${CY}' rx='${RX}' ry='${RY}'/%3E` +
  `%3Cpath d='M${CX - RX} ${CY + 32}a${RX} ${RY} 0 0 0 ${RX * 2} 0'/%3E` +
  `%3Cpath d='M${CX - RX} ${CY + 64}a${RX} ${RY} 0 0 0 ${RX * 2} 0'/%3E`;

const er = svg(1200, 800, 'xMidYMid meet',
  `%3Cg fill='none' stroke='${INK}' stroke-opacity='0.10' stroke-width='1.4'%3E${outline}%3C/g%3E` +
  `%3Cg fill='${INK}' fill-opacity='0.05'%3E${heads}%3C/g%3E` +
  `%3Cg stroke='${INK}' stroke-opacity='0.06' stroke-width='1'%3E${rowlines}%3C/g%3E` +
  `%3Cg fill='none' stroke='${GOLD}' stroke-opacity='0.20' stroke-width='1.4'%3E${links}%3C/g%3E` +
  `%3Cg fill='none' stroke='${INK}' stroke-opacity='0.11' stroke-width='1.4'%3E${cylinder}%3C/g%3E`
);

// ============================================================
// 3) ローソク足と出来高（画面の下に固定で敷く）
// ============================================================
// 証券アナリストの講座なので、データベースだけだと「分析」が出ない。
// 相場がずっと動いている感じを、下に薄く1本だけ通す。
const CW = 1600, CHH = 360;
const BASE = 250;   // 終値の基準線
const VOL_TOP = 286; // 出来高の上端

// 再現できる乱数（毎回同じ相場にするため）
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

  const g = up ? 'u' : 'd';
  candles += `%3Cg class='${g}'%3E`
    + `%3Cline x1='${r1(x)}' y1='${r1(hi)}' x2='${r1(x)}' y2='${r1(lo)}'/%3E`
    + `%3Crect x='${r1(x - w / 2)}' y='${r1(top)}' width='${r1(w)}' height='${r1(h)}'/%3E`
    + `%3C/g%3E`;

  const vh = 12 + rnd() * 56;
  volumes += `%3Crect x='${r1(x - w / 2)}' y='${r1(VOL_TOP + (74 - vh))}' width='${r1(w)}' height='${r1(vh)}'/%3E`;
}
function r1(n) { return Math.round(n * 10) / 10; }

// 移動平均（5本）
const ma = closes.map((_, i) => {
  const s = closes.slice(Math.max(0, i - 4), i + 1);
  return [closes[i][0], s.reduce((t, p) => t + p[1], 0) / s.length];
});
const maLine = `%3Cpolyline points='${ma.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}'/%3E`;

// 価格の目盛（水平の破線）
const levels = [140, 200, 260].map(y => `%3Cline x1='0' y1='${y}' x2='${CW}' y2='${y}'/%3E`).join('');

// 上昇と下降で色を分ける（上昇＝真鍮、下降＝紺）
const upG = candles.replace(/%3Cg class='d'%3E[\s\S]*?%3C\/g%3E/g, '').replace(/%3Cg class='u'%3E|%3C\/g%3E/g, '');
const dnG = candles.replace(/%3Cg class='u'%3E[\s\S]*?%3C\/g%3E/g, '').replace(/%3Cg class='d'%3E|%3C\/g%3E/g, '');

const chart = svg(CW, CHH, 'xMidYMax slice',
  `%3Cg stroke='${INK}' stroke-opacity='0.07' stroke-width='1' stroke-dasharray='6 10'%3E${levels}%3C/g%3E` +
  `%3Cg fill='${INK}' fill-opacity='0.075'%3E${volumes}%3C/g%3E` +
  `%3Cg stroke='${INK}' stroke-opacity='0.18' fill='${INK}' fill-opacity='0.11' stroke-width='1'%3E${dnG}%3C/g%3E` +
  `%3Cg stroke='${GOLD}' stroke-opacity='0.34' fill='%23ffffff' fill-opacity='0.8' stroke-width='1'%3E${upG}%3C/g%3E` +
  `%3Cg fill='none' stroke='${GOLD}' stroke-opacity='0.45' stroke-width='1.6'%3E${maLine}%3C/g%3E`
);

console.log(`      --table-motif: url("data:image/svg+xml,${table}");`);
console.log(`      --er-motif: url("data:image/svg+xml,${er}");`);
console.log(`      --candle-motif: url("data:image/svg+xml,${chart}");`);
console.error(`長さ table=${table.length} er=${er.length} candle=${chart.length}`);
