/**
 * Google Docs Vim Extension - Content Script
 * 
 * Injects into Google Docs to provide Vim keybindings.
 */
import * as emulator from './emulator.js';
window.emulator = emulator; // temporary workaround for module scoping if needed

// --- STATE ---
const isTopWindow = window === window.top;

const MODES = {
    NORMAL: 'NORMAL',
    INSERT: 'INSERT',
    VISUAL: 'VISUAL'
};

let currentMode = MODES.NORMAL;
let commandSequence = ''; // Buffer for multi-key commands like 'dd' or '2w'
let pendingOperator = null; // 'c', 'd', 'y'
let keybindings = {
    left: 'h',
    down: 'j',
    up: 'k',
    right: 'l'
};

// --- UI ---
let modeIndicator = null;

function createModeIndicator() {
    if (!isTopWindow) return; // Only top window needs the UI

    modeIndicator = document.createElement('div');
    modeIndicator.id = 'vim-docs-mode-indicator';
    modeIndicator.style.position = 'fixed';
    modeIndicator.style.bottom = '0';
    modeIndicator.style.left = '0';
    modeIndicator.style.padding = '4px 8px';
    modeIndicator.style.backgroundColor = '#333';
    modeIndicator.style.color = '#fff';
    modeIndicator.style.fontFamily = 'monospace';
    modeIndicator.style.fontSize = '12px';
    modeIndicator.style.zIndex = '999999';
    modeIndicator.style.pointerEvents = 'none';
    modeIndicator.innerText = `-- ${currentMode} --`;
    document.body.appendChild(modeIndicator);

    // Listen for mode updates from iframes
    window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'VIM_DOCS_MODE') {
            currentMode = e.data.mode;
            commandSequence = e.data.sequence;
            updateModeIndicator();
        }
    });
}

function updateModeIndicator() {
    if (!isTopWindow) {
        // Inform top window of mode change
        window.parent.postMessage({ type: 'VIM_DOCS_MODE', mode: currentMode, sequence: commandSequence }, '*');
        return;
    }

    if (!modeIndicator) return;
    if (modeIndicator.dataset.tempMsg) return; // don't override temporary message

    let text = `-- ${currentMode} --`;
    if (currentMode === MODES.NORMAL && commandSequence) {
        text += ` ${commandSequence}`;
    }
    modeIndicator.innerText = text;

    if (currentMode === MODES.INSERT) {
        modeIndicator.style.backgroundColor = '#2ecc71'; // Green for insert
    } else if (currentMode === MODES.VISUAL) {
        modeIndicator.style.backgroundColor = '#e67e22'; // Orange for visual
    } else {
        modeIndicator.style.backgroundColor = '#333'; // Dark for normal
    }
}

function showTemporaryMessage(msg) {
    if (!isTopWindow) {
        window.parent.postMessage({ type: 'VIM_DOCS_MSG', msg: msg }, '*');
        return;
    }
    if (!modeIndicator) return;

    modeIndicator.innerText = msg;
    modeIndicator.style.backgroundColor = '#e74c3c'; // Red
    modeIndicator.dataset.tempMsg = 'true';

    setTimeout(() => {
        delete modeIndicator.dataset.tempMsg;
        updateModeIndicator();
    }, 2000);
}

// --- ENGINE ---

function setMode(mode) {
    currentMode = mode;
    commandSequence = '';
    pendingOperator = null;
    updateModeIndicator();
    console.log(`[VimDocs] Switched to ${mode} mode`);
}

