// apiClient.js — wraps provider calls and storage interactions used by popup/config (optional usage by background)
export async function setProviderConfig(p){
  return new Promise((resolve)=> chrome.runtime.sendMessage({ type: 'CONFIG_SET_PROVIDER', provider: p }, resolve));
}
export async function getConfig(){
  return new Promise((resolve)=> chrome.runtime.sendMessage({ type: 'CONFIG_GET' }, resolve));
}
export async function resetBudget(){
  return new Promise((resolve)=> chrome.runtime.sendMessage({ type: 'BUDGET_RESET' }, resolve));
}
