/* CMA独自の軽量な面構成。外部ライブラリ・通信・ポインタ追従なし。 */
(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.motion-hero');
  const visual = document.querySelector('.motion-visual');
  const toggle = document.querySelector('.motion-toggle');
  const slides = [...document.querySelectorAll('.motion-slide')];
  const orbits = [...document.querySelectorAll('.motion-orbit span')];
  const demo = document.querySelector('#experience');
  const journey = document.querySelector('.motion-journey');
  const pin = document.querySelector('.motion-pin');
  if (!hero || !visual || !toggle || !journey || !pin || !demo) return;
  let paused = false, slide = 0, visible = true, frame = 0, timer = 0, swap = 0, finish = 0;
  let driven = false, top = 24, segment = 600, distance = 1500, active = -1;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const stopped = () => paused || preference.matches;
  const stopBuild = () => {
    clearTimeout(timer); clearTimeout(swap); clearTimeout(finish);
    visual.classList.remove('is-building');
    visual.dataset.motionState = stopped() ? 'paused' : 'idle';
  };
  const scheduleSlide = () => {
    clearTimeout(timer);
    if (!stopped() && visible && !document.hidden) timer = setTimeout(rebuild, 4800);
  };
  const rebuild = () => {
    if (stopped() || !visible || document.hidden || hero.getBoundingClientRect().top < -40) { scheduleSlide(); return; }
    visual.classList.add('is-building');
    visual.dataset.motionState = 'building';
    swap = setTimeout(() => {
      slides[slide].classList.remove('is-current'); slide = (slide + 1) % slides.length;
      slides[slide].classList.add('is-current'); visual.dataset.slide = String(slide);
      visual.querySelector('.motion-count').textContent = '0' + (slide + 1) + ' — 03';
    }, 520);
    finish = setTimeout(() => { visual.classList.remove('is-building'); visual.dataset.motionState = 'idle'; scheduleSlide(); }, 1580);
  };
  const setStep = next => {
    if (next === active) return;
    active = next;
    demo.dispatchEvent(new CustomEvent('cma:scroll-step', { detail: { step: next } }));
  };
  const update = () => {
    frame = 0;
    const h = hero.getBoundingClientRect();
    const spread = stopped() ? 0 : clamp(-h.top / (innerHeight * .45), 0, 1);
    visual.style.setProperty('--spread', String(spread));
    visual.style.setProperty('--image-y', (-spread * 42) + 'px');
    visual.dataset.spread = spread.toFixed(3);
    if (driven) {
      const progress = clamp(top - journey.getBoundingClientRect().top, 0, distance);
      journey.style.setProperty('--journey-progress', String(progress / distance));
      setStep(Math.min(2, Math.floor(progress / segment)));
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const measure = () => {
    // 実際に収まる画面でだけpinする。狭い/短い画面は元の操作式を維持。
    const wasDriven = driven;
    journey.classList.remove('is-pinned');
    const height = pin.getBoundingClientRect().height;
    top = Math.max(12, Math.min(32, innerHeight - height - 20));
    driven = !stopped() && innerWidth > 650 && height + top + 20 <= innerHeight;
    segment = Math.max(460, innerHeight * .72);
    distance = segment * 2.55;
    journey.style.setProperty('--pin-top', top + 'px');
    journey.style.setProperty('--pin-height', height + 'px');
    journey.style.setProperty('--pin-distance', distance + 'px');
    journey.classList.toggle('is-pinned', driven);
    journey.dataset.scrollDriven = String(driven);
    demo.classList.toggle('scroll-demo', driven);
    if (driven !== wasDriven) active = -1;
    schedule();
  };
  const sync = () => {
    document.documentElement.classList.toggle('cma-motion-paused', stopped());
    toggle.setAttribute('aria-pressed', String(stopped()));
    toggle.innerHTML = stopped() ? '動きを再生 <span aria-hidden="true">▶</span>' : '動きを停止 <span aria-hidden="true">Ⅱ</span>';
    toggle.disabled = preference.matches;
    if (preference.matches) toggle.textContent = '動きを控えた表示';
    document.dispatchEvent(new CustomEvent('cma:motion-preference', { detail: { stopped: stopped() } }));
    orbits.forEach(orb => { orb.style.animationPlayState = !stopped() && visible && !document.hidden ? 'running' : 'paused'; });
    stopBuild(); measure(); scheduleSlide();
  };
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', () => {
    stopBuild(); scheduleSlide();
    orbits.forEach(orb => { orb.style.animationPlayState = !stopped() && visible && !document.hidden ? 'running' : 'paused'; });
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    orbits.forEach(orb => { orb.style.animationPlayState = visible && !stopped() && !document.hidden ? 'running' : 'paused'; });
    if (!visible) stopBuild(); else scheduleSlide();
  }).observe(hero);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure);
  // 手動操作も同じ工程のスクロール位置へ。固定を解除しても全ボタンが使える。
  demo.querySelectorAll('[data-demo-step],.demo-question-open,.demo-chip').forEach(button => {
    button.addEventListener('click', () => {
      if (!driven) return;
      const next = button.hasAttribute('data-demo-step') ? Number(button.dataset.demoStep) : button.classList.contains('demo-chip') ? 2 : 1;
      active = next;
      const y = scrollY + journey.getBoundingClientRect().top - top + segment * (next + .04);
      window.scrollTo({ top: y, behavior: 'auto' });
    });
  });
  document.fonts?.ready.then(measure);
  window.addEventListener('load', measure, { once: true });
  document.documentElement.classList.add('motion-enabled');
  visual.dataset.slide = '0';
  sync();
})();
