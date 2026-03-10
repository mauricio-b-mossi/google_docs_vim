/**
 * Google Docs Vim Extension - Content Script
 *
 * Injects into Google Docs to provide Vim keybindings.
 */
import * as emulator from './emulator.js';
window.emulator = emulator;

// --- STATE ---
const isTopWindow = window === window.top;

const MODES = {
    NORMAL: 'NORMAL',
    INSERT: 'INSERT',
    VISUAL: 'VISUAL'
};

let currentMode = MODES.NORMAL;
let commandSequence = ''; // Buffer for multi-key commands like 'dd'
let pendingOperator = null; // 'c', 'd', 'y'
let isEnabled = true;
let keybindings = {
    left: 'h',
    down: 'j',
    up: 'k',
    right: 'l'
};
let customEscape = 'Escape'; // Additional key that acts as Escape (Escape is always reserved)
let statusLineSize = 12; // Default font size for the status line in pixels

// --- SEARCH STATE ---
// (Search is now delegated to native Google Docs Ctrl+F / Ctrl+G)

// --- UI ---
let modeIndicator = null;

function createModeIndicator() {
    if (!isTopWindow) return;

    modeIndicator = document.createElement('div');
    modeIndicator.id = 'vim-docs-mode-indicator';
    modeIndicator.style.position = 'fixed';
    modeIndicator.style.bottom = '0';
    modeIndicator.style.left = '0';
    modeIndicator.style.padding = `${Math.round(statusLineSize / 3)}px ${Math.round(statusLineSize * 2 / 3)}px`;
    modeIndicator.style.backgroundColor = '#333';
    modeIndicator.style.color = '#fff';
    modeIndicator.style.fontFamily = 'monospace';
    modeIndicator.style.fontSize = `${statusLineSize}px`;
    modeIndicator.style.zIndex = '999999';
    modeIndicator.style.pointerEvents = 'none';
    modeIndicator.innerText = `-- ${currentMode} --`;
    document.body.appendChild(modeIndicator);

    // Listener for real-time size preview (without saving)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'VIM_DOCS_SIZE_PREVIEW') {
                if (modeIndicator) {
                    modeIndicator.style.fontSize = `${message.size}px`;
                    modeIndicator.style.padding = `${Math.round(message.size / 3)}px ${Math.round(message.size * 2 / 3)}px`;
                }
            }
        });
    }

    window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'VIM_DOCS_MODE') {
            currentMode = e.data.mode;
            commandSequence = e.data.sequence;
            updateModeIndicator();
        }
        if (e.data && e.data.type === 'VIM_DOCS_MSG') {
            showTemporaryMessage(e.data.msg);
        }
    });
}

function updateModeIndicator() {
    if (!isTopWindow) {
        window.parent.postMessage({ type: 'VIM_DOCS_MODE', mode: currentMode, sequence: commandSequence }, '*');
        return;
    }

    if (!modeIndicator) return;

    if (!isEnabled) {
        modeIndicator.style.display = 'none';
        return;
    } else {
        modeIndicator.style.display = 'block';
    }

    if (modeIndicator.dataset.tempMsg) return;

    let text = `-- ${currentMode} --`;

    if (currentMode === MODES.NORMAL && commandSequence) {
        text += ` ${commandSequence}`;
    }

    if (currentMode === MODES.INSERT) {
        modeIndicator.style.backgroundColor = '#2ecc71';
    } else if (currentMode === MODES.VISUAL) {
        modeIndicator.style.backgroundColor = '#e67e22';
    } else {
        modeIndicator.style.backgroundColor = '#333';
    }

    modeIndicator.innerText = text;
}

function showTemporaryMessage(msg) {
    if (!isTopWindow) {
        window.parent.postMessage({ type: 'VIM_DOCS_MSG', msg: msg }, '*');
        return;
    }
    if (!modeIndicator) return;

    modeIndicator.innerText = msg;
    modeIndicator.style.backgroundColor = '#e74c3c';
    modeIndicator.dataset.tempMsg = 'true';

    setTimeout(() => {
        delete modeIndicator.dataset.tempMsg;
        updateModeIndicator();
    }, 2000);
}

// --- ENGINE ---

/**
 * Returns true if the given key should act as an Escape.
 * Native Escape is always included; customEscape adds an additional alias.
 */
