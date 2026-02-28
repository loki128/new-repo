// background.js (MV3 service worker, module-friendly)
// Provides: pluggable provider API, rate limiting, token budgeting, caching, and secure message handling

const DEFAULTS = {
  tokenBudget: 20000,
  minIntervalMs: 200,
  cacheTtlMs: 60_000
};

let state = {
  tokenBudget: DEFAULTS.tokenBudget,
  lastCallAt: 0,
  cache: new Map(), // key -> { value, ts }
  provider: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    apiKey: null // set via popup/config
  }
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['tokenBudget','provider'], (res) => {
    if (typeof res.tokenBudget === 'number') state.tokenBudget = res.tokenBudget;
    if (res.provider) state.provider = Object.assign(state.provider, res.provider);
    chrome.storage.local.set({ tokenBudget: state.tokenBudget, provider: state.provider });
  });
});

function setProvider(p) {
  state.provider = Object.assign(state.provider, p);
  chrome.storage.local.set({ provider: state.provider });
}

function setBudget(v) {
  state.tokenBudget = v;
  chrome.storage.local.set({ tokenBudget: v });
}

function now() { return Date.now(); }
function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }

function cacheGet(key){ const c = state.cache.get(key); if(!c) return null; if(now()-c.ts > DEFAULTS.cacheTtlMs){ state.cache.delete(key); return null;} return c.value; }
function cacheSet(key, value){ state.cache.set(key, { value, ts: now() }); }

async function rateLimit(){
  const gap = now() - state.lastCallAt;
  if (gap < DEFAULTS.minIntervalMs) await sleep(DEFAULTS.minIntervalMs - gap);
  state.lastCallAt = now();
}

async function providerCall(endpoint, body){
  if (!state.provider.apiKey) throw new Error('no_api_key');
  await rateLimit();
  if (state.tokenBudget <= 0) throw new Error('budget_exhausted');
  state.tokenBudget = Math.max(0, state.tokenBudget - 50); // rough decrement
  chrome.storage.local.set({ tokenBudget: state.tokenBudget });
  const url = `${state.provider.baseUrl}${endpoint}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.provider.apiKey}`
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`provider_${resp.status}:${txt.slice(0,180)}`);
  }
  return await resp.json();
}

async function getCompletion(context, kind='complete'){
  const key = `${kind}:${context.slice(-200)}`;
  const cached = cacheGet(key); if (cached) return { ...cached, cached: true };
  // OpenAI-compatible Chat Completions example
  const body = {
    model: state.provider.model,
    messages: [
      { role: 'system', content: `You are a coding assistant. Task: ${kind}. Keep responses concise and return only the code or minimal explanation.`},
      { role: 'user', content: context }
    ],
    temperature: 0.2,
    max_tokens: 120
  };
  try {
    const j = await providerCall('/chat/completions', body);
    const text = j.choices?.[0]?.message?.content?.trim() || '';
    const result = { suggestion: text, confidence: 0.6 };
    cacheSet(key, result);
    return result;
  } catch (e) {
    // fallback: local trivial suffix
    const m = (context.match(/[A-Za-z0-9_]+$/) || ['x'])[0];
    return { suggestion: m + '_suggestion', confidence: 0.3, fallback: true, error: String(e).slice(0,160) };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (!msg || !msg.type) return;
    if (msg.type === 'CONFIG_SET_PROVIDER') { setProvider(msg.provider || {}); return sendResponse({ ok: true }); }
    if (msg.type === 'CONFIG_GET') { 
      const o = { tokenBudget: state.tokenBudget, provider: { ...state.provider, apiKey: !!state.provider.apiKey } }; 
      return sendResponse(o);
    }
    if (msg.type === 'REQUEST_SUGGEST') { const r = await getCompletion(msg.context||'', 'complete'); return sendResponse(r); }
    if (msg.type === 'REQUEST_EXPLAIN') { const r = await getCompletion(msg.context||'', 'explain'); return sendResponse(r); }
    if (msg.type === 'REQUEST_REFACTOR') { const r = await getCompletion(msg.context||'', 'refactor'); return sendResponse(r); }
    if (msg.type === 'REQUEST_TESTS') { const r = await getCompletion(msg.context||'', 'tests'); return sendResponse(r); }
    if (msg.type === 'BUDGET_RESET') { setBudget(DEFAULTS.tokenBudget); return sendResponse({ ok: true, tokenBudget: state.tokenBudget }); }
  })().catch(err => sendResponse({ error: String(err) }));
  return true; // keep channel open for async
});
