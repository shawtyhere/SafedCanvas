# 🛡️ SafeCanvas — AI Safety Browser Extension

**Blocks harmful, exploitative, and abusive prompts across ALL AI image and video generation tools.**

---

## What it does

Prompt Shield installs into Chrome (or any Chromium browser) and silently monitors every text box on every website. When you — or anyone using the browser — tries to submit a prompt containing harmful, abusive, sexual, or exploitative language to any AI tool, the extension **blocks it instantly** before it reaches the AI.

### Categories blocked
- Sexual & explicit content
- Child exploitation (zero tolerance — any hint is blocked)
- Non-consensual / assault language
- Violence targeting people
- Dehumanising language about women, children, or any group
- Abusive slurs and gendered insults
- Coded/euphemistic language trying to bypass filters

### Works on every AI tool including
- Midjourney (Discord & web)
- DALL·E / ChatGPT
- Adobe Firefly
- Stable Diffusion web UIs (Automatic1111, ComfyUI, etc.)
- RunwayML, Pika, Kling, Luma
- Leonardo AI, NightCafe, Playground AI
- **Any website** with a text prompt box

---

## Installation (Chrome / Edge / Brave)

1. Open your browser and go to: `chrome://extensions`
2. Turn on **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the `prompt-shield-extension` folder (the folder containing this README)
5. The 🛡️ shield icon will appear in your toolbar — you're protected!

> **Edge users**: go to `edge://extensions` instead  
> **Brave users**: go to `brave://extensions` instead

---

## How to use

- **It works automatically** — no setup needed after installation
- Click the 🛡️ toolbar icon to see your dashboard:
  - Toggle protection on/off
  - See how many prompts were blocked and flagged
  - View which categories are covered
- When a harmful prompt is typed, a **red warning banner** appears under the text box and the submission is stopped
- Suspicious (but not clearly harmful) prompts show an **amber warning** — you can still submit but are reminded to review

---

## Files in this extension

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration |
| `content.js` | Core logic — runs on every webpage, intercepts prompts |
| `background.js` | Service worker — handles storage and messaging |
| `popup.html` | Dashboard UI shown when you click the toolbar icon |
| `popup.js` | Dashboard logic |
| `icons/` | Extension icons |

---

## Privacy

- **No data leaves your browser.** All analysis is done locally using pattern matching.
- No prompts are stored, logged, or sent to any server.
- No account or API key required.

---

## Extending this project

To add more blocked phrases, open `content.js` and add regex patterns to:
- `BLOCKED_PATTERNS` — hard block (submission prevented)
- `WARNING_PATTERNS` — soft flag (warning shown, submission allowed)

---

*Built to protect women, children, and all people from AI-generated harmful content.*