function isEscapeKey(key) {
    return key === 'Escape' || key === 'Esc' || key === customEscape;
}

function setMode(mode) {
    currentMode = mode;
    commandSequence = '';
    pendingOperator = null;
    updateModeIndicator();
    console.log(`[VimDocs] Switched to ${mode} mode`);
}

function handleOperatorSequence(key) {
    commandSequence += key;
    updateModeIndicator();

    let motionMatched = true;

    switch (key) {
        case 'w':
        case 'e':
            window.emulator.selectWord();
            break;
        case 'b':
            window.emulator.moveWordBackward();
            window.emulator.selectWord();
            break;
        case '$':
            window.emulator.dispatchKey('End', { code: 'End', keyCode: 35, shiftKey: true });
            break;
        case '0':
        case '^':
            window.emulator.dispatchKey('Home', { code: 'Home', keyCode: 36, shiftKey: true });
            break;
        case 'G':
            window.emulator.dispatchKey('End', { code: 'End', keyCode: 35, ctrlKey: true, shiftKey: true });
            break;
        default:
            motionMatched = false;
    }

    if (motionMatched) {
        if (pendingOperator === 'y') {
            window.emulator.copy();
            window.emulator.moveRight();
            window.emulator.moveLeft();
        } else {
            window.emulator.deleteSelected();
        }
        if (pendingOperator === 'c') setMode(MODES.INSERT);
        else setMode(MODES.NORMAL);
        return;
    }

    // --- Inner-word text object: ciw / diw / yiw ---
    if (key === 'i' && commandSequence.length === 2) {
        return; // wait for object character ('w')
    }
    if (commandSequence.endsWith('iw')) {
        window.emulator.selectWord();
        if (pendingOperator === 'y') {
            window.emulator.copy();
            window.emulator.moveRight();
            window.emulator.moveLeft();
        } else {
            window.emulator.deleteSelected();
        }
        if (pendingOperator === 'c') setMode(MODES.INSERT);
        else setMode(MODES.NORMAL);
        return;
    }

    // Double operator (dd, cc, yy)
    if (key === pendingOperator) {
        window.emulator.selectLine();
        if (pendingOperator === 'y') {
            showTemporaryMessage('USE CTRL+C TO COPY');
        } else {
            window.emulator.deleteSelected();
        }
        if (pendingOperator === 'c') setMode(MODES.INSERT);
        else setMode(MODES.NORMAL);
        return;
    }

    // dgg / cgg / ygg — to document start
    if (key === 'g' && commandSequence === pendingOperator + 'g') {
        return; // wait for second 'g'
    }
    if (key === 'g' && commandSequence === pendingOperator + 'gg') {
        window.emulator.dispatchKey('Home', { code: 'Home', keyCode: 36, ctrlKey: true, shiftKey: true });
        if (pendingOperator === 'y') {
            showTemporaryMessage('USE CTRL+C TO COPY');
        } else {
            window.emulator.deleteSelected();
        }
        if (pendingOperator === 'c') setMode(MODES.INSERT);
        else setMode(MODES.NORMAL);
        return;
    }

    if (key === 'Esc' || key === 'Escape') {
        setMode(MODES.NORMAL);
        return;
    }

    // Unrecognised sequence — abort
    setMode(MODES.NORMAL);
}

// (SEARCH MODE REMOVED - DELEGATED TO NATIVE GOOGLE DOCS)

// ============================================================
// NORMAL MODE
// ============================================================

