// Prompt Shield — Popup Script

const toggle = document.getElementById('enableToggle');
const blockEl = document.getElementById('blockCount');
const warnEl = document.getElementById('warnCount');
const badge = document.getElementById('statusBadge');
const sub = document.getElementById('toggleSub');
const resetBtn = document.getElementById('resetBtn');

function updateUI(enabled) {
  badge.textContent = enabled ? '● Shield ON' : '● Shield OFF';
  badge.className = 'status-badge' + (enabled ? '' : ' off');
  sub.textContent = enabled ? 'Blocking harmful prompts' : 'Protection is paused';
}

// Load saved state
chrome.storage.sync.get(['enabled', 'blockCount', 'warnCount'], (res) => {
  const enabled = res.enabled !== undefined ? res.enabled : true;
  toggle.checked = enabled;
  blockEl.textContent = res.blockCount || 0;
  warnEl.textContent = res.warnCount || 0;
  updateUI(enabled);
});

// Toggle protection
toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ enabled });
  updateUI(enabled);

  // Notify all content scripts
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { type: 'SET_ENABLED', value: enabled })
        .catch(() => {}); // ignore tabs without content script
    });
  });
});

// Reset counters
resetBtn.addEventListener('click', () => {
  chrome.storage.sync.set({ blockCount: 0, warnCount: 0 });
  blockEl.textContent = '0';
  warnEl.textContent = '0';
});

// Live update counts when user is viewing popup
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockCount) blockEl.textContent = changes.blockCount.newValue;
  if (changes.warnCount) warnEl.textContent = changes.warnCount.newValue;
});
