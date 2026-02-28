# CodeAssist Live Pro (MV3)

Inline AI-powered code completion, refactoring, explanation, and test generation for web-based editors (GitHub, VS Code Web, Replit, CodeSandbox).

## Features
- Content script: detects editors, tracks cursor, overlay ghost-text suggestions
- Shortcuts: Ctrl+Space trigger, Tab accept, Esc reject, Ctrl+Shift+E/R/T for Explain/Refactor/Tests
- Floating action toolbar
- Background service worker: pluggable OpenAI-compatible provider
- Rate limiting, token budgeting, local caching
- Debounced input detection, secure message passing
- Modular files: UI vs logic vs API vs utilities
- Error handling & fallback
- Minimal clean UI (CSS variables)

## Install (Load Unpacked)
1. Open Chrome → `chrome://extensions` → enable Developer mode.
2. Click "Load unpacked" and select this folder: `~/.openclaw/workspace/codeassist-live-pro`.
3. Pin the extension in the toolbar.

## Configure API Provider
1. Click the extension icon → enter your OpenAI-compatible API key and model (default: gpt-4o-mini).
2. Save. Budget shows in the popup.

## Usage
- Open a supported editor page, focus editor, type, press Ctrl+Space for a suggestion; Tab to accept, Esc to dismiss.
- Use toolbar or shortcuts:
  - Explain: Ctrl+Shift+E
  - Refactor: Ctrl+Shift+R
  - Generate Tests: Ctrl+Shift+T

## Files
- `manifest.json` — MV3 config
- `background.js` — service worker (provider, rate limit, cache, messaging)
- `content.js` — editor detection, overlay, toolbar, keyboard
- `popup.html` / `popup.js` — provider config and budget controls
- `apiClient.js` — messaging helpers for popup
- `config.js` — CSS variables & labels
- `styles.css` — minimal UI
- `icons/` — SVG icons

## Notes
- This ships with a safe fallback suggestion if the provider errors (keeps UX smooth).
- You can swap provider baseUrl/model in popup.
- For strict MV3, background is a service worker with no DOM.
