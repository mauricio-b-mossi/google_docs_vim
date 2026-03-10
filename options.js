// options.js
const defaultKeybindings = {
    left: 'h',
    down: 'j',
    up: 'k',
    right: 'l'
};

// Saves options to chrome.storage
function saveOptions() {
    const bindings = {
        left: document.getElementById('key-left').value || defaultKeybindings.left,
        down: document.getElementById('key-down').value || defaultKeybindings.down,
        up: document.getElementById('key-up').value || defaultKeybindings.up,
        right: document.getElementById('key-right').value || defaultKeybindings.right,
    };

    chrome.storage.sync.set({ keybindings: bindings }, () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => {
            status.textContent = '';
        }, 2000);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
    chrome.storage.sync.get({ keybindings: defaultKeybindings }, (items) => {
        document.getElementById('key-left').value = items.keybindings.left;
        document.getElementById('key-down').value = items.keybindings.down;
        document.getElementById('key-up').value = items.keybindings.up;
        document.getElementById('key-right').value = items.keybindings.right;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save-btn').addEventListener('click', saveOptions);
