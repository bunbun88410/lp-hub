/* ZB Motion.tsx: full hero scroll cancellation + quiet opacity-only reveals. */
(() => {
  'use strict';
  const root = document.documentElement;
  const button = document.querySelector('.motion-switch');
  const hero = document.querySelector('.hero');
  const backdrop = hero?.querySelector('.hero-photo');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false, frame = 0;
  const stopped = () => paused || media.matches;
  const items = [...new Set(document.querySelectorAll('.hero-copy > *, .intro-grid > *, .section-head > *, #support .step-copy > *, #support .learning-photo, .opening-label, .cycle-head > *, .cycle-steps > li, .pricing-intro > *, .price-grid > *, .start-steps > *, .consult-grid > *'))];
  let observer;

  function paint() {
    frame = 0;
    if (!hero || !backdrop) return;
    const rect = hero.getBoundingClientRect();
    const offset = stopped() ? 0 : Math.max(0, Math.min(-rect.top, rect.height));
    backdrop.style.setProperty('--hero-scroll-y', offset + 'px');
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(paint); }
  function showAll() {
    items.forEach(item => item.classList.add('in'));
    observer?.disconnect();
  }
  function sync() {
    const off = stopped();
    root.classList.toggle('boki-motion-paused', off);
    root.dataset.motionState = off ? 'paused' : 'scroll';
    if (button) {
      button.setAttribute('aria-pressed', String(off));
      button.setAttribute('aria-label', media.matches ? '動きを控えた表示' : off ? '動きを再開' : '動きを停止');
      button.disabled = media.matches;
      button.innerHTML = '<span aria-hidden="true">' + (off ? '▶' : 'Ⅱ') + '</span>';
    }
    if (off) showAll();
    document.dispatchEvent(new CustomEvent('boki:motion-preference', {detail: {stopped: off}}));
    schedule();
  }

  // Fail open: without JS or IntersectionObserver, all original content stays visible.
  if (typeof IntersectionObserver === 'function' && !stopped()) {
    try {
      observer = new IntersectionObserver(entries => {
        entries.filter(entry => entry.isIntersecting).map(entry => entry.target)
          .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
          .forEach((item, index) => {
            item.style.setProperty('--i', String(Math.min(index, 5)));
            item.classList.add('in');
            observer.unobserve(item);
          });
      }, {rootMargin: '0px 0px -10% 0px'});
      items.forEach(item => { item.classList.add('boki-fx'); observer.observe(item); });
      root.classList.add('boki-motion-ready');
    } catch { showAll(); }
  }
  button?.addEventListener('click', () => { paused = !paused; sync(); });
  media.addEventListener('change', sync);
  addEventListener('scroll', () => { if (!stopped()) schedule(); }, {passive: true});
  addEventListener('resize', schedule, {passive: true});
  addEventListener('load', schedule, {once: true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
  document.fonts?.ready.then(schedule).catch(() => {});
  sync();
})();
