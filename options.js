// options.js
const defaultKeybindings = {
    left: 'h',
    down: 'j',
    up: 'k',
    right: 'l'
};

const defaultCustomEscape = 'Escape';

// Keys that can NEVER be used for navigation bindings.
// Note: Escape is excluded from this list — it IS allowed as the customEscape value.
const reservedKeys = ['i', 'v', 'V', 'x', 'd', 'c', 'y', 'p', 'u', 'G', 'g', '0', '$', '^', '{', '}'];

let listeningButton = null;
let isListeningForEscape = false; // true when the customEscape button is active

function formatKey(key) {
    if (!key) return '';
    if (key.startsWith('Arrow')) return key.replace('Arrow', '');
    if (key === ' ') return 'Space';
    return key.length === 1 ? key.toUpperCase() : key;
}

function handleKeybindingClick(e) {
    if (listeningButton) cancelListening();

    listeningButton = e.currentTarget;
    isListeningForEscape = listeningButton.id === 'customEscape';
    listeningButton.dataset.prevText = listeningButton.innerText;
    listeningButton.innerText = 'Press key...';
    listeningButton.classList.add('listening');

    document.addEventListener('keydown', captureKey, { capture: true });
    // Prevent this click from immediately triggering the global click listener
    e.stopPropagation();
}

function cancelListening() {
    if (!listeningButton) return;
    listeningButton.innerText = listeningButton.dataset.prevText;
    listeningButton.classList.remove('listening');
    listeningButton = null;
    isListeningForEscape = false;
    document.removeEventListener('keydown', captureKey, { capture: true });
}

function captureKey(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!listeningButton) return;

    let key = e.key;
    // Lowercase letters for consistency
    if (key.length === 1 && key.match(/[a-zA-Z]/)) {
        key = key.toLowerCase();
    }

    // When capturing the custom escape key, Escape itself is allowed (resets to default).
    // For navigation bindings, Escape is not meaningful and also not in reservedKeys,
    // so we only need to check regular reserved keys here.
    if (!isListeningForEscape && reservedKeys.includes(key)) {
        alert(`Key "${key}" is reserved and cannot be used for navigation.`);
        cancelListening();
        return;
    }

    // Prevent setting the custom escape to the same key as a navigation binding
    if (isListeningForEscape && key !== 'Escape') {
        const navKeys = ['left', 'down', 'up', 'right'].map(dir => document.getElementById(dir).dataset.key);
        if (navKeys.includes(key)) {
            alert(`Key "${formatKey(key)}" is already used for a navigation binding.`);
            cancelListening();
            return;
        }
    }

    listeningButton.dataset.key = key;
    listeningButton.innerText = formatKey(key);
    listeningButton.classList.remove('listening');
    isListeningForEscape = false;

    document.removeEventListener('keydown', captureKey, { capture: true });
    listeningButton = null;

    // Auto-save on key capture
    saveOptions();
}

function notifySaved() {
    const status = document.getElementById('save-status');
    if (!status) return;
    status.innerText = 'Saved';
    status.classList.add('visible');
    setTimeout(() => {
        status.classList.remove('visible');
    }, 1500);
}

function saveOptions() {
    const enabled = document.getElementById('enabled').checked;
    const keybindings = {
        left: document.getElementById('left').dataset.key || 'h',
        down: document.getElementById('down').dataset.key || 'j',
        up: document.getElementById('up').dataset.key || 'k',
        right: document.getElementById('right').dataset.key || 'l'
    };
    const customEscape = document.getElementById('customEscape').dataset.key || 'Escape';
    const statusLineSize = parseInt(document.getElementById('statusLineSize').value, 10) || 12;

    chrome.storage.sync.set({
        enabled: enabled,
        keybindings: keybindings,
        customEscape: customEscape,
        statusLineSize: statusLineSize
    }, () => {
        notifySaved();
    });
}

function restoreOptions() {
    chrome.storage.sync.get({
        enabled: true,
        keybindings: defaultKeybindings,
        customEscape: defaultCustomEscape,
        statusLineSize: 12
    }, (items) => {
        document.getElementById('enabled').checked = items.enabled;

        ['left', 'down', 'up', 'right'].forEach(dir => {
            const btn = document.getElementById(dir);
            btn.dataset.key = items.keybindings[dir];
            btn.innerText = formatKey(items.keybindings[dir]);
        });

        const escBtn = document.getElementById('customEscape');
        escBtn.dataset.key = items.customEscape;
        escBtn.innerText = formatKey(items.customEscape);

        const sizeSlider = document.getElementById('statusLineSize');
        sizeSlider.value = items.statusLineSize;
        document.getElementById('statusLineSizeValue').innerText = `${items.statusLineSize}px`;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);

// Auto-save on toggle
document.getElementById('enabled').addEventListener('change', saveOptions);

// Cancel listening if clicking outside
document.addEventListener('click', (e) => {
    if (listeningButton && !e.target.closest('.keybinding-btn')) {
        cancelListening();
    }
});

// Attach listeners to all keybinding buttons (navigation + customEscape)
document.querySelectorAll('.keybinding-btn').forEach(btn => {
    btn.addEventListener('click', handleKeybindingClick);
});

// Real-time Status Line Size Preview & Auto-save
const sizeSlider = document.getElementById('statusLineSize');
sizeSlider.addEventListener('input', (e) => {
    const size = parseInt(e.target.value, 10);
    document.getElementById('statusLineSizeValue').innerText = `${size}px`;

    // Send preview message to all docs tabs for immediate visual feedback
    chrome.tabs.query({ url: 'https://docs.google.com/*' }, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                type: 'VIM_DOCS_SIZE_PREVIEW',
                size: size
            }).catch(() => { });
        });
    });
});

// Auto-save slider only on release (change) to avoid flooding storage
sizeSlider.addEventListener('change', saveOptions);
