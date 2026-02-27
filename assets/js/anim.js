--- FILE: /assets/js/anim.js ---
// anim.js — motion orchestration for Dr. Dan Protein Powder
// Lightweight, vanilla JS, respects prefers-reduced-motion

(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tokens = { fast:120, mid:250, slow:400, stagger:70, ease:'cubic-bezier(0.2,0.8,0.2,1)'};

  function animate(el, keyframes, options={}){
    if (!el) return null;
    if (prefersReduced) return instant(el, keyframes);
    try{
      return el.animate(keyframes, Object.assign({duration:tokens.mid,easing:tokens.ease,fill:'forwards'},options));
    }catch(e){ instant(el,keyframes); return null; }
  }
  function instant(el,keyframes){ const last=keyframes[keyframes.length-1]; Object.assign(el.style,last); }

  function heroEntrance(root=document){
    const hero = root.querySelector('.hero'); if(!hero) return;
    const elems = hero.querySelectorAll('.hero-fade'); elems.forEach((el,i)=>{ el.style.opacity=0; el.style.transform='translateY(10px)'; setTimeout(()=> animate(el,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:tokens.slow,easing:tokens.ease}), i*tokens.stagger); });
  }

  function setupReveal(root=document, selector='.reveal'){
    if(prefersReduced){ document.querySelectorAll(selector).forEach(el=>{ el.style.opacity=1; el.style.transform='none'; }); return; }
    const io = new IntersectionObserver((entries, obs)=>{ entries.forEach(ent=>{ if(ent.isIntersecting){ const el=ent.target; el.classList.add('is-visible'); animate(el,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:tokens.mid}); obs.unobserve(el);} }); },{threshold:0.12});
    document.querySelectorAll(selector).forEach(el=>{ el.style.opacity=0; el.style.transform='translateY(12px)'; io.observe(el); });
  }

  function bindButtonPress(root=document){
    root.addEventListener('pointerdown',e=>{ const btn = e.target.closest('button, .btn'); if(!btn) return; btn.style.transition='transform 120ms '+tokens.ease; btn.style.transform='scale(0.98)'; });
    root.addEventListener('pointerup',e=>{ const btn = e.target.closest('button, .btn'); if(!btn) return; btn.style.transform='scale(1)'; });
    root.addEventListener('pointerleave',e=>{ const btn = e.target.closest('button, .btn'); if(!btn) return; btn.style.transform='scale(1)'; });
  }

  window.DDMotion = { tokens, animate, heroEntrance, setupReveal, bindButtonPress };
  document.addEventListener('DOMContentLoaded', ()=>{ window.DDMotion.heroEntrance(); window.DDMotion.setupReveal(document,'.reveal'); window.DDMotion.bindButtonPress(document); });
})();