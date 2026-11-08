(() => {
  'use strict';
  const menu=document.querySelector('.menu-button');
  const nav=document.getElementById('site-nav');
  const close=()=>{nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','メニューを開く');};
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('is-open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  // 現行LPと同じ入口の優先順位・保存キーを引き継ぐ。
  const params=new URLSearchParams(location.search);
  const clean=s=>(s||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,60);
  function readReferrer(){
    try{
      if(!document.referrer)return '';
      const h=new URL(document.referrer).hostname.toLowerCase().replace(/^www\./,'');
      if(h===location.hostname.toLowerCase().replace(/^www\./,'')||/(^|\.)sujilab\.net$/.test(h))return '';
      const rules=[[/^t\.co$/,'x-tco'],[/(^|\.)(x|twitter)\.com$/,'x-web'],[/(^|\.)(youtube\.com|youtu\.be)$/,'youtube'],[/(^|\.)(line\.me|lin\.ee)$/,'line'],[/(^|\.)ukkarihachibee\.com$/,'blog'],[/(^|\.)note\.com$/,'note'],[/(^|\.)google\.[a-z.]+$/,'google'],[/(^|\.)yahoo\.(co\.jp|com)$/,'yahoo'],[/(^|\.)bing\.com$/,'bing'],[/(^|\.)(chatgpt\.com|openai\.com)$/,'chatgpt'],[/(^|\.)amazon\.(co\.jp|com)$/,'kindle']];
      return rules.find(([pattern])=>pattern.test(h))?.[1]||clean('ref-'+h.replace(/\./g,'_'));
    }catch(_){return '';}
  }
  let ref=params.get('utm_source')?clean([params.get('utm_source'),params.get('utm_medium')].filter(Boolean).join('-')):readReferrer();
  try{if(ref)sessionStorage.setItem('entry_ref',ref);else ref=clean(sessionStorage.getItem('entry_ref'));}catch(_){}
  document.querySelectorAll('.payment-link').forEach(a=>{const u=new URL(a.href);if(ref)u.searchParams.set('client_reference_id',ref);a.href=u.toString();});
  // LINEへの内部ページで入口をlpに上書きしないよう、流入UTMと希望級を引き継ぐ。
  document.querySelectorAll('a[data-grade][href*="sujilab.net/boki"]').forEach(a=>{
    const u=new URL(a.href);
    if(params.get('utm_source')){for(const key of ['utm_source','utm_medium','utm_campaign','utm_content']){if(params.has(key))u.searchParams.set(key,params.get(key));else u.searchParams.delete(key);}}
    u.searchParams.set('grade',a.dataset.grade);
    a.href=u.toString();
  });
  const production=/(^|\.)sujilab\.net$/.test(location.hostname);
  function event(name,fields){if(production&&typeof window.gtag==='function')window.gtag('event',name,fields);}
  document.querySelectorAll('.payment-link').forEach(a=>a.addEventListener('click',()=>event('boki_checkout_click',{grade:a.dataset.grade,plan:a.dataset.plan,entry_ref:ref||'direct'})));
  document.querySelectorAll('a[data-grade]:not(.payment-link)').forEach(a=>a.addEventListener('click',()=>event('boki_consult_click',{grade:a.dataset.grade,entry_ref:ref||'direct'})));
  document.querySelectorAll('a.grade-link').forEach(a=>a.addEventListener('click',()=>event('boki_grade_select',{grade:'boki'+a.hash.slice(-1),entry_ref:ref||'direct'})));
})();
