(() => {
  'use strict';

  // The hero is deliberately outside this module. These two effects follow
  // ZB's FlowScatteredLine / GrowWindowMotion, using CMA's actual content.
  function init() {
    const journey = document.querySelector('#support .learning-column');
    const svg = journey?.querySelector(':scope > .zb-flow-svg');
    const steps = journey ? [...journey.querySelectorAll(':scope > .learning > .step')] : [];
    const openings = [...document.querySelectorAll('.zb-opening')];
    if ((!svg || steps.length < 2) && !openings.length) return;

    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.documentElement;
    let motionStopped = root.classList.contains('boki-motion-paused');
    let frame = 0;
    let needsMeasure = true;
    let routes = [];
    const lines = [];
    const cutouts = [];
    const ns = 'http://www.w3.org/2000/svg';
    const clamp = value => Math.max(0, Math.min(1, value));
    const stopped = () => motionStopped || media.matches;
    const setStyle = (element, property, value) => {
      if (element.style.getPropertyValue(property) !== value) element.style.setProperty(property, value);
    };
    const make = (tag, attributes = {}) => {
      const element = document.createElementNS(ns, tag);
      Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
      return element;
    };

    // Summed layout offsets exclude reveal transforms and remain stable while
    // the line is drawn. Only the number's glyph width needs a visual measure.
    const position = element => {
      let x = 0;
      let y = 0;
      let node = element;
      while (node) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
      }
      return { x, y };
    };
    const numberCenter = number => {
      const point = position(number);
      let offset = number.offsetWidth / 2;
      if (document.createRange && number.textContent.trim()) {
        const range = document.createRange();
        range.selectNodeContents(number);
        const glyph = range.getBoundingClientRect();
        const box = number.getBoundingClientRect();
        if (glyph.width > 0) offset = glyph.left - box.left + glyph.width / 2;
        range.detach?.();
      }
      return { ...point, x: point.x + offset };
    };

    let mask;
    let maskBase;
    if (svg && steps.length >= 2) {
      let suffix = 1;
      while (document.getElementById(`boki-integrated-flow-mask-${suffix}`)) suffix += 1;
      const maskId = `boki-integrated-flow-mask-${suffix}`;
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.setAttribute('preserveAspectRatio', 'none');
      const defs = make('defs');
      mask = make('mask', { id: maskId, maskUnits: 'userSpaceOnUse', maskContentUnits: 'userSpaceOnUse' });
      maskBase = make('rect', { x: 0, y: 0, fill: 'white' });
      mask.append(maskBase);
      defs.append(mask);
      const group = make('g', { mask: `url(#${maskId})` });
      steps.slice(0, -1).forEach(() => {
        const line = make('path', { class: 'zb-flow-connector', pathLength: 1, fill: 'none', 'vector-effect': 'non-scaling-stroke' });
        group.append(line);
        lines.push(line);
      });
      // ZB cuts out its vertical copy. CMA also has real lesson images and
      // explanation cards, so both text and visual areas are protected.
      steps.forEach(step => {
        step.querySelectorAll('.step-copy > :not(.step-number), .step-visual').forEach(element => {
          const rect = make('rect', { fill: 'black' });
          mask.append(rect);
          cutouts.push({ element, rect });
        });
      });
      svg.append(defs, group);
    }

    function measureFlow() {
      if (!svg || !lines.length) return;
      const origin = position(journey);
      const width = journey.clientWidth;
      const height = journey.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${Math.max(1, width)} ${Math.max(1, height)}`);
      mask.setAttribute('x', '0');
      mask.setAttribute('y', '0');
      mask.setAttribute('width', String(width));
      mask.setAttribute('height', String(height));
      maskBase.setAttribute('width', String(width));
      maskBase.setAttribute('height', String(height));
      const mobile = innerWidth <= 760;
      const anchors = steps.map(step => {
        const number = step.querySelector('.step-number');
        const box = position(step);
        const point = number ? numberCenter(number) : box;
        const copy = step.querySelector('.step-copy');
        const visual = step.querySelector('.step-visual');
        return {
          x: point.x - origin.x,
          top: box.y - origin.y,
          bottom: box.y - origin.y + step.offsetHeight,
          numberBottom: point.y - origin.y + (number?.offsetHeight || 0),
          contentLeft: Math.min(copy ? position(copy).x : point.x, visual ? position(visual).x : point.x) - origin.x,
        };
      });
      lines.forEach((line, index) => {
        const from = anchors[index];
        const to = anchors[index + 1];
        // A narrow fallback keeps the connector usable if content expansion
        // consumes the desktop gap; it never changes the content's position.
        const gutterRoute = mobile || to.top - from.bottom <= 28;
        const start = (gutterRoute ? from.numberBottom : from.bottom) + 12;
        const end = Math.max(start + 1, to.top - (gutterRoute ? 10 : 14));
        const span = end - start;
        let path;
        if (gutterRoute) {
          const reach = Math.min(34, Math.max(24, span * .2));
          const gutterRight = Math.max(12, Math.min(from.contentLeft, to.contentLeft) - 16);
          // CMA's mobile visuals sit below the copy: alternate two lanes in
          // the reserved left gutter rather than crossing a lesson image.
          const bow = index % 2 === 0 ? Math.max(8, gutterRight - reach) : gutterRight;
          const middle = (start + end) / 2;
          const shoulder = span * .22;
          path = `M ${from.x} ${start} C ${from.x} ${start + shoulder}, ${bow} ${start + shoulder}, ${bow} ${middle} C ${bow} ${end - shoulder}, ${to.x} ${end - shoulder}, ${to.x} ${end}`;
        } else {
          const bend = span * .65;
          path = `M ${from.x} ${start} C ${from.x} ${start + bend}, ${to.x} ${end - bend}, ${to.x} ${end}`;
        }
        line.setAttribute('d', path);
      });
      routes = anchors.slice(0, -1).map((from, index) => ({
        start: from.top + (from.bottom - from.top) * .5,
        end: anchors[index + 1].top + (anchors[index + 1].bottom - anchors[index + 1].top) * .35,
      }));
      cutouts.forEach(({ element, rect }) => {
        const point = position(element);
        const padding = 12;
        rect.setAttribute('x', String(point.x - origin.x - padding));
        rect.setAttribute('y', String(point.y - origin.y - padding));
        rect.setAttribute('width', String(element.offsetWidth + padding * 2));
        rect.setAttribute('height', String(element.offsetHeight + padding * 2));
      });
    }

    function paintFlow(isStopped) {
      if (!svg || !lines.length) return;
      const readingPosition = innerHeight * .72 - journey.getBoundingClientRect().top;
      lines.forEach((line, index) => {
        const route = routes[index];
        if (!route) return;
        const progress = isStopped ? 1 : clamp((readingPosition - route.start) / Math.max(1, route.end - route.start));
        setStyle(line, '--zb-line-progress', progress.toFixed(4));
      });
    }

    function paintOpenings(isStopped) {
      openings.forEach(opening => {
        opening.dataset.zbMotion = isStopped ? 'static' : 'scroll';
        setStyle(opening, '--zb-viewport-height', isStopped ? '100%' : `${innerHeight}px`);
        if (isStopped) {
          setStyle(opening, '--zb-photo-offset', '0px');
          return;
        }
        const rect = opening.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        // opening.top + photo offset = 0: the aperture moves over a photo
        // plane that stays in the same viewport position, including mobile.
        setStyle(opening, '--zb-photo-offset', `${-rect.top}px`);
      });
    }

    function paint() {
      frame = 0;
      if (needsMeasure) {
        needsMeasure = false;
        measureFlow();
      }
      const isStopped = stopped();
      paintFlow(isStopped);
      paintOpenings(isStopped);
    }
    function scheduleMeasure() {
      needsMeasure = true;
      if (!frame) frame = requestAnimationFrame(paint);
    }
    function scheduleProgress() {
      if (!stopped() && !frame) frame = requestAnimationFrame(paint);
    }
    function syncPreference(event) {
      if (typeof event?.detail?.stopped === 'boolean') motionStopped = event.detail.stopped;
      else motionStopped = root.classList.contains('boki-motion-paused');
      scheduleMeasure();
    }

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleMeasure) : null;
    [journey, ...steps, ...cutouts.map(item => item.element), ...openings].filter(Boolean).forEach(element => observer?.observe(element));
    if (typeof IntersectionObserver === 'function') {
      const intersection = new IntersectionObserver(scheduleProgress);
      openings.forEach(opening => intersection.observe(opening));
    }
    addEventListener('scroll', scheduleProgress, { passive: true });
    addEventListener('resize', scheduleMeasure, { passive: true });
    addEventListener('load', scheduleMeasure, { once: true });
    document.addEventListener('toggle', scheduleMeasure, true);
    document.addEventListener('boki:motion-preference', syncPreference);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleProgress(); });
    media.addEventListener('change', syncPreference);
    document.fonts?.ready.then(scheduleMeasure).catch(() => {});
    document.querySelectorAll('#support img, .zb-opening img').forEach(image => image.addEventListener('load', scheduleMeasure, { once: true }));
    scheduleMeasure();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