function handleNormalModeEvent(e) {
    // Ignore modifier key presses by themselves
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    const lowerKey = e.key.toLowerCase();

    // Pass-through native copy/paste/cut/select-all
    if ((e.ctrlKey || e.metaKey) && (lowerKey === 'c' || lowerKey === 'v' || lowerKey === 'x' || lowerKey === 'a' || lowerKey === 'z')) {
        return;
    }

    // We want to swallow keystrokes in Normal mode so Docs doesn't type them
    e.preventDefault();
    e.stopPropagation();

    // Handle Undo/Redo combos
    if (e.ctrlKey && e.key === 'r') {
        window.emulator.redo();
        return;
    }

    const key = e.key;
    console.log(`[VimDocs] Normal mode key: ${key}`);

    // Handle pending operators (c, d, y)
    if (pendingOperator) {
        commandSequence += key;
        updateModeIndicator();

        if (pendingOperator === 'c' || pendingOperator === 'd' || pendingOperator === 'y') {
            let motionMatched = true;

            switch (key) {
                case 'w':
                case 'e':
                    window.emulator.selectWord();
                    break;
                case 'b':
                    // Need a specific select word backwards for real accuracy, but approximation
                    window.emulator.moveWordBackward();
                    window.emulator.selectWord();
                    break;
                case '$':
                    // Shift+End
                    window.emulator.dispatchKey('End', { code: 'End', keyCode: 35, shiftKey: true });
                    break;
                case '0':
                case '^':
                    // Shift+Home
                    window.emulator.dispatchKey('Home', { code: 'Home', keyCode: 36, shiftKey: true });
                    break;
                case 'G':
                    // Ctrl+Shift+End
                    window.emulator.dispatchKey('End', { code: 'End', keyCode: 35, ctrlKey: true, shiftKey: true });
                    break;
                default:
                    motionMatched = false;
            }

            if (motionMatched) {
                if (pendingOperator === 'y') {
                    window.emulator.copy();
                    // Cancel selection by moving cursor
                    window.emulator.moveRight();
                    window.emulator.moveLeft();
                } else {
                    window.emulator.deleteSelected();
                }

                if (pendingOperator === 'c') setMode(MODES.INSERT);
                else setMode(MODES.NORMAL);
                return;
            }

            // Text objects
            if (key === 'i' && commandSequence.length === 2) {
                // Wait for the next character (like 'w')
                return;
            } else if (commandSequence.endsWith('iw')) {
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

            // Custom multi-key motions like 'gg'
            if (key === 'g' && commandSequence === pendingOperator + 'g') {
                // Return to wait for second 'g'
                return;
            } else if (key === 'g' && commandSequence === pendingOperator + 'gg') {
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
        }

        // If unrecognized sequence, abort
        setMode(MODES.NORMAL);
        return;
    }

    // Start of an operator sequence
    if (key === 'c' || key === 'd' || key === 'y') {
        pendingOperator = key;
        commandSequence = key;
        updateModeIndicator();
        return;
    }

    // Capture multi-key commands without operators ('gg')
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

    // Single-key commands
    switch (key) {
        // Switching to insert mode
        case 'i': setMode(MODES.INSERT); break;
        case 'I':
            window.emulator.moveHome();
            setMode(MODES.INSERT);
            break;
        case 'a':
            window.emulator.moveRight();
            setMode(MODES.INSERT);
            break;
        case 'A':
            window.emulator.moveEnd();
            setMode(MODES.INSERT);
            break;
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

        // Editing operations
        case 'x': window.emulator.deleteChar(); break;
        case 'D': window.emulator.deleteToLineEnd(); break;
        case 'C':
            window.emulator.deleteToLineEnd();
            setMode(MODES.INSERT);
            break;
        case 'p':
        case 'P':
            showTemporaryMessage('USE CTRL+V TO PASTE');
            break;

        // Basic Movement Mapping using custom bindings
        case keybindings.left: window.emulator.moveLeft(); break;
        case keybindings.down: window.emulator.moveDown(); break;
        case keybindings.up: window.emulator.moveUp(); break;
        case keybindings.right: window.emulator.moveRight(); break;

        case 'v':
            setMode(MODES.VISUAL);
            break;
        case 'V':
            window.emulator.selectLine();
            setMode(MODES.VISUAL);
            break;

        // Advanced Motions
        case 'w': window.emulator.moveWordForward(); break;
        case 'e': window.emulator.moveWordEnd(); break;
        case 'b': window.emulator.moveWordBackward(); break;
        case '0':
        case '^': window.emulator.moveHome(); break;
        case '$': window.emulator.moveEnd(); break;
        case 'G': window.emulator.moveDocumentEnd(); break;

        // Undo / Redo
        case 'u': window.emulator.undo(); break;
        // Ctrl+r is handled below in a separate block for modifier keys if we didn't block it earlier,
        // Wait, handleNormalModeEvent blocks modifier-only keys but lets through combos. 
        // Let's handle it by checking e.ctrlKey and e.key === 'r' at the top.
        case 'Esc':
            // Clear any partial sequences
            setMode(MODES.NORMAL);
            break;

        default:
            console.log(`[VimDocs] Unmapped normal mode key: ${key}`);
    }
}

function handleInsertModeEvent(e) {
    // In Insert mode, let Google Docs handle everything EXCEPT Escape
    if (e.key === 'Escape' || (e.key === '[' && e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        setMode(MODES.NORMAL);
    }
}

function handleVisualModeEvent(e) {
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    const lowerKey = e.key.toLowerCase();

    // Pass-through native copy/paste/cut
    if ((e.ctrlKey || e.metaKey) && (lowerKey === 'c' || lowerKey === 'v' || lowerKey === 'x' || lowerKey === 'a' || lowerKey === 'z')) {
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    const key = e.key;
    console.log(`[VimDocs] Visual mode key: ${key}`);

    // Exit visual mode
    if (key === 'Escape' || key === 'Esc' || key === 'v' || key === 'V') {
        // Clear selection by moving right then left
        window.emulator.moveRight();
        window.emulator.moveLeft();
        setMode(MODES.NORMAL);
        return;
    }

    // Operators on selection
    if (key === 'c' || key === 's') {
        window.emulator.deleteSelected();
        setMode(MODES.INSERT);
        return;
    }
    if (key === 'd' || key === 'x') {
        window.emulator.deleteSelected();
        setMode(MODES.NORMAL);
        return;
    }
    if (key === 'y') {
        showTemporaryMessage('USE CTRL+C TO COPY');
        return;
    }
    if (key === 'p' || key === 'P') {
        showTemporaryMessage('USE CTRL+V TO PASTE');
        return;
    }

    // Capture multi-key commands like 'gg'
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

    // Movement (with selection)
    const shiftOpt = { shiftKey: true };
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

// --- INTERCEPTION ---

/**
 * Event listener for keydown.
 * Needs to run in the CAPTURE phase so we can stopPropagation
 * before Google Docs internal listeners handle it.
 */
function onKeyDown(e) {
    // Ignore synthetically dispatched events to prevent infinite loops
    if (!e.isTrusted) return;

    // If we are focused on an actual input/textarea that IS NOT part of the canvas editor, let it be.
    // Google Docs uses a hidden editor typically with class '.docs-texteventtarget'
    // But checking if we are in an editable area that isn't the main canvas can be tricky.
    // For now, if we are normal mode, we intercept.

    if (currentMode === MODES.NORMAL) {
        handleNormalModeEvent(e);
    } else if (currentMode === MODES.INSERT) {
        handleInsertModeEvent(e);
    } else if (currentMode === MODES.VISUAL) {
        handleVisualModeEvent(e);
    }
}

// --- INITIALIZATION ---

function loadSettings(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get({ keybindings: keybindings }, (items) => {
            keybindings = items.keybindings;
            console.log('[VimDocs] Loaded keybindings', keybindings);
            if (callback) callback();
        });

        // Listen for changes from options page
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync' && changes.keybindings) {
                keybindings = changes.keybindings.newValue;
                console.log('[VimDocs] Keybindings updated via options', keybindings);
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
        // Attach at the window level during the capture phase
        window.addEventListener('keydown', onKeyDown, { capture: true });
    });
}

// Run init when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
