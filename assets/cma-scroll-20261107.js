/* 説明用の操作デモ。AIへの問い合わせや入力内容の送信は行わない。 */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const demo = document.querySelector('.experience[data-step]');
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

  reduced.addEventListener('change', () => { if (reduced.matches) activeAnimations.forEach(a=>a.cancel()); });
  document.addEventListener('cma:motion-preference', event => { if (event.detail.stopped) activeAnimations.forEach(a=>a.cancel()); });
})();

/* 現在位置から再計算する。初回だけの監視解除/スマホでの連動解除はしない。 */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const hero = document.querySelector('.hero-story');
  const switcher = document.querySelector('.motion-switch');
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const moving = [...document.querySelectorAll('.section-head,.step,.course,.coaching,.consult')];
  const editorial = document.querySelector('.editorial');
  const inks = [...document.querySelectorAll('[data-ink]')];
  const sample = document.querySelector('.sample-section');
  const sampleSpace = document.querySelector('.sample-window-space');
  const courses = [...document.querySelectorAll('.course')];
  const learning = document.querySelector('.learning-column');
  const graphDot = document.querySelector('.graph-dot');
  const graphHalo = document.querySelector('.graph-dot-halo');
  const graphLabel = document.querySelector('.graph-compound-label');
  const graphPath = document.querySelector('.graph-curve');
  const graphLength = graphPath?.getTotalLength?.()||0;
  const previousY = new WeakMap();
  let paused = false, frame = 0;
  const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
  const stopped = () => paused || reduced.matches;
  function paint() {
    frame = 0;
    const vh = innerHeight;
    root.style.setProperty('--page-progress',String(clamp(scrollY / Math.max(1,root.scrollHeight-vh))));
    if (stopped()) return;
    scenes.forEach(scene => {
      const r=scene.getBoundingClientRect();
      const p=clamp((vh-r.top)/(vh+r.height));
      scene.style.setProperty('--section-progress',p.toFixed(4));
      scene.dataset.scrollProgress=p.toFixed(4);
    });
    if(hero){
      const r=hero.getBoundingClientRect();
      const travel=innerWidth>900 ? Math.max(1,r.height-vh) : Math.max(1,r.height*.58);
      const p=clamp(-r.top/travel);
      const curve=.55+.45*clamp(p*1.4);
      hero.style.setProperty('--hero-progress',p.toFixed(4));
      hero.style.setProperty('--curve-progress',curve.toFixed(4));
      hero.dataset.heroProgress=p.toFixed(4);
      // 教材S04の同一模式図上の点。表示は投資実績ではない。
      const u=curve;
      const point=graphLength&&graphPath.getPointAtLength?graphPath.getPointAtLength(curve*graphLength):{x:90+770*u,y:620-500*(.1*Math.exp(Math.log(10)*u))};
      const {x,y}=point;
      for(const dot of [graphDot,graphHalo])if(dot){dot.setAttribute('cx',x.toFixed(2));dot.setAttribute('cy',y.toFixed(2));}
      if(graphLabel){graphLabel.setAttribute('x',(x+27).toFixed(2));graphLabel.setAttribute('y',(y-27).toFixed(2));}
    }
    if(editorial){
      const r=editorial.getBoundingClientRect();
      const p=clamp((vh*.85-r.top)/Math.max(vh*.55,r.height*.75));
      inks.forEach((ink,i)=>{
        const a=clamp(p*2.1-i/inks.length);
        const start=[111,134,111],end=[21,47,43];
        ink.style.setProperty('--ink-color','rgb('+start.map((v,j)=>Math.round(v+(end[j]-v)*a)).join(',')+')');
        ink.dataset.inkProgress=a.toFixed(3);
      });
    }
    if(sample){
      const r=(sampleSpace||sample).getBoundingClientRect();
      const p=clamp((vh*.95-r.top)/(vh*.75));
      sample.style.setProperty('--window-scale',(.87+.13*p).toFixed(4));
    }
    if(learning){
      const r=learning.getBoundingClientRect();
      const p=clamp((vh*.72-r.top)/Math.max(1,r.height));
      learning.style.setProperty('--flow-progress',p.toFixed(4));
      learning.dataset.flowProgress=p.toFixed(4);
    }
    moving.forEach((element,i)=>{
      const measured=element.getBoundingClientRect();
      const offset=previousY.get(element)||0;
      const r={top:measured.top-offset,bottom:measured.bottom-offset,height:measured.height};
      const arrival=clamp((vh*.98-r.top)/(vh*.42));
      const departure=clamp((r.bottom+30)/(vh*.2));
      const visible=Math.min(arrival,departure);
      const amount=element.classList.contains('course')?70+(i%3)*23:32;
      const courseIndex=courses.indexOf(element);
      const pass=clamp((vh-r.top)/(vh+r.height));
      const drift=courseIndex<0?0:(pass-.5)*(innerWidth>900?[70,0,-70][courseIndex]:24*(courseIndex%2?1:-1));
      const y=(1-arrival)*amount+drift;
      element.style.setProperty('--reveal-y',y.toFixed(2)+'px');
      previousY.set(element,y);
      element.style.setProperty('--reveal-opacity',(.55+.45*visible).toFixed(3));
      element.dataset.revealProgress=arrival.toFixed(4);
    });
  }
  const schedule = () => {if(!frame)frame=requestAnimationFrame(paint);};
  function sync(){
    root.classList.toggle('cma-motion-paused',stopped());
    root.dataset.motionState=stopped()?'paused':'scroll';
    if(switcher){
      switcher.setAttribute('aria-pressed',String(stopped()));
      switcher.setAttribute('aria-label',stopped()?'動きを再開':'動きを停止');
      switcher.innerHTML='<span aria-hidden="true">'+(stopped()?'▶':'Ⅱ')+'</span>';
      switcher.disabled=reduced.matches;
      if(reduced.matches)switcher.setAttribute('aria-label','動きを控えた表示');
    }
    document.dispatchEvent(new CustomEvent('cma:motion-preference',{detail:{stopped:stopped()}}));
    if(!stopped())schedule();
  }
  switcher?.addEventListener('click',()=>{paused=!paused;sync();});
  reduced.addEventListener('change',sync);
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule);
  addEventListener('load',schedule,{once:true});
  document.fonts?.ready.then(schedule);
  const disclosure=document.querySelector('#experience');
  function openHash(){if(location.hash==='#experience'&&disclosure)disclosure.open=true;schedule();}
  addEventListener('hashchange',openHash);
  document.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',schedule));
  document.querySelectorAll('a[href="#experience"]').forEach(a=>a.addEventListener('click',()=>{if(disclosure)disclosure.open=true;}));
  openHash();sync();
})();
