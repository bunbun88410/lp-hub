/* 簿記1級LP v2 の動き（基本）。
   元：本番CMA LP の /assets/cma-zb-base-20261108.js（2026-11-08版）。
   使い回した処理＝スマホメニュー（リンクで閉じる・Escで閉じる）／読んだ量のバー（--page-progress）／
   節ごとの進み具合（--section-progress）／ヒーローの貼りつき進行（--hero-progress）／
   文字が濃くなる（data-ink）／線の上を進む点（graph-curve と getPointAtLength）／
   動きの停止ボタン（.motion-switch）／prefers-reduced-motion への追従。
   CMA固有の「AIに質問するデモ」の自動再生は簿記LPに無いので入れていない。 */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const mobileMenu = document.querySelector('.mobile-nav');
  const hero = document.querySelector('.hero-story');
  const heroStage = hero ? hero.querySelector('.hero') : null;
  const switcher = document.querySelector('.motion-switch');
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const editorials = [...document.querySelectorAll('.editorial')].map(el => ({ el, inks: [...el.querySelectorAll('[data-ink]')] }));
  const graphs = [...document.querySelectorAll('.story-graph')].map(fig => {
    const path = fig.querySelector('.graph-curve');
    return { fig, path, length: path && path.getTotalLength ? path.getTotalLength() : 0, dots: [...fig.querySelectorAll('.graph-dot,.graph-dot-halo')] };
  });
  // 文字の色：薄い灰青 → 簿記LPの紺（--navy #0F2C44）
  const INK_START = [184, 194, 204];
  const INK_END = [15, 44, 68];
  let paused = false;
  let frame = 0;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const stopped = () => paused || reduced.matches;

  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { mobileMenu.open = false; }));
    mobileMenu.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        mobileMenu.open = false;
        mobileMenu.querySelector('summary').focus();
      }
    });
    document.addEventListener('click', event => { if (mobileMenu.open && !mobileMenu.contains(event.target)) mobileMenu.open = false; });
  }

  function placeDots(graph, progress) {
    if (!graph.path || !graph.length || !graph.path.getPointAtLength) return;
    const point = graph.path.getPointAtLength(progress * graph.length);
    graph.dots.forEach(dot => { dot.setAttribute('cx', point.x.toFixed(2)); dot.setAttribute('cy', point.y.toFixed(2)); });
  }

  function paint() {
    frame = 0;
    const vh = innerHeight;
    const headerHeight = header ? header.offsetHeight : 0;
    root.style.setProperty('--bm-header-h', headerHeight + 'px');
    root.style.setProperty('--page-progress', String(clamp(scrollY / Math.max(1, root.scrollHeight - vh))));
    if (stopped()) {
      graphs.forEach(graph => { graph.fig.dataset.curveProgress = '1'; placeDots(graph, 1); });
      return;
    }
    scenes.forEach(scene => {
      const r = scene.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh + r.height));
      scene.style.setProperty('--section-progress', p.toFixed(4));
      scene.dataset.scrollProgress = p.toFixed(4);
    });
    if (hero && heroStage) {
      const r = hero.getBoundingClientRect();
      // PC：貼りついている間（hero-story の下余白ぶん）で 0→1。スマホ：CMAと同じく高さの58%で 0→1。
      const travel = innerWidth > 900 ? Math.max(1, hero.offsetHeight - heroStage.offsetHeight) : Math.max(1, r.height * .58);
      const p = clamp((headerHeight - r.top) / travel);
      hero.style.setProperty('--hero-progress', p.toFixed(4));
      hero.dataset.heroProgress = p.toFixed(4);
    }
    editorials.forEach(({ el, inks }) => {
      const r = el.getBoundingClientRect();
      const p = clamp((vh * .85 - r.top) / Math.max(vh * .55, r.height * .75));
      inks.forEach((ink, i) => {
        const a = clamp(p * 2.1 - i / inks.length);
        ink.style.setProperty('--ink-color', 'rgb(' + INK_START.map((v, j) => Math.round(v + (INK_END[j] - v) * a)).join(',') + ')');
        ink.dataset.inkProgress = a.toFixed(3);
      });
    });
    graphs.forEach(graph => {
      const r = graph.fig.getBoundingClientRect();
      const p = clamp((vh * .88 - r.top) / (vh * .6));
      const curve = .06 + .94 * p;
      graph.fig.style.setProperty('--curve-progress', curve.toFixed(4));
      graph.fig.dataset.curveProgress = curve.toFixed(4);
      placeDots(graph, curve);
    });
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };

  function sync() {
    root.classList.toggle('boki-motion-paused', stopped());
    root.dataset.motionState = stopped() ? 'paused' : 'scroll';
    if (switcher) {
      switcher.setAttribute('aria-pressed', String(stopped()));
      switcher.setAttribute('aria-label', stopped() ? '動きを再開' : '動きを停止');
      switcher.innerHTML = '<span aria-hidden="true">' + (stopped() ? '▶' : 'Ⅱ') + '</span>';
      switcher.disabled = reduced.matches;
      if (reduced.matches) switcher.setAttribute('aria-label', '動きを控えた表示');
    }
    document.dispatchEvent(new CustomEvent('boki:motion-preference', { detail: { stopped: stopped() } }));
    schedule();
  }

  if (switcher) switcher.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', sync);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('load', schedule, { once: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule).catch(() => {});
  document.querySelectorAll('details').forEach(d => d.addEventListener('toggle', schedule));
  sync();
})();
