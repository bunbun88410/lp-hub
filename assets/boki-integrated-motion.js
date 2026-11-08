/* 本番CMAと同じ停止イベント/OS設定で、流れの線と写真を一括制御。 */
(() => {
  'use strict';
  const root=document.documentElement;
  const button=document.querySelector('.motion-switch');
  const hero=document.querySelector('.hero');
  const headings=[...document.querySelectorAll('.intro-title[data-boki-ink],.section-head h2[data-boki-ink]')];
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=false,frame=0;
  const stopped=()=>paused||media.matches;
  function paint(){
    frame=0;
    if(hero){const travel=Math.max(0,Math.min(36,-hero.getBoundingClientRect().top*.12));hero.style.setProperty('--hero-shift',stopped()?'0px':travel.toFixed(3)+'px');}
    // CMAのdata-inkと同じ、読む位置で文字を濃くする進行。逆スクロールでも復元する。
    headings.forEach(heading=>{
      const p=stopped()?1:Math.max(0,Math.min(1,(innerHeight*.85-heading.getBoundingClientRect().top)/Math.max(1,innerHeight*.55)));
      const start=[111,134,145],end=[15,44,68];
      heading.style.setProperty('--boki-ink','rgb('+start.map((v,i)=>Math.round(v+(end[i]-v)*p)).join(',')+')');
      heading.style.setProperty('--boki-heading-y',((1-p)*20).toFixed(3)+'px');
    });
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
  function sync(){
    const off=stopped();root.classList.toggle('boki-motion-paused',off);root.dataset.motionState=off?'paused':'scroll';
    if(button){button.setAttribute('aria-pressed',String(off));button.setAttribute('aria-label',media.matches?'動きを控えた表示':off?'動きを再開':'動きを停止');button.disabled=media.matches;button.innerHTML='<span aria-hidden="true">'+(off?'▶':'Ⅱ')+'</span>';}
    document.dispatchEvent(new CustomEvent('boki:motion-preference',{detail:{stopped:off}}));schedule();
  }
  button?.addEventListener('click',()=>{paused=!paused;sync();});
  media.addEventListener('change',sync);
  addEventListener('scroll',()=>{if(!stopped())schedule();},{passive:true});
  addEventListener('resize',schedule,{passive:true});addEventListener('load',schedule,{once:true});
  document.fonts?.ready.then(schedule).catch(()=>{});
  sync();
})();