function handleNormalModeEvent(e) {
    if (!isEnabled) return;
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    const lowerKey = e.key.toLowerCase();

    // Pass-through native copy/paste/cut/select-all/undo/find/next/replace
    if ((e.ctrlKey || e.metaKey) && (lowerKey === 'c' || lowerKey === 'v' || lowerKey === 'x' || lowerKey === 'a' || lowerKey === 'z' || lowerKey === 'f' || lowerKey === 'g' || lowerKey === 'h')) {
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Redo (Ctrl+R)
    if (e.ctrlKey && e.key === 'r') {
        window.emulator.redo();
        return;
    }

    const key = e.key;
    console.log(`[VimDocs] Normal mode key: ${key}`);

    // Handle pending operators (c, d, y)
    if (pendingOperator) {
        handleOperatorSequence(key);
        return;
    }

    // Start operator sequence
    if (key === 'c' || key === 'd' || key === 'y') {
        pendingOperator = key;
        commandSequence = key;
        updateModeIndicator();
        return;
    }

    // 'gg' — document start
    if (key === 'g') {
        commandSequence += 'g';
        updateModeIndicator();
        if (commandSequence === 'gg') {
            window.emulator.moveDocumentStart();
            commandSequence = '';
            updateModeIndicator();
        }
        return;
    }

    // --- Search (Delegated to Native Docs) ---
    if (key === '/' || key === '?') {
        showTemporaryMessage('USE CTRL+F TO SEARCH');
        return;
    }
    if (key === 'n' || key === 'N') {
        showTemporaryMessage('USE CTRL+G FOR NEXT RESULT');
        return;
    }

    // Single-key commands
    switch (key) {
        // Mode switches
        case 'i': setMode(MODES.INSERT); break;
        case 'I': window.emulator.moveHome(); setMode(MODES.INSERT); break;
        case 'a': window.emulator.moveRight(); setMode(MODES.INSERT); break;
        case 'A': window.emulator.moveEnd(); setMode(MODES.INSERT); break;
        case 'o':
            window.emulator.moveEnd();
            window.emulator.pressEnter();
            setMode(MODES.INSERT);
            break;
        case 'O':
            window.emulator.moveHome();
            window.emulator.pressEnter();
            window.emulator.moveUp();
            setMode(MODES.INSERT);
            break;

        // Editing
        case 'x': window.emulator.deleteChar(); break;
        case 'D': window.emulator.deleteToLineEnd(); break;
        case 'C': window.emulator.deleteToLineEnd(); setMode(MODES.INSERT); break;
        case 'p':
        case 'P': showTemporaryMessage('USE CTRL+V TO PASTE'); break;

        // Basic movement
        case keybindings.left: window.emulator.moveLeft(); break;
        case keybindings.down: window.emulator.moveDown(); break;
        case keybindings.up: window.emulator.moveUp(); break;
        case keybindings.right: window.emulator.moveRight(); break;

        // Visual mode
        case 'v': setMode(MODES.VISUAL); break;
        case 'V': window.emulator.selectLine(); setMode(MODES.VISUAL); break;

        // Word motions
        case 'w': window.emulator.moveWordForward(); break;
        case 'e': window.emulator.moveWordEnd(); break;
        case 'b': window.emulator.moveWordBackward(); break;

        // Line motions
        case '0':
        case '^': window.emulator.moveHome(); break;
        case '$': window.emulator.moveEnd(); break;

        // Document / page motions
        case 'G': window.emulator.moveDocumentEnd(); break;
        case '}': window.emulator.movePageDown(); break;
        case '{': window.emulator.movePageUp(); break;

        // Undo
        case 'u': window.emulator.undo(); break;

        default:
            if (isEscapeKey(key)) {
                setMode(MODES.NORMAL);
                break;
            }
            console.log(`[VimDocs] Unmapped normal mode key: ${key}`);
            return false;
    }
}

// ============================================================
// INSERT MODE
// ============================================================

function handleInsertModeEvent(e) {
    if (!isEnabled) return;
    if (isEscapeKey(e.key) || (e.key === '[' && e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        setMode(MODES.NORMAL);
    }
}

// ============================================================
// VISUAL MODE
// ============================================================

function handleVisualModeEvent(e) {
    if (!isEnabled) return;
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    const lowerKey = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (lowerKey === 'c' || lowerKey === 'v' || lowerKey === 'x' || lowerKey === 'a' || lowerKey === 'z')) {
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    const key = e.key;
    console.log(`[VimDocs] Visual mode key: ${key}`);

    if (isEscapeKey(key) || key === 'v' || key === 'V') {
        window.emulator.moveRight();
        window.emulator.moveLeft();
        setMode(MODES.NORMAL);
        return;
    }

    if (key === 'c' || key === 's') { window.emulator.deleteSelected(); setMode(MODES.INSERT); return; }
    if (key === 'd' || key === 'x') { window.emulator.deleteSelected(); setMode(MODES.NORMAL); return; }
    if (key === 'y') { showTemporaryMessage('USE CTRL+C TO COPY'); return; }
    if (key === 'p' || key === 'P') { showTemporaryMessage('USE CTRL+V TO PASTE'); return; }

    if (key === 'g') {
        commandSequence += 'g';
        updateModeIndicator();
        if (commandSequence === 'gg') {
            window.emulator.dispatchKey('Home', { code: 'Home', keyCode: 36, ctrlKey: true, shiftKey: true });
            commandSequence = '';
            updateModeIndicator();
        }
        return;
    }

    switch (key) {
        case keybindings.left: window.emulator.dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, shiftKey: true }); break;
        case keybindings.down: window.emulator.dispatchKey('ArrowDown', { code: 'ArrowDown', keyCode: 40, shiftKey: true }); break;
        case keybindings.up: window.emulator.dispatchKey('ArrowUp', { code: 'ArrowUp', keyCode: 38, shiftKey: true }); break;
        case keybindings.right: window.emulator.dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, shiftKey: true }); break;
        case 'w': window.emulator.dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true, shiftKey: true }); break;
        case 'e':
            window.emulator.dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true, shiftKey: true });
            window.emulator.dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, shiftKey: true });
            break;
        case 'b': window.emulator.dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, ctrlKey: true, shiftKey: true }); break;
        case '0':
        case '^': window.emulator.dispatchKey('Home', { code: 'Home', keyCode: 36, shiftKey: true }); break;
        case '$': window.emulator.dispatchKey('End', { code: 'End', keyCode: 35, shiftKey: true }); break;
        case 'G': window.emulator.dispatchKey('End', { code: 'End', keyCode: 35, ctrlKey: true, shiftKey: true }); break;
        case '}': window.emulator.dispatchKey('PageDown', { code: 'PageDown', keyCode: 34, shiftKey: true }); break;
        case '{': window.emulator.dispatchKey('PageUp', { code: 'PageUp', keyCode: 33, shiftKey: true }); break;
        default: break;
    }
}

