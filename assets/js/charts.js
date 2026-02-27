--- FILE: /assets/js/charts.js ---
// Simple animated charts (bar + radial) using canvas/SVG. Respects prefers-reduced-motion.

(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateValue(el, start, end, duration=800){
    if(!el) return; if(prefersReduced){ el.textContent = end; return; }
    const startTime = performance.now(); function step(now){ const t=Math.min(1,(now-startTime)/duration); const v=Math.round(start + (end-start)*t); el.textContent = v; if(t<1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  function drawRadial(canvas, value, options={}){
    if(!canvas) return; const ctx = canvas.getContext('2d'); const dpr = window.devicePixelRatio || 1; const size = Math.min(canvas.clientWidth, canvas.clientHeight); canvas.width = size * dpr; canvas.height = size * dpr; ctx.scale(dpr,dpr);
    const center = size/2; const radius = center - 8; ctx.clearRect(0,0,size,size);
    // background track
    ctx.beginPath(); ctx.arc(center,center,radius,0,Math.PI*2); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth=8; ctx.stroke();
    // arc
    const end = (Math.PI*2) * (value/100) - Math.PI/2;
    ctx.beginPath(); ctx.arc(center,center,radius,-Math.PI/2,end,false); ctx.strokeStyle = '#33d7ff'; ctx.lineWidth=8; ctx.lineCap='round'; ctx.stroke();
  }

  window.DDCharts = { animateValue, drawRadial };
})();