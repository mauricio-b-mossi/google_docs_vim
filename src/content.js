/**
 * Google Docs Vim Extension - Content Script
 *
 * Injects into Google Docs to provide Vim keybindings.
 */

// --- STATE ---
const isTopWindow = window === window.top;

const MODES = {
    NORMAL: 'NORMAL',
    INSERT: 'INSERT',
    VISUAL: 'VISUAL',
    COMMAND: 'COMMAND'
};

let currentMode = MODES.NORMAL;
let commandSequence = ''; // Buffer for multi-key commands like 'dd'
let pendingOperator = null; // 'c', 'd'
let isEnabled = true;
let multiplierString = '';
let pendingReplaceChar = false;
let keybindings = {
    left: 'h',
    down: 'j',
    up: 'k',
    right: 'l'
};
let customEscape = 'Escape'; // Additional key that acts as Escape (Escape is always reserved)
let statusLineSize = 12; // Default font size for the status line in pixels

let escapeSequenceBuffer = [];
let escapeSequenceTimer = null;

// Search is delegated to native Google Docs Ctrl+F / Ctrl+G

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
        if (e.data && e.data.type === 'VIM_DOCS_TOGGLE_HELP') {
            toggleHelpOverlay(e.data.show);
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

    if (currentMode === MODES.NORMAL) {
        let cmdText = `${multiplierString}${commandSequence}${pendingReplaceChar ? 'r' : ''}`;
        if (cmdText) {
            text += ` ${cmdText}`;
        }
    }

    if (currentMode === MODES.INSERT) {
        modeIndicator.style.backgroundColor = '#2ecc71';
    } else if (currentMode === MODES.VISUAL) {
        modeIndicator.style.backgroundColor = '#e67e22';
    } else if (currentMode === MODES.COMMAND) {
        modeIndicator.style.backgroundColor = '#8e44ad';
        text = commandSequence;
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

let helpOverlay = null;

function toggleHelpOverlay(show) {
    if (!isTopWindow) {
        window.parent.postMessage({ type: 'VIM_DOCS_TOGGLE_HELP', show }, '*');
        return;
    }
    
    if (show) {
        if (helpOverlay) return;
        helpOverlay = document.createElement('div');
        helpOverlay.id = 'vim-docs-help-overlay';
        helpOverlay.style.position = 'fixed';
        helpOverlay.style.top = '50%';
        helpOverlay.style.left = '50%';
        helpOverlay.style.transform = 'translate(-50%, -50%)';
        helpOverlay.style.backgroundColor = '#222';
        helpOverlay.style.color = '#eee';
        helpOverlay.style.padding = '30px 40px';
        helpOverlay.style.borderRadius = '12px';
        helpOverlay.style.fontFamily = 'monospace';
        helpOverlay.style.fontSize = '15px';
        helpOverlay.style.zIndex = '9999999';
        helpOverlay.style.boxShadow = '0 10px 40px rgba(0,0,0,0.6)';
        helpOverlay.style.maxHeight = '85vh';
        helpOverlay.style.width = '600px';
        helpOverlay.style.maxWidth = '90vw';
        helpOverlay.style.overflowY = 'auto';
        helpOverlay.style.border = '1px solid #444';
        
        helpOverlay.innerHTML = `
            <style>
                #vim-docs-help-overlay table { width: 100%; text-align: left; border-collapse: collapse; margin-top: 15px; }
                #vim-docs-help-overlay th { border-bottom: 1px solid #555; padding: 12px 10px 12px 0; color: #aaa; width: 35%; }
                #vim-docs-help-overlay th:last-child { width: 65%; padding-right: 0;}
                #vim-docs-help-overlay td { padding: 12px 10px 12px 0; border-bottom: 1px solid #333; }
                #vim-docs-help-overlay td:last-child { padding-right: 0; }
                #vim-docs-help-overlay tr:last-child td { border-bottom: none; }
                #vim-docs-help-overlay kbd { background: #444; padding: 2px 6px; border-radius: 4px; color: #fff; }
            </style>
            <h2 style="margin-top: 0; color: #fff; border-bottom: 1px solid #444; padding-bottom: 10px; font-size: 20px;">VimDocs Command Reference</h2>
            <table>
                <thead>
                    <tr><th>Key</th><th>Action</th></tr>
                </thead>
                <tbody>
                    <tr><td><strong style="color: #2ecc71;">i, I, a, A, o, O</strong></td><td>Enter Insert Mode</td></tr>
                    <tr><td><strong style="color: #e67e22;">v, V</strong></td><td>Enter Visual Mode</td></tr>
                    <tr><td><strong>h, j, k, l</strong></td><td>Basic movements</td></tr>
                    <tr><td><strong>w, b, e</strong></td><td>Word movements</td></tr>
                    <tr><td><strong>0, ^, $</strong></td><td>Line movements</td></tr>
                    <tr><td><strong>gg, G</strong></td><td>Document movements</td></tr>
                    <tr><td><strong>{, }</strong></td><td>Paragraph/Page movements</td></tr>
                    <tr><td><strong>c, d, x, s</strong></td><td>Delete / Change</td></tr>
                    <tr><td><strong>u, Ctrl+r</strong></td><td>Undo / Redo</td></tr>
                    <tr><td><strong>:help</strong></td><td>Show this help overlay</td></tr>
                    <tr><td><strong>:q / Esc</strong></td><td>Close help overlay</td></tr>
                </tbody>
            </table>
            <p style="margin-bottom: 0; margin-top: 20px; font-size: 12px; color: #888; text-align: right;">Press <kbd>Esc</kbd> or type <kbd>:q</kbd> to close.</p>
        `;
        document.body.appendChild(helpOverlay);
    } else {
        if (helpOverlay) {
            helpOverlay.remove();
            helpOverlay = null;
        }
    }
}

// --- ENGINE ---

/**
 * Returns true if the given key should act as an Escape.
 * Native Escape is always included; customEscape adds an additional alias as long as it's a single key.
 */
function isEscapeKey(key) {
    if (key === 'Escape' || key === 'Esc') return true;
    if (customEscape && customEscape.length === 1 && key === customEscape) return true;
    return false;
}

/**
 * Checks for multi-key (composed) escape sequences (e.g. 'jj').
 * Returns true if a full match is found.
 */
function handleComposedEscape(key) {
    if (!customEscape || customEscape.length <= 1) return false;

    escapeSequenceBuffer.push(key);
    const currentSequence = escapeSequenceBuffer.join('');

    if (escapeSequenceTimer) {
        clearTimeout(escapeSequenceTimer);
    }

    if (customEscape === currentSequence) {
        escapeSequenceBuffer = [];
        return true;
    }

    if (customEscape.startsWith(currentSequence)) {
        // Partial match, keep waiting
        escapeSequenceTimer = setTimeout(() => {
            escapeSequenceBuffer = [];
        }, 500);
        return false;
    }

    // No match
    escapeSequenceBuffer = [];
    return false;
}

function setMode(mode) {
    currentMode = mode;
    commandSequence = '';
    pendingOperator = null;
    multiplierString = '';
    pendingReplaceChar = false;
    escapeSequenceBuffer = []; // Reset on mode switch
    updateModeIndicator();
}

function executeAction(fn) {
    const count = parseInt(multiplierString, 10) || 1;
    for (let i = 0; i < count; i++) {
        fn();
    }
    multiplierString = '';
    updateModeIndicator();
}

function handleOperatorSequence(key) {
    // Delegated commands short-circuit even during pending operators
    switch (key) {
        case 'y':
        case 'Y':
            showTemporaryMessage('USE CTRL+C TO COPY');
            setMode(MODES.NORMAL);
            return;
        case 'p':
        case 'P':
            showTemporaryMessage('USE CTRL+V TO PASTE');
            setMode(MODES.NORMAL);
            return;
        case '/':
        case '?':
            showTemporaryMessage('USE CTRL+F TO SEARCH');
            setMode(MODES.NORMAL);
            return;
        case 'n':
        case 'N':
            showTemporaryMessage('USE CTRL+G FOR NEXT RESULT');
            setMode(MODES.NORMAL);
            return;
    }

    commandSequence += key;
    updateModeIndicator();

    let motionMatched = true;
    const count = parseInt(multiplierString, 10) || 1;

    switch (key) {
        case 'w':
        case 'e':
            window.emulator.dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, ctrlKey: true });
            for(let i=0; i<count; i++) {
                window.emulator.dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true, shiftKey: true });
            }
            break;
        case 'b':
            window.emulator.dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true });
            for(let i=0; i<count; i++) {
                window.emulator.dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, ctrlKey: true, shiftKey: true });
            }
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
        window.emulator.deleteSelected();
        if (pendingOperator === 'c') setMode(MODES.INSERT);
        else setMode(MODES.NORMAL);
        return;
    }

    // --- Inner-word text object: ciw / diw ---
    if (key === 'i' && commandSequence.length === 2) {
        return; // wait for object character ('w')
    }
    if (commandSequence.endsWith('iw')) {
        window.emulator.selectWord();
        window.emulator.deleteSelected();
        if (pendingOperator === 'c') setMode(MODES.INSERT);
        else setMode(MODES.NORMAL);
        return;
    }

    // Double operator (dd, cc)
    if (key === pendingOperator) {
        const count = parseInt(multiplierString, 10) || 1;
        window.emulator.selectLines(count);
        window.emulator.deleteSelected();
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
        window.emulator.deleteSelected();
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


// ============================================================
// COMMAND MODE
// ============================================================

function handleCommandModeEvent(e) {
    if (!isEnabled) return;
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    e.preventDefault();
    e.stopPropagation();

    if (isEscapeKey(e.key)) {
        setMode(MODES.NORMAL);
        return;
    }

    if (e.key === 'Enter') {
        const cmd = commandSequence.substring(1).trim();
        if (cmd === 'help') {
            toggleHelpOverlay(true);
        } else if (cmd === 'q' || cmd === 'wq') {
            toggleHelpOverlay(false);
        } else if (cmd !== '') {
            showTemporaryMessage('UNKNOWN COMMAND: ' + cmd);
        }
        setMode(MODES.NORMAL);
        return;
    }

    if (e.key === 'Backspace') {
        if (commandSequence.length <= 1) {
            setMode(MODES.NORMAL);
        } else {
            commandSequence = commandSequence.slice(0, -1);
            updateModeIndicator();
        }
        return;
    }

    if (e.key.length === 1) {
        commandSequence += e.key;
        updateModeIndicator();
    }
}

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

    // Handle replace char
    if (pendingReplaceChar) {
        window.emulator.deleteChar();
        window.emulator.dispatchKey(key);
        pendingReplaceChar = false;
        multiplierString = '';
        updateModeIndicator();
        return;
    }

    // Number multiplier
    if (/^[0-9]$/.test(key)) {
        if (multiplierString.length > 0 || key !== '0') {
            multiplierString += key;
            updateModeIndicator();
            return;
        }
    }

    // Handle pending operators (c, d)
    if (pendingOperator) {
        handleOperatorSequence(key);
        return;
    }

    // Start operator sequence (c, d)
    if (key === 'c' || key === 'd') {
        pendingOperator = key;
        commandSequence = key;
        updateModeIndicator();
        return;
    }

    // Single-key commands
    switch (key) {
        // Delegated to system
        case 'y':
        case 'Y':
            showTemporaryMessage('USE CTRL+C TO COPY');
            break;
        case 'p':
        case 'P':
            showTemporaryMessage('USE CTRL+V TO PASTE');
            break;
        case '/':
        case '?':
            showTemporaryMessage('USE CTRL+F TO SEARCH');
            break;
        case 'n':
        case 'N':
            showTemporaryMessage('USE CTRL+G FOR NEXT RESULT');
            break;

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
        case 'x': executeAction(() => window.emulator.deleteChar()); break;
        case 's': executeAction(() => window.emulator.deleteChar()); setMode(MODES.INSERT); break;
        case 'S':
            const countS = parseInt(multiplierString, 10) || 1;
            window.emulator.selectLines(countS);
            window.emulator.deleteSelected();
            setMode(MODES.INSERT);
            break;
        case 'r':
            pendingReplaceChar = true;
            updateModeIndicator();
            break;
        case 'J':
            executeAction(() => {
                window.emulator.moveEnd();
                window.emulator.deleteChar();
                window.emulator.dispatchKey(' ', { code: 'Space', keyCode: 32 });
            });
            break;
        case '>':
            if (commandSequence === '>') {
                executeAction(() => window.emulator.indent());
                commandSequence = '';
            } else {
                commandSequence = '>';
                updateModeIndicator();
            }
            break;
        case '<':
            if (commandSequence === '<') {
                executeAction(() => window.emulator.dedent());
                commandSequence = '';
            } else {
                commandSequence = '<';
                updateModeIndicator();
            }
            break;
        case 'D': executeAction(() => window.emulator.deleteToLineEnd()); break;
        case 'C': executeAction(() => window.emulator.deleteToLineEnd()); setMode(MODES.INSERT); break;

        // Basic movement
        case keybindings.left: executeAction(() => window.emulator.moveLeft()); break;
        case keybindings.down: executeAction(() => window.emulator.moveDown()); break;
        case keybindings.up: executeAction(() => window.emulator.moveUp()); break;
        case keybindings.right: executeAction(() => window.emulator.moveRight()); break;

        // Visual mode
        case 'v': setMode(MODES.VISUAL); break;
        case 'V': window.emulator.selectLine(); setMode(MODES.VISUAL); break;

        // Word motions
        case 'w': executeAction(() => window.emulator.moveWordForward()); break;
        case 'e': executeAction(() => window.emulator.moveWordEnd()); break;
        case 'b': executeAction(() => window.emulator.moveWordBackward()); break;

        // Line motions
        case '0':
            executeAction(() => window.emulator.moveHome());
            break;
        case '^': executeAction(() => window.emulator.moveHome()); break;
        case '$': executeAction(() => window.emulator.moveEnd()); break;

        // Document / page motions
        case 'G': window.emulator.moveDocumentEnd(); break;
        case '}': executeAction(() => window.emulator.movePageDown()); break;
        case '{': executeAction(() => window.emulator.movePageUp()); break;

        // Undo
        case 'u': window.emulator.undo(); break;

        // Document start
        case 'g':
            commandSequence += 'g';
            updateModeIndicator();
            if (commandSequence === 'gg') {
                window.emulator.moveDocumentStart();
                commandSequence = '';
                updateModeIndicator();
            }
            break;

        case ':':
            setMode(MODES.COMMAND);
            commandSequence = ':';
            updateModeIndicator();
            break;

        default:
            if (isEscapeKey(key)) {
                toggleHelpOverlay(false);
                setMode(MODES.NORMAL);
                break;
            }
            return false;
    }
}

