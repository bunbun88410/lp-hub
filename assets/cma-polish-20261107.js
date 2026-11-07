/* 説明用の操作デモ。AIへの問い合わせや入力内容の送信は行わない。 */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const demo = document.querySelector('#experience');
  const mobileMenu = document.querySelector('.mobile-nav');
  const activeAnimations = new Set();

  function animate(element, frames, options) {
    if (reduced.matches || document.documentElement.classList.contains('cma-motion-paused') || !element || !element.animate) return;
    const animation = element.animate(frames, options);
    activeAnimations.add(animation);
    animation.finished.then(() => activeAnimations.delete(animation)).catch(() => activeAnimations.delete(animation));
  }

  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { mobileMenu.open = false; }));
    mobileMenu.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        mobileMenu.open = false;
        mobileMenu.querySelector('summary').focus();
      }
    });
  }

  if (demo) {
    const steps = [...demo.querySelectorAll('[data-demo-step]')];
    const play = demo.querySelector('.demo-play');
    const status = demo.querySelector('.demo-status');
    const descriptions = [
      '01 講義を一時停止。わからなくなった場面で「この講義について質問する」を開きます。',
      '02 質問パネルを開きました。「複利はなぜ加速するの？」を選んでみてください。',
      '03 質問例を選び、説明を読んで確かめます。表示中の回答は説明用の例です。'
    ];
    let timer = null;
    let playing = false;
    let step = 0;

    function stop() {
      playing = false;
      window.clearTimeout(timer);
      timer = null;
      play.setAttribute('aria-pressed', 'false');
      play.innerHTML = reduced.matches ? '手順を選んで確認' : '流れを再生 <span aria-hidden="true">▶</span>';
    }

    function setStep(next, manual = false) {
      if (manual) stop();
      step = Math.max(0, Math.min(2, next));
      demo.dataset.step = String(step);
      steps.forEach((button, index) => {
        if (index === step) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      status.textContent = descriptions[step];
      const target = demo.querySelector(step === 0 ? '.demo-waiting' : step === 1 ? '.demo-chat-content' : '.demo-answer');
      animate(target, [{ opacity: .75, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 280, easing: 'cubic-bezier(.2,.75,.25,1)' });
    }

    demo.addEventListener('cma:scroll-step', event => {
      stop();
      setStep(event.detail.step);
    });

    function advance() {
      if (!playing) return;
      if (step >= 2) { stop(); return; }
      setStep(step + 1);
      timer = window.setTimeout(advance, step === 2 ? 7000 : 4500);
    }

    steps.forEach(button => button.addEventListener('click', () => setStep(Number(button.dataset.demoStep), true)));
    demo.querySelector('.demo-question-open').addEventListener('click', () => setStep(1, true));
    demo.querySelector('.demo-chip').addEventListener('click', () => setStep(2, true));
    play.addEventListener('click', () => {
      if (playing) { stop(); return; }
      if (reduced.matches) return;
      setStep(0);
      playing = true;
      play.setAttribute('aria-pressed', 'true');
      play.innerHTML = 'デモを停止 <span aria-hidden="true">Ⅱ</span>';
      timer = window.setTimeout(advance, 4000);
    });

    function syncMotionPreference() {
      stop();
      play.disabled = reduced.matches;
      if (reduced.matches) {
        play.textContent = '手順を選んで確認';
        setStep(2);
      }
    }

    // JavaScriptなしでは回答例を静的に表示。初期化成功後だけ切り替え表示にする。
    demo.classList.add('demo-ready');
    setStep(reduced.matches ? 2 : 0);
    syncMotionPreference();
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    if ('IntersectionObserver' in window) {
      const view = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) stop();
      }, { threshold: 0 });
      view.observe(demo);
    }
    reduced.addEventListener('change', syncMotionPreference);
    document.addEventListener('cma:motion-preference', event => {
      stop();
      play.disabled = event.detail.stopped;
      if (event.detail.stopped) play.textContent = '手順を選んで確認';
    });
  }

  // 主要情報を隠さず、表示された時に一度だけ短く動かす。
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animate(entry.target,
          [{ opacity: .3 }, { opacity: 1 }],
          { duration: 800, easing: 'cubic-bezier(.2,.75,.25,1)' });
        reveal.unobserve(entry.target);
      });
    }, { threshold: .08 });
    document.querySelectorAll('.section-head,.step,.experience-top').forEach(element => reveal.observe(element));
    const cards = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animate(entry.target, [{ opacity: .3 }, { opacity: 1 }], { duration: 800, easing: 'cubic-bezier(.2,.75,.25,1)' });
        cards.unobserve(entry.target);
      });
    }, { threshold: .08 });
    document.querySelectorAll('.course').forEach(element => cards.observe(element));
    const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
    const current = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (!visible.length) return;
      const id = visible[0].target.id;
      navLinks.forEach(link => {
        if (link.getAttribute('href') === '#' + id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-12% 0px -60% 0px', threshold: 0 });
    ['learning','courses','faq','consult'].forEach(id => { const section = document.getElementById(id); if (section) current.observe(section); });
  }

  reduced.addEventListener('change', () => {
    if (reduced.matches) activeAnimations.forEach(animation => animation.cancel());
  });
  document.addEventListener('cma:motion-preference', event => {
    if (event.detail.stopped) activeAnimations.forEach(animation => animation.cancel());
  });
})();
