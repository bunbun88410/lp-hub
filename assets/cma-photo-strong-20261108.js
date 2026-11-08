(() => {
  'use strict';
  function init() {
    const items = [...document.querySelectorAll('#learning .learning-photo-slot')].map(slot => ({
      slot, aperture: slot.querySelector('.learning-photo-window'),
    })).filter(item => item.aperture);
    if (!items.length) return;
    const root = document.documentElement;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = root.classList.contains('cma-motion-paused');
    let frame = 0;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const set = (el, name, value) => {
      if (el.style.getPropertyValue(name) !== value) el.style.setProperty(name, value);
    };
    function paint() {
      frame = 0;
      const stopped = paused || media.matches;
      // Slots never receive a scroll transform. Read only their stable layout,
      // then move their child figures: no transformed-measurement feedback.
      const boxes = items.map(({ slot, aperture }) => ({
        rect: slot.getBoundingClientRect(), height: aperture.clientHeight,
        range: parseFloat(getComputedStyle(slot).getPropertyValue('--photo-range')) || 90,
      }));
      items.forEach(({ slot, aperture }, index) => {
        const { rect, height, range } = boxes[index];
        const drift = stopped ? 0 : clamp((innerHeight * .55 - rect.top - rect.height / 2) * .45, -range, range);
        set(slot, '--photo-drift', `${drift.toFixed(3)}px`);
        aperture.dataset.photoMotion = stopped ? 'static' : 'scroll';
        if (stopped) {
          set(aperture, '--photo-plane-height', '100%');
          set(aperture, '--photo-offset', '0px');
          return;
        }
        // A light inner aperture effect complements the much stronger block
        // movement. Keep hands legible rather than enlarging the crop further.
        const inner = Math.min(22, height * .07);
        const imageTop = rect.top + range + drift;
        const progress = clamp((innerHeight - imageTop) / Math.max(1, innerHeight + height), 0, 1);
        set(aperture, '--photo-plane-height', `${(height + 2 * inner).toFixed(3)}px`);
        set(aperture, '--photo-offset', `${(-2 * inner * progress).toFixed(3)}px`);
      });
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(paint); }
    function preference(event) {
      paused = typeof event?.detail?.stopped === 'boolean' ? event.detail.stopped : root.classList.contains('cma-motion-paused');
      schedule();
    }
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    items.forEach(({ slot }) => observer?.observe(slot));
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
