(() => {
  'use strict';

  function init() {
    const windows = [...document.querySelectorAll('#learning .learning-photo-window')];
    if (!windows.length) return;
    const root = document.documentElement;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = root.classList.contains('cma-motion-paused');
    let frame = 0;
    const clamp = n => Math.max(0, Math.min(1, n));
    const set = (el, name, value) => {
      if (el.style.getPropertyValue(name) !== value) el.style.setProperty(name, value);
    };

    function paint() {
      frame = 0;
      const stopped = paused || media.matches;
      // Read the stationary aperture, never the transformed image. Keeping the
      // full measurement pass ahead of writes avoids scroll feedback/reflow.
      const boxes = windows.map(el => el.getBoundingClientRect());
      windows.forEach((el, i) => {
        const box = boxes[i];
        if (stopped) {
          el.dataset.photoMotion = 'static';
          set(el, '--photo-plane-height', '100%');
          set(el, '--photo-offset', '0px');
          return;
        }
        // ZB's photo-behind-an-aperture principle, bounded to these smaller
        // 4:3 photos so hands remain legible and no empty edge enters the frame.
        const travel = Math.min(64, box.height * .18);
        const progress = clamp((innerHeight - box.top) / Math.max(1, innerHeight + box.height));
        el.dataset.photoMotion = 'scroll';
        set(el, '--photo-plane-height', `${(box.height + travel * 2).toFixed(3)}px`);
        set(el, '--photo-offset', `${(-2 * travel * progress).toFixed(3)}px`);
      });
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(paint);
    }
    function preference(event) {
      paused = typeof event?.detail?.stopped === 'boolean'
        ? event.detail.stopped : root.classList.contains('cma-motion-paused');
      schedule();
    }
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    windows.forEach(el => observer?.observe(el));
    addEventListener('scroll', () => { if (!paused && !media.matches) schedule(); }, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    addEventListener('pageshow', schedule);
    addEventListener('load', schedule, { once: true });
    document.addEventListener('toggle', schedule, true);
    document.addEventListener('cma:motion-preference', preference);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
    media.addEventListener('change', preference);
    document.fonts?.ready.then(schedule).catch(() => {});
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
