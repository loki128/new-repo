// overlay.js — universal caret-anchored ghost suggestion overlay (no editor coupling)
(function(){
  const ID='cal-ghost';
  function ensure(){
    let el=document.getElementById(ID);
    if(el) return el;
    el=document.createElement('div');
    el.id=ID;
    el.className='cal-ghost';
    el.style.display='none';
    document.documentElement.appendChild(el);
    return el;
  }
  function caretRect(){
    const sel=window.getSelection();
    if(sel && sel.rangeCount){
      const r=sel.getRangeAt(0).cloneRange();
      r.collapse(true);
      const rect=r.getClientRects()[0];
      if(rect) return rect;
    }
    const ae=document.activeElement; const rb= ae?.getBoundingClientRect?.()||{left:40,top:40};
    return { left: rb.left, top: rb.top };
  }
  function show(text){
    const el=ensure();
    el.textContent=text;
    const r=caretRect();
    el.style.left=(r.left+window.scrollX+8)+'px';
    el.style.top=(r.top+window.scrollY+18)+'px';
    el.style.display='block';
  }
  function hide(){ const el=document.getElementById(ID); if(el) el.style.display='none'; }
  function text(){ const el=document.getElementById(ID); return el?el.textContent:''; }
  window.__CAL_OVERLAY__={ show, hide, text };
})();