/* Prompt Shield — Content Script
   Intercepts textarea/input submissions on all AI tools
   and blocks harmful prompts before they are sent.
*/

(function () {
  'use strict';

  // ─── Harmful word/phrase list ─────────────────────────────────────────────
  // Covers sexual, exploitative, abusive, violent content targeting people.
  // Uses whole-word and partial matching where appropriate.

  const BLOCKED_PATTERNS = [
    // Sexual & explicit
    /\bnude\b/i, /\bnaked\b/i, /\bundressed\b/i, /\bexplicit\b/i,
    /\bpornograph/i, /\bporn\b/i, /\berotic/i, /\bsexual/i,
    /\bgenitals?\b/i, /\bnipple/i, /\bbreasts?\b/i, /\bpenis\b/i,
    /\bvagina\b/i, /\baroused?\b/i, /\bintercourse\b/i, /\bfornication\b/i,
    /\bstriptease\b/i, /\blingerie\s+(model|photo|shoot)/i,
    /\bseductive\s+(pose|position)/i, /\bsex(y)?\s+photo/i,
    /\bnsfwf?\b/i, /\bx[- ]?rated\b/i, /\badult\s+content/i,
    /\bfetish\b/i, /\bbondage\b/i, /\bdomina(trix|tion)\b/i,

    // Child exploitation — zero tolerance
    /\bchild(ren)?\s+(nude|naked|sex|exploit)/i,
    /\bminor\s+(nude|naked|sex|exploit)/i,
    /\bteen(ager)?\s+(nude|naked|sex)/i,
    /\bunderage\b/i, /\blolita\b/i, /\bshota\b/i, /\bloli\b/i,
    /\bpedophil/i, /\bcsam\b/i, /\bcp\s+image/i,
    /\b(young|little)\s+(girl|boy)\s+(naked|nude|sex)/i,
    /\b18[-\s]?\-\s?look/i,

    // Non-consensual / assault
    /\brape\b/i, /\bnon[- ]?consensual\b/i, /\bsexual\s+assault/i,
    /\bmolest/i, /\bgroping?\b/i, /\bharassment\s+image/i,

    // Violent targeting of people
    /\btorture\b/i, /\bmutilat/i, /\bbeheading?\b/i, /\bgore\b/i,
    /\bsnuff\b/i, /\bslaughter\s+(of\s+)?(women|girls|children)/i,

    // Dehumanising / gender/race abuse
    /\b(women|girls?|females?)\s+(as\s+)?(objects?|animals?|slaves?|meat)\b/i,
    /\bdegrading?\s+(women|female|girl)/i,
    /\bslut\b/i, /\bwhore\b/i, /\bbitche?s?\b/i,
    /\bcunt\b/i, /\bwench\b/i, /\bskank\b/i,

    // Common coded/euphemistic circumventions
    /\b(barely|just)\s+legal\b/i, /\blooks?\s+young\b/i,
    /\bno\s+(clothes|underwear|top)\b/i,
    /\bwithout\s+(clothes|underwear|shirt|top)\b/i,
    /\bclothes?\s+removed?\b/i, /\bstrip(ped|ping)?\b/i,
    /\bunclothed\b/i, /\bexposed\s+(body|skin|chest)\b/i,
  ];

  // Patterns that trigger a WARNING (flagged but not hard-blocked by default)
  const WARNING_PATTERNS = [
    /\bsexy\b/i, /\bhalf[- ]?naked\b/i, /\bsuggestive\b/i,
    /\bbikini\s+(model|shoot|pose)/i, /\bsensual\b/i,
    /\bintimate\s+(photo|image|scene)/i, /\bsheer\s+(dress|clothing)\b/i,
  ];

  // ─── State ────────────────────────────────────────────────────────────────
  let enabled = true;
  let blockCount = 0;
  let warnCount = 0;

  // Load persisted settings
  chrome.storage.sync.get(['enabled', 'blockCount', 'warnCount'], (res) => {
    if (res.enabled !== undefined) enabled = res.enabled;
    if (res.blockCount) blockCount = res.blockCount;
    if (res.warnCount) warnCount = res.warnCount;
  });

  // Listen for toggle from popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SET_ENABLED') {
      enabled = msg.value;
    }
  });

  // ─── Analysis ─────────────────────────────────────────────────────────────
  function analyzeText(text) {
    if (!text || text.trim().length < 3) return { verdict: 'SAFE', flags: [] };

    const flags = [];
    let blocked = false;
    let warned = false;

    for (const pattern of BLOCKED_PATTERNS) {
      const m = text.match(pattern);
      if (m) {
        blocked = true;
        flags.push(m[0].toLowerCase());
      }
    }

    if (!blocked) {
      for (const pattern of WARNING_PATTERNS) {
        const m = text.match(pattern);
        if (m) {
          warned = true;
          flags.push(m[0].toLowerCase());
        }
      }
    }

    return {
      verdict: blocked ? 'BLOCKED' : warned ? 'WARNING' : 'SAFE',
      flags: [...new Set(flags)]
    };
  }

  // ─── UI helpers ──────────────────────────────────────────────────────────
  function removeExistingBanner(el) {
    const existing = el.parentNode && el.parentNode.querySelector('.ps-banner');
    if (existing) existing.remove();
  }

  function showBanner(inputEl, verdict, flags) {
    removeExistingBanner(inputEl);

    const banner = document.createElement('div');
    banner.className = 'ps-banner';

    const isBlocked = verdict === 'BLOCKED';
    const bg = isBlocked ? '#fff0f0' : '#fff8e6';
    const border = isBlocked ? '#e53e3e' : '#d69e2e';
    const color = isBlocked ? '#c53030' : '#975a16';
    const icon = isBlocked ? '🛡️' : '⚠️';
    const title = isBlocked
      ? 'Prompt blocked by SafeCanvas'
      : 'Prompt flagged — review before sending';
    const body = isBlocked
      ? `This prompt contains content that may be harmful, exploitative, or abusive and has been blocked.`
      : `This prompt contains potentially sensitive content. Please review before proceeding.`;

    banner.style.cssText = `
      all: initial;
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: ${bg};
      border: 1.5px solid ${border};
      border-radius: 10px;
      padding: 12px 14px;
      margin-top: 8px;
      font-size: 13px;
      color: ${color};
      line-height: 1.5;
      z-index: 2147483647;
      position: relative;
      box-sizing: border-box;
      width: 100%;
    `;

    const flagsHTML = flags.length
      ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:5px;">
          ${flags.map(f => `<span style="background:${isBlocked ? '#fed7d7' : '#fefcbf'};color:${color};border-radius:99px;padding:2px 10px;font-size:11px;font-weight:600;">${f}</span>`).join('')}
        </div>`
      : '';

    const dismissBtn = `<button onclick="this.parentNode.remove()" style="
      all:initial;cursor:pointer;float:right;font-size:16px;color:${color};
      line-height:1;font-family:sans-serif;margin-left:8px;opacity:0.7;
    ">✕</button>`;

    banner.innerHTML = `
      ${dismissBtn}
      <strong style="font-size:13px;">${icon} ${title}</strong>
      <div style="margin-top:4px;">${body}</div>
      ${flagsHTML}
    `;

    // Insert after input or inside its parent
    if (inputEl.parentNode) {
      inputEl.parentNode.insertBefore(banner, inputEl.nextSibling);
    }
  }

  // ─── Intercept submit attempts ────────────────────────────────────────────
  // Strategy: capture keydown (Enter), click on send buttons, and form submits.

  function getTextFromTarget(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el.value || '';
    if (el.isContentEditable) return el.innerText || '';
    return '';
  }

  // ─── Site-specific prompt input selectors ────────────────────────────────
  // Each AI tool uses different DOM structures — we target them explicitly.
  const SITE_SELECTORS = [
    // ChatGPT
    '#prompt-textarea',
    'div[id="prompt-textarea"]',
    // Claude.ai
    '.ProseMirror[contenteditable="true"]',
    'div[aria-label="Write your prompt to Claude"]',
    // Gemini
    'div[aria-label="Enter a prompt here"]',
    'rich-textarea .ql-editor',
    // Midjourney web
    'textarea[placeholder*="imagine"]',
    'textarea[placeholder*="Imagine"]',
    // Leonardo AI
    'textarea[placeholder*="prompt"]',
    // Adobe Firefly
    'textarea[aria-label*="prompt" i]',
    // Runway, Pika, generic
    'textarea[placeholder*="describe" i]',
    'textarea[placeholder*="generate" i]',
    'textarea[placeholder*="type a prompt" i]',
    // Generic fallback
    'textarea',
    '[contenteditable="true"]',
  ];

  function getActivePromptInput() {
    for (const sel of SITE_SELECTORS) {
      try {
        const el = document.querySelector(sel);
        if (el && getTextFromTarget(el).trim().length > 0) return el;
      } catch (_) {}
    }
    // Fallback: focused element
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.isContentEditable)) return active;
    return null;
  }

  function findAssociatedInput(btn) {
    // 1. Walk UP from button — check ancestors for an input
    let node = btn;
    for (let i = 0; i < 8; i++) {
      if (!node) break;
      const ta = node.querySelector && node.querySelector(
        '#prompt-textarea, .ProseMirror, textarea, [contenteditable="true"]'
      );
      if (ta) return ta;
      node = node.parentElement;
    }
    // 2. Try site-specific selectors globally
    return getActivePromptInput();
  }

  function isSendButton(el) {
    if (!el) return false;
    // Walk up from click target (handles SVG path/icon clicks inside buttons)
    const btn = el.closest('button, [role="button"]') || el;
    const tag = btn.tagName;
    const role = (btn.getAttribute('role') || '').toLowerCase();
    const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
    const dataTestId = (btn.getAttribute('data-testid') || '').toLowerCase();
    const cls = (typeof btn.className === 'string' ? btn.className : '').toLowerCase();

    // ChatGPT specific
    if (dataTestId === 'send-button') return true;
    if (dataTestId.includes('send')) return true;
    // Generic heuristics
    if ((tag === 'BUTTON' || role === 'button') && (
      ariaLabel.includes('send') ||
      ariaLabel.includes('submit') ||
      ariaLabel.includes('generate') ||
      ariaLabel.includes('run') ||
      ariaLabel.includes('create') ||
      cls.includes('send') ||
      cls.includes('submit') ||
      cls.includes('generate')
    )) return true;
    if (btn.type === 'submit') return true;
    return false;
  }

  function handleCheck(inputEl, e) {
    if (!enabled) return;
    const text = getTextFromTarget(inputEl);
    const result = analyzeText(text);

    if (result.verdict === 'BLOCKED') {
      e && e.stopImmediatePropagation();
      e && e.preventDefault();
      blockCount++;
      chrome.storage.sync.set({ blockCount });
      chrome.runtime.sendMessage({ type: 'UPDATE_COUNTS', blockCount, warnCount });
      showBanner(inputEl, 'BLOCKED', result.flags);
      return false;
    }

    if (result.verdict === 'WARNING') {
      warnCount++;
      chrome.storage.sync.set({ warnCount });
      chrome.runtime.sendMessage({ type: 'UPDATE_COUNTS', blockCount, warnCount });
      showBanner(inputEl, 'WARNING', result.flags);
    } else {
      removeExistingBanner(inputEl);
    }
  }

  // ─── Keyboard listener (Enter to submit) ──────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (!enabled) return;
    if (e.key !== 'Enter' || e.shiftKey) return;

    const target = e.target;
    if (
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      (target.tagName === 'INPUT' && target.type === 'text')
    ) {
      const result = analyzeText(getTextFromTarget(target));
      if (result.verdict === 'BLOCKED') {
        e.stopImmediatePropagation();
        e.preventDefault();
        blockCount++;
        chrome.storage.sync.set({ blockCount });
        chrome.runtime.sendMessage({ type: 'UPDATE_COUNTS', blockCount, warnCount });
        showBanner(target, 'BLOCKED', result.flags);
      } else if (result.verdict === 'WARNING') {
        warnCount++;
        chrome.storage.sync.set({ warnCount });
        chrome.runtime.sendMessage({ type: 'UPDATE_COUNTS', blockCount, warnCount });
        showBanner(target, 'WARNING', result.flags);
      } else {
        removeExistingBanner(target);
      }
    }
  }, true);

  // ─── Click listener (send buttons) ───────────────────────────────────────
  // Use mousedown (fires before click) so we can cancel before ChatGPT's
  // own handler fires. Also handles SVG/path children of buttons.
  document.addEventListener('mousedown', function (e) {
    if (!enabled) return;
    if (!isSendButton(e.target)) return;

    const inputEl = findAssociatedInput(e.target.closest('button, [role="button"]') || e.target);
    if (!inputEl) return;

    const text = getTextFromTarget(inputEl);
    const result = analyzeText(text);

    if (result.verdict === 'BLOCKED') {
      e.stopImmediatePropagation();
      e.preventDefault();
      blockCount++;
      chrome.storage.sync.set({ blockCount });
      chrome.runtime.sendMessage({ type: 'UPDATE_COUNTS', blockCount, warnCount });
      showBanner(inputEl, 'BLOCKED', result.flags);
    } else if (result.verdict === 'WARNING') {
      warnCount++;
      chrome.storage.sync.set({ warnCount });
      chrome.runtime.sendMessage({ type: 'UPDATE_COUNTS', blockCount, warnCount });
      showBanner(inputEl, 'WARNING', result.flags);
    } else {
      removeExistingBanner(inputEl);
    }
  }, true);

  // ─── Form submit listener ─────────────────────────────────────────────────
  document.addEventListener('submit', function (e) {
    if (!enabled) return;
    const form = e.target;
    const input = form.querySelector('#prompt-textarea, .ProseMirror, textarea, [contenteditable="true"], input[type="text"]');
    if (input) handleCheck(input, e);
  }, true);

  // ─── Live typing feedback (debounced) ────────────────────────────────────
  let debounceTimer;
  document.addEventListener('input', function (e) {
    if (!enabled) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const target = e.target;
      if (
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        (target.tagName === 'INPUT' && target.type === 'text')
      ) {
        const text = getTextFromTarget(target);
        const result = analyzeText(text);
        if (result.verdict !== 'SAFE') {
          showBanner(target, result.verdict, result.flags);
        } else {
          removeExistingBanner(target);
        }
      }
    }, 600);
  }, true);

})();
