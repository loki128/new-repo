// content.js — detects editors, tracks cursor, overlays ghost text, toolbar actions, keyboard shortcuts
(function(){
  const DEBOUNCE_MS = 160;
  let debounceTimer = null;
  let overlay = null;
  let toolbar = null;

  const UI = {
    ensureOverlay(){
      if (overlay) return overlay;
      overlay = document.createElement('div');
      overlay.id = 'calp-ghost';
      overlay.className = 'calp-ghost';
      overlay.style.display = 'none';
      document.body.appendChild(overlay);
      return overlay;
    },
    ensureToolbar(){
      if (toolbar) return toolbar;
      toolbar = document.createElement('div');
      toolbar.id = 'calp-toolbar';
      toolbar.className = 'calp-toolbar';
      toolbar.innerHTML = `
        <button data-act="explain" title="Explain (Ctrl+Shift+E)">Explain</button>
        <button data-act="refactor" title="Refactor (Ctrl+Shift+R)">Refactor</button>
        <button data-act="tests" title="Generate Tests (Ctrl+Shift+T)">Tests</button>
      `;
      document.body.appendChild(toolbar);
      toolbar.addEventListener('click', (e)=>{
        const b = e.target.closest('button'); if(!b) return;
        const act = b.getAttribute('data-act');
        triggerSuggest(true, act);
      });
      return toolbar;
    },
    positionNearCaret(el){
      const r = getCaretRect();
      el.style.left = (r.left + window.scrollX + 8) + 'px';
      el.style.top = (r.top + window.scrollY + 18) + 'px';
    }
  };

  function detectKnownEditors(){
    // Monaco
    const monaco = document.querySelector('.monaco-editor, .view-lines');
    if (monaco) return monaco;
    // CodeMirror 6
    const cm6 = document.querySelector('.cm-content, .cm-editor');
    if (cm6) return cm6;
    // CodeMirror 5
    const cm5 = document.querySelector('.CodeMirror, .CodeMirror-code');
    if (cm5) return cm5;
    // Ace
    const ace = document.querySelector('.ace_editor, .ace_content');
    if (ace) return ace;
    return null;
  }

  function activeEditor(){
    // layered detection: activeElement, known editors, then generic
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT' || ae.isContentEditable)) return ae;
    const known = detectKnownEditors(); if (known) return known;
    // generic best-effort
    const anyEditable = document.querySelector('textarea, input[type="text"], [contenteditable="true"]');
    return anyEditable || document.body;
  }

  function getContext(){
    const ed = activeEditor(); if(!ed) return '';
    if (ed.tagName === 'TEXTAREA' || ed.tagName === 'INPUT'){
      const val = ed.value || ''; const pos = ed.selectionStart || val.length; return val.slice(Math.max(0,pos-240), pos);
    }
    const sel = window.getSelection(); if (sel && sel.anchorNode){ const t = sel.anchorNode.textContent||''; return t.slice(0, 240); }
    return '';
  }

  function getCaretRect(){
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0).cloneRange();
      range.collapse(true);
      const rect = range.getClientRects()[0];
      if (rect) return rect;
    }
    // fallback near active element
    const ed = activeEditor();
    const r = ed?.getBoundingClientRect?.() || { left: 40, top: 40 };
    return { left: r.left, top: r.top };
  }

  function showGhost(text){
    const el = UI.ensureOverlay();
    el.textContent = text;
    UI.positionNearCaret(el);
    el.style.display = 'block';
  }
  function hideGhost(){ if(overlay) overlay.style.display = 'none'; }

  async function request(kind){
    const ctx = getContext();
    const type = kind === 'explain' ? 'REQUEST_EXPLAIN' : kind === 'refactor' ? 'REQUEST_REFACTOR' : kind === 'tests' ? 'REQUEST_TESTS' : 'REQUEST_SUGGEST';
    try{
      const r = await chrome.runtime.sendMessage({ type, context: ctx });
      return r;
    }catch(e){ return { error: 'msg_fail', detail: String(e) }; }
  }

  async function triggerSuggest(manual=false, kind=''){
    const ed = activeEditor(); if(!ed) return;
    const ctx = getContext(); if(!manual && ctx.trim().length < 1) return;
    const r = await request(kind);
    if (r && r.suggestion) { showGhost(r.suggestion); }
  }

  function acceptSuggestion(){
    const ed = activeEditor(); if(!ed || !overlay || overlay.style.display==='none') return;
    const s = overlay.textContent || '';
    if (ed.tagName === 'TEXTAREA' || ed.tagName === 'INPUT'){
      const pos = ed.selectionStart || ed.value.length; ed.setRangeText(s, pos, pos); ed.focus();
    } else {
      const sel = window.getSelection(); if(sel && sel.anchorNode){ sel.anchorNode.textContent = (sel.anchorNode.textContent||'') + s; }
    }
    hideGhost();
  }

  function bindKeys(){
    window.addEventListener('keydown', (e)=>{
      if (e.ctrlKey && e.code === 'Space') { e.preventDefault(); sessionAllowed = true; triggerSuggest(true); }
      if (e.key === 'Tab') { if (overlay && overlay.style.display !== 'none') { e.preventDefault(); acceptSuggestion(); } }
      if (e.key === 'Escape') { if (overlay && overlay.style.display !== 'none') { hideGhost(); } }
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyE') { e.preventDefault(); triggerSuggest(true, 'explain'); }
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyR') { e.preventDefault(); triggerSuggest(true, 'refactor'); }
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyT') { e.preventDefault(); triggerSuggest(true, 'tests'); }
    }, {capture:true});
  }

  let sessionAllowed = false;
  async function siteAllowed(){
    if (sessionAllowed) return true;
    return new Promise((resolve)=>{
      chrome.storage.local.get(['calp_allow','calp_deny'], (res)=>{
        const host = location.hostname||'';
        const deny = res.calp_deny||[]; if(deny.includes(host)) return resolve(false);
        const allow = res.calp_allow||[]; resolve(allow.includes(host));
      });
    });
  }

  async function init(){
    if (!(await siteAllowed())) {
      // require user activation via popup allow button or Ctrl+Space
      bindKeys();
      return; 
    }
    UI.ensureOverlay();
    UI.ensureToolbar();
    const ed = activeEditor(); if(!ed) return;
    ed.addEventListener('input', ()=>{ clearTimeout(debounceTimer); debounceTimer = setTimeout(()=>triggerSuggest(false), DEBOUNCE_MS); });
  }

  // Wait a tick to ensure page elements are present
  setTimeout(()=>{ init(); bindKeys(); }, 300);
})();