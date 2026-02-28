import { setProviderConfig, getConfig, resetBudget } from './apiClient.js';
import { toggleSite } from './siteToggle.js';

const qs = (s)=>document.querySelector(s);

async function refresh(){
  const cfg = await getConfig();
  const st = qs('#status');
  st.textContent = `Budget: ${cfg.tokenBudget} | Model: ${cfg.provider?.model || ''}`;
}

document.addEventListener('DOMContentLoaded', async()=>{
  await refresh();
  qs('#save').addEventListener('click', async()=>{
    const apiKey = qs('#apiKey').value.trim();
    const model = qs('#model').value.trim();
    await setProviderConfig({ apiKey, model });
    await refresh();
  });
  qs('#reset').addEventListener('click', async()=>{
    await resetBudget();
    await refresh();
  });
  qs('#allowSite').addEventListener('click', async()=>{ await toggleSite(true); alert('Site allowed. Reload page.'); });
  qs('#denySite').addEventListener('click', async()=>{ await toggleSite(false); alert('Site denied. Reload page.'); });
});