// ============================================================
// INSERT MODE
// ============================================================

function handleInsertModeEvent(e) {
    if (!isEnabled) return;
    
    // Ignore modifier keys by themselves from triggering composed escapes
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    if (isEscapeKey(e.key) || (e.key === '[' && e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        setMode(MODES.NORMAL);
        return;
    }

    if (customEscape && customEscape.length > 1) {
        if (handleComposedEscape(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            setMode(MODES.NORMAL);
            
            // Delete the characters that were already typed (length - 1 because we prevented the last one)
            for (let i = 0; i < customEscape.length - 1; i++) {
                window.emulator.dispatchKey('Backspace', { code: 'Backspace', keyCode: 8 });
            }
        }
    }
}

// ============================================================
// VISUAL MODE
// ============================================================

function handleVisualModeEvent(e) {
    if (!isEnabled) return;
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    const lowerKey = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (lowerKey === 'c' || lowerKey === 'v' || lowerKey === 'x' || lowerKey === 'a' || lowerKey === 'z' || lowerKey === 'f' || lowerKey === 'g' || lowerKey === 'h')) {
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    const key = e.key;

    if (isEscapeKey(key) || key === 'v' || key === 'V') {
        window.emulator.moveRight();
        window.emulator.moveLeft();
        setMode(MODES.NORMAL);
        return;
    }

    if (customEscape && customEscape.length > 1) {
        if (handleComposedEscape(key)) {
            window.emulator.moveRight();
            window.emulator.moveLeft();
            setMode(MODES.NORMAL);
            return;
        }
    }

    // Number multiplier
    if (/^[0-9]$/.test(key)) {
        if (multiplierString.length > 0 || key !== '0') {
            multiplierString += key;
            updateModeIndicator();
            return;
        }
    }

    if (key === 'c' || key === 's') { window.emulator.deleteSelected(); setMode(MODES.INSERT); return; }
    if (key === 'd' || key === 'x') { window.emulator.deleteSelected(); setMode(MODES.NORMAL); return; }
    if (key === '>') { executeAction(() => window.emulator.indent()); return; }
    if (key === '<') { executeAction(() => window.emulator.dedent()); return; }
    switch (key) {
        case 'y':
        case 'Y':
            showTemporaryMessage('USE CTRL+C TO COPY');
            break;
        case 'p':
        case 'P':
            showTemporaryMessage('USE CTRL+V TO PASTE');
            break;
        case '/':
        case '?':
            showTemporaryMessage('USE CTRL+F TO SEARCH');
            break;
        case 'n':
        case 'N':
            showTemporaryMessage('USE CTRL+G FOR NEXT RESULT');
            break;

        case keybindings.left: executeAction(() => window.emulator.dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, shiftKey: true })); break;
        case keybindings.down: executeAction(() => window.emulator.dispatchKey('ArrowDown', { code: 'ArrowDown', keyCode: 40, shiftKey: true })); break;
        case keybindings.up: executeAction(() => window.emulator.dispatchKey('ArrowUp', { code: 'ArrowUp', keyCode: 38, shiftKey: true })); break;
        case keybindings.right: executeAction(() => window.emulator.dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, shiftKey: true })); break;
        case 'w': executeAction(() => window.emulator.dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true, shiftKey: true })); break;
        case 'e':
            executeAction(() => {
                window.emulator.dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true, shiftKey: true });
                window.emulator.dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, shiftKey: true });
            });
            break;
        case 'b': executeAction(() => window.emulator.dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, ctrlKey: true, shiftKey: true })); break;
        case '0':
            executeAction(() => window.emulator.dispatchKey('Home', { code: 'Home', keyCode: 36, shiftKey: true }));
            break;
        case '^': executeAction(() => window.emulator.dispatchKey('Home', { code: 'Home', keyCode: 36, shiftKey: true })); break;
        case '$': executeAction(() => window.emulator.dispatchKey('End', { code: 'End', keyCode: 35, shiftKey: true })); break;
        case 'G': window.emulator.dispatchKey('End', { code: 'End', keyCode: 35, ctrlKey: true, shiftKey: true }); break;
        case '}': executeAction(() => window.emulator.dispatchKey('PageDown', { code: 'PageDown', keyCode: 34, shiftKey: true })); break;
        case '{': executeAction(() => window.emulator.dispatchKey('PageUp', { code: 'PageUp', keyCode: 33, shiftKey: true })); break;

        // Document start
        case 'g':
            commandSequence += 'g';
            updateModeIndicator();
            if (commandSequence === 'gg') {
                window.emulator.dispatchKey('Home', { code: 'Home', keyCode: 36, ctrlKey: true, shiftKey: true });
                commandSequence = '';
                updateModeIndicator();
            }
            break;

        default: break;
    }
}

// ============================================================
// EVENT INTERCEPTION
// ============================================================

function onKeyDown(e) {
    if (!e.isTrusted) return;
    if (!isEnabled) return;

    // Bypass Vim modes if the user is typing in a native input or textarea 
    // (e.g., the Docs Ctrl+F search bar)
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
    }

    if (currentMode === MODES.NORMAL) handleNormalModeEvent(e);
    else if (currentMode === MODES.INSERT) handleInsertModeEvent(e);
    else if (currentMode === MODES.VISUAL) handleVisualModeEvent(e);
    else if (currentMode === MODES.COMMAND) handleCommandModeEvent(e);
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
                updateModeIndicator();
            }
        });
    } else {
        if (callback) callback();
    }
}

function init() {
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
