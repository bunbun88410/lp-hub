// ai.html の地に敷く背景モチーフを組み立てて、CSSに貼れる形（data URI）で吐く。
//   --star-motif / --star2-motif … 星（タイル。2種を重ねて繰り返しの目を消す）
//   --sky-motif                  … 軌道リングと、空を行く乗り物
//   --city-motif                 … 地平線・惑星・未来都市のスカイライン・パースの床
//
// 使い方: node build-city-motif.mjs → 出た4行を ai.html の :root の同名の行と入れ替える。
// 目立たせないのが条件なので、どれも不透明度はかなり低く置いている。

const CYAN = '%237AE0FF';
const ORANGE = '%23FF7A45';
const VIOLET = '%239A8CFF';

const svg = (w, h, par, body) =>
  `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='${par}'%3E${body}%3C/svg%3E`;

// 再現できる乱数（毎回同じ星空にするため）
const mkRnd = seed => () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const r2 = n => Math.round(n * 100) / 100;

// ============================================================
// 1) 星（タイル）
// ============================================================
function stars(tile, count, seed, maxR, op) {
  const rnd = mkRnd(seed);
  let s = '';
  for (let i = 0; i < count; i++) {
    const cx = r2(rnd() * tile);
    const cy = r2(rnd() * tile);
    const r = r2(0.4 + rnd() * maxR);
    // 明るさをばらす。全部同じだと方眼のように見えてしまう
    const o = r2(op * (0.35 + rnd() * 0.65));
    s += `%3Ccircle cx='${cx}' cy='${cy}' r='${r}' fill-opacity='${o}'/%3E`;
  }
  return svg(tile, tile, 'xMidYMid slice', `%3Cg fill='%23ffffff'%3E${s}%3C/g%3E`);
}
const star1 = stars(340, 26, 20260804, 0.9, 0.42); // 細かい星
const star2 = stars(610, 14, 777, 1.5, 0.30);      // 少し大きい星をまばらに

// ============================================================
// 2) 空：軌道リングと乗り物
// ============================================================
// 軌道リング＝画面の外まで伸びる大きな楕円。弧だけが見える
const rings =
  `%3Cellipse cx='260' cy='120' rx='560' ry='150' transform='rotate(-14 260 120)'/%3E` +
  `%3Cellipse cx='1240' cy='250' rx='700' ry='190' transform='rotate(11 1240 250)'/%3E` +
  `%3Cellipse cx='820' cy='-40' rx='460' ry='130' transform='rotate(-6 820 -40)'/%3E`;

// [x, y, 長さ, 進行方向(1=右/-1=左)]
const craft = [[180, 96, 34, 1], [520, 52, 26, 1], [1010, 300, 40, -1], [1320, 68, 30, -1], [760, 348, 22, 1]];
let ships = '';
let trails = '';
for (const [x, y, len, dir] of craft) {
  const h = Math.max(4, Math.round(len * 0.22));
  ships += `%3Crect x='${x}' y='${y}' width='${len}' height='${h}' rx='${h / 2}'/%3E`;
  const tx = dir > 0 ? x : x + len;
  const tx2 = r2(dir > 0 ? x - len * 2.6 : x + len + len * 2.6);
  trails += `%3Cline x1='${tx}' y1='${y + h / 2}' x2='${tx2}' y2='${y + h / 2}'/%3E`;
  trails += `%3Ccircle cx='${dir > 0 ? x + len : x}' cy='${y + h / 2}' r='1.6'/%3E`;
}

// --- 惑星（上部の右手。地平線側に置くと街とマスクに沈んで見えないので空に出す） ---
const PX = 1330, PY = 60, PR = 190;
const planet =
  `%3Ccircle cx='${PX}' cy='${PY}' r='${PR}' fill='url(%23pg)'/%3E` +
  // 環：細い楕円を2本。傾けて惑星らしく見せる
  `%3Cg fill='none' stroke='${CYAN}' stroke-opacity='0.16' stroke-width='1.4'%3E` +
  `%3Cellipse cx='${PX}' cy='${PY}' rx='${PR + 105}' ry='52' transform='rotate(-18 ${PX} ${PY})'/%3E` +
  `%3Cellipse cx='${PX}' cy='${PY}' rx='${PR + 150}' ry='72' transform='rotate(-18 ${PX} ${PY})'/%3E%3C/g%3E`;

const sky = svg(1600, 420, 'xMidYMin slice',
  `%3Cdefs%3E%3CradialGradient id='pg' cx='0.38' cy='0.30' r='0.8'%3E` +
  `%3Cstop offset='0' stop-color='${VIOLET}' stop-opacity='0.26'/%3E` +
  `%3Cstop offset='0.55' stop-color='${VIOLET}' stop-opacity='0.11'/%3E` +
  `%3Cstop offset='1' stop-color='${CYAN}' stop-opacity='0.03'/%3E%3C/radialGradient%3E%3C/defs%3E` +
  planet +
  `%3Cg fill='none' stroke='${CYAN}' stroke-opacity='0.075' stroke-width='1'%3E${rings}%3C/g%3E` +
  `%3Cg stroke='${CYAN}' stroke-opacity='0.13' stroke-width='1' fill='${ORANGE}' fill-opacity='0.5'%3E${trails}%3C/g%3E` +
  `%3Cg fill='${CYAN}' fill-opacity='0.20'%3E${ships}%3C/g%3E`
);

// ============================================================
// 3) 地上：地平線・惑星・スカイライン・パースの床
// ============================================================
const W = 1600, H = 460, HORIZON = 200;

