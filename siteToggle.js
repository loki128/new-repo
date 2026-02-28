// siteToggle.js — allow/deny list control and activation guard
export async function isSiteAllowed(){
  return new Promise((resolve)=>{
    chrome.storage.local.get(['calp_allow','calp_deny'], (res)=>{
      const host = location.hostname || '';
      const deny = res.calp_deny || [];
      if (deny.includes(host)) return resolve(false);
      const allow = res.calp_allow || [];
      // default: require activation unless explicitly allowed
      resolve(allow.includes(host));
    });
  });
}

export async function toggleSite(allow){
  return new Promise((resolve)=>{
    const host = location.hostname || '';
    chrome.storage.local.get(['calp_allow','calp_deny'], (res)=>{
      const allowList = new Set(res.calp_allow||[]); const denyList = new Set(res.calp_deny||[]);
      if (allow){ denyList.delete(host); allowList.add(host); }
      else { allowList.delete(host); denyList.add(host); }
      chrome.storage.local.set({ calp_allow: Array.from(allowList), calp_deny: Array.from(denyList) }, ()=>resolve(true));
    });
  });
}
