--- FILE: /assets/js/product.js ---
// product.js — product page interactions: tabs, cart modal, charts

(function(){
  function $(sel, ctx=document){ return ctx.querySelector(sel); }
  function $all(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }

  document.addEventListener('DOMContentLoaded', ()=>{
    $all('.tab').forEach(btn=> btn.addEventListener('click', ()=>{
      const panels = $all('.panel'); panels.forEach(p=>p.hidden=true);
      $all('.tab').forEach(t=>t.classList.remove('active'));
      const target = btn.dataset.tab; $("#"+target).hidden=false; btn.classList.add('active');
    }));

    // open cart modal
    const addBtn = $('#addBtn'); const cartModal = $('#cartModal'); const closeCart = $('#closeCart');
    if(addBtn){ addBtn.addEventListener('click', ()=>{ cartModal.hidden=false; cartModal.querySelector('.modal-panel').focus(); }); }
    if(closeCart){ closeCart.addEventListener('click', ()=>{ cartModal.hidden=true; }); }

    // lab modal placeholder
    const openLab = $('#openLab'); if(openLab){ openLab.addEventListener('click', ()=>{ alert('Lab report lightbox placeholder.'); }); }

    // radial chart
    const cvs = $('#radialProtein'); if(cvs && window.DDCharts){ window.DDCharts.drawRadial(cvs, 80); const val = $('#radialVal'); window.DDCharts.animateValue(val, 0, 24, 900); }
  });
})();