// --- スカイライン --- [左端, 幅, 高さ]
const buildings = [
  [0, 78, 84], [82, 46, 54], [132, 62, 115], [198, 38, 72], [240, 90, 94],
  [334, 52, 147], [390, 44, 63], [438, 74, 107], [516, 40, 80], [560, 96, 130],
  [660, 50, 67], [714, 66, 100], [784, 42, 140], [830, 84, 77], [918, 48, 110],
  [970, 72, 90], [1046, 40, 61], [1090, 88, 122], [1182, 46, 74], [1232, 64, 99],
  [1300, 52, 135], [1356, 78, 70], [1438, 44, 104], [1486, 92, 85], [1582, 18, 112],
];
let rects = '';
let lit = '';
let antennas = '';
buildings.forEach(([x, w, h], i) => {
  const y = HORIZON - h;
  rects += `%3Crect x='${x}' y='${y}' width='${w}' height='${h}'/%3E`;
  // 窓は1個ずつ置くとデータが肥大するので pattern で塗る。2種を交互に当てて機械的に見せない
  lit += `%3Crect x='${x}' y='${y}' width='${w}' height='${h}' fill='url(%23w${i % 2})'/%3E`;
  if (h > 105 && w < 60) {
    antennas += `%3Cline x1='${x + w / 2}' y1='${y}' x2='${x + w / 2}' y2='${y - 26}'/%3E`;
    antennas += `%3Ccircle cx='${x + w / 2}' cy='${y - 28}' r='2'/%3E`;
  }
});

// --- パースの床（消失点＝地平線の中央） ---
let floor = '';
for (let x = -1400; x <= 3000; x += 190) {
  floor += `%3Cline x1='${W / 2}' y1='${HORIZON}' x2='${x}' y2='${H}'/%3E`;
}
for (let i = 1; i <= 10; i++) {
  // 手前ほど間隔を広げる＝奥行きが出る
  const y = r2(HORIZON + (H - HORIZON) * Math.pow(i / 10, 2.6));
  floor += `%3Cline x1='0' y1='${y}' x2='${W}' y2='${y}'/%3E`;
}

const win = (id, ox, oy, gw, gh) =>
  `%3Cpattern id='${id}' x='${ox}' y='${oy}' width='${gw}' height='${gh}' patternUnits='userSpaceOnUse'%3E` +
  `%3Crect x='0' y='0' width='3' height='3' fill='${CYAN}' fill-opacity='0.11'/%3E%3C/pattern%3E`;

const city = svg(W, H, 'xMidYMax slice',
  `%3Cdefs%3E` +
  win('w0', 6, 8, 15, 13) + win('w1', 9, 5, 18, 16) +
  // 地平線のにじみ
  `%3ClinearGradient id='hz' x1='0' y1='0' x2='0' y2='1'%3E` +
  `%3Cstop offset='0' stop-color='${CYAN}' stop-opacity='0'/%3E` +
  `%3Cstop offset='0.5' stop-color='${CYAN}' stop-opacity='0.10'/%3E` +
  `%3Cstop offset='1' stop-color='${CYAN}' stop-opacity='0'/%3E%3C/linearGradient%3E` +
  // 全体のマスク：空へ向けて消し、手前（下）でも落とす。本文への食い込みを防ぐ
  `%3ClinearGradient id='f' x1='0' y1='0' x2='0' y2='1'%3E` +
  `%3Cstop offset='0' stop-color='%23fff' stop-opacity='0'/%3E` +
  `%3Cstop offset='0.30' stop-color='%23fff' stop-opacity='0.5'/%3E` +
  `%3Cstop offset='0.44' stop-color='%23fff' stop-opacity='1'/%3E` +
  `%3Cstop offset='0.80' stop-color='%23fff' stop-opacity='0.8'/%3E` +
  `%3Cstop offset='1' stop-color='%23fff' stop-opacity='0.25'/%3E%3C/linearGradient%3E` +
  `%3Cmask id='m'%3E%3Crect width='${W}' height='${H}' fill='url(%23f)'/%3E%3C/mask%3E` +
  `%3C/defs%3E` +
  `%3Cg mask='url(%23m)'%3E` +
  `%3Cg stroke='${CYAN}' stroke-opacity='0.055' stroke-width='1' fill='none'%3E${floor}%3C/g%3E` +
  `%3Crect x='0' y='${HORIZON - 26}' width='${W}' height='52' fill='url(%23hz)'/%3E` +
  `%3Cline x1='0' y1='${HORIZON}' x2='${W}' y2='${HORIZON}' stroke='${CYAN}' stroke-opacity='0.20'/%3E` +
  // ビルは一度地の色で塗ってから薄く光らせる＝惑星や床が透けないようにする
  `%3Cg fill='%23060B14' fill-opacity='0.55'%3E${rects}%3C/g%3E` +
  `%3Cg fill='${CYAN}' fill-opacity='0.05'%3E${rects}%3C/g%3E` +
  `%3Cg%3E${lit}%3C/g%3E` +
  `%3Cg stroke='${CYAN}' stroke-opacity='0.14' stroke-width='1' fill='${ORANGE}' fill-opacity='0.30'%3E${antennas}%3C/g%3E` +
  `%3C/g%3E`
);

const out = [
  ['--star-motif', star1],
  ['--star2-motif', star2],
  ['--sky-motif', sky],
  ['--city-motif', city],
];
for (const [name, data] of out) {
  console.log(`      ${name}: url("data:image/svg+xml,${data}");`);
}
console.error('長さ ' + out.map(([n, d]) => `${n}=${d.length}`).join(' '));