// ============================================================
// EVENT INTERCEPTION
// ============================================================

function onKeyDown(e) {
    if (!e.isTrusted) return;
    if (!isEnabled) return;

    if (currentMode === MODES.NORMAL) handleNormalModeEvent(e);
    else if (currentMode === MODES.INSERT) handleInsertModeEvent(e);
    else if (currentMode === MODES.VISUAL) handleVisualModeEvent(e);
}

// ============================================================
// INITIALIZATION
// ============================================================

function loadSettings(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get({
            enabled: true,
            keybindings: keybindings,
            customEscape: 'Escape',
            statusLineSize: 12
        }, (items) => {
            isEnabled = items.enabled;
            keybindings = items.keybindings;
            customEscape = items.customEscape;
            statusLineSize = items.statusLineSize;
            console.log('[VimDocs] Loaded settings', { isEnabled, keybindings, customEscape, statusLineSize });
            updateModeIndicator();
            if (callback) callback();
        });

        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync') {
                if (changes.enabled) {
                    isEnabled = changes.enabled.newValue;
                    setMode(MODES.NORMAL);
                    if (isEnabled) {
                        showTemporaryMessage('VIM ENABLED');
                    } else {
                        showTemporaryMessage('VIM DISABLED');
                    }
                }
                if (changes.keybindings) keybindings = changes.keybindings.newValue;
                if (changes.customEscape) customEscape = changes.customEscape.newValue;
                if (changes.statusLineSize) {
                    statusLineSize = changes.statusLineSize.newValue;
                    if (modeIndicator) {
                        modeIndicator.style.fontSize = `${statusLineSize}px`;
                        modeIndicator.style.padding = `${Math.round(statusLineSize / 3)}px ${Math.round(statusLineSize * 2 / 3)}px`;
                    }
                }
                console.log('[VimDocs] Settings updated via options', { isEnabled, keybindings, customEscape, statusLineSize });
                updateModeIndicator();
            }
        });
    } else {
        if (callback) callback();
    }
}

function init() {
    console.log(`[VimDocs] Initializing Vim extension in ${isTopWindow ? 'top window' : 'iframe'}...`);
    loadSettings(() => {
        createModeIndicator();
        window.addEventListener('keydown', onKeyDown, { capture: true });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
