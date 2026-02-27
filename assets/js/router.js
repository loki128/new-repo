--- FILE: /assets/js/router.js ---
// Minimal router for fade+slide page transitions, progressive enhancement friendly

(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ajaxNavigate(url, addHistory=true){
    return fetch(url, {headers:{'X-Requested-With':'Fetch'}}).then(r=>r.text()).then(html=>{
      const parser = new DOMParser(); const doc = parser.parseFromString(html,'text/html');
      const newMain = doc.querySelector('main'); const main = document.querySelector('main');
      if(!newMain || !main) { window.location = url; return; }
      if(!prefersReduced){ document.body.classList.add('page-exit'); }
      setTimeout(()=>{
        main.innerHTML = newMain.innerHTML;
        if(!prefersReduced){ document.body.classList.remove('page-exit'); document.body.classList.add('page-enter'); setTimeout(()=>document.body.classList.remove('page-enter'),300); }
        if(addHistory) history.pushState({url},'',url);
        document.documentElement.scrollTop = 0; document.body.focus();
        // re-init motions
        if(window.DDMotion) { window.DDMotion.heroEntrance(document); window.DDMotion.setupReveal(document,'.reveal'); }
      }, prefersReduced?0:260);
    }).catch(()=>{ window.location = url; });
  }

  document.addEventListener('click', e=>{
    const a = e.target.closest('a'); if(!a) return; const href = a.getAttribute('href'); if(!href || href.startsWith('http') || a.hasAttribute('data-no-ajax')) return; e.preventDefault(); ajaxNavigate(href, true);
  });

  window.addEventListener('popstate', e=>{ const state = e.state; const url = (state && state.url) || location.pathname; ajaxNavigate(url,false); });
})();