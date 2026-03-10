// src/emulator.js
/**
 * Keyboard Emulation Layer
 * Responsible for dispatching synthetic KeyboardEvents to the active element.
 */

export function dispatchKey(key, options = {}) {
    let target = document.activeElement;

    // Try to dispatch directly inside the Docs iframe if it exists and we are in the top window
    if (window === window.top) {
        const iframe = document.querySelector('.docs-texteventtarget-iframe');
        if (iframe && iframe.contentDocument) {
            target = iframe.contentDocument.activeElement || iframe.contentDocument.body;
        }
    } else if (!target) {
        target = document.body;
    }

    if (!target) {
        console.warn('[VimDocs] No active element to dispatch to.');
        return;
    }

    // Google Docs usually listens for keydown events
    const eventOptions = {
        key: key,
        code: options.code || key,
        keyCode: options.keyCode || 0,
        which: options.which || options.keyCode || 0,
        bubbles: true,
        cancelable: true,
        composed: true,
        shiftKey: options.shiftKey || false,
        ctrlKey: options.ctrlKey || false,
        altKey: options.altKey || false,
        metaKey: options.metaKey || false,
    };

    const event = new KeyboardEvent('keydown', eventOptions);

    console.log(`[VimDocs] Dispatching synthetic event: ${key}`, eventOptions);
    target.dispatchEvent(event);

    // Optionally dispatch keyup if needed by Docs, though usually keydown is enough for actions
    const upEvent = new KeyboardEvent('keyup', eventOptions);
    target.dispatchEvent(upEvent);
}

// --- Specific Vim Command Mappings ---

export function moveLeft() {
    dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37 });
}

export function moveDown() {
    dispatchKey('ArrowDown', { code: 'ArrowDown', keyCode: 40 });
}

export function moveUp() {
    dispatchKey('ArrowUp', { code: 'ArrowUp', keyCode: 38 });
}

export function moveRight() {
    dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39 });
}

export function moveWordForward() {
    // Docs uses Ctrl+Right for next word start
    dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true });
}

export function moveWordBackward() {
    // Docs uses Ctrl+Left for previous word start
    dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, ctrlKey: true });
}

export function moveWordEnd() {
    // Docs uses Ctrl+Right for next word, we can approximate 'e' with Ctrl+Right + Left
    dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true });
    dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37 });
}

export function movePageDown() {
    dispatchKey('PageDown', { code: 'PageDown', keyCode: 34 });
}

export function movePageUp() {
    dispatchKey('PageUp', { code: 'PageUp', keyCode: 33 });
}

export function moveDocumentStart() {
    // Ctrl+Home
    dispatchKey('Home', { code: 'Home', keyCode: 36, ctrlKey: true });
}

export function moveDocumentEnd() {
    // Ctrl+End
    dispatchKey('End', { code: 'End', keyCode: 35, ctrlKey: true });
}

export function deleteChar() {
    // Simulates 'x' in Vim
    dispatchKey('Delete', { code: 'Delete', keyCode: 46 });
}

export function pressEnter() {
    dispatchKey('Enter', { code: 'Enter', keyCode: 13 });
}

export function moveHome() {
    dispatchKey('Home', { code: 'Home', keyCode: 36 });
}

export function moveEnd() {
    dispatchKey('End', { code: 'End', keyCode: 35 });
}

export function deleteToLineEnd() {
    dispatchKey('Home', { code: 'Home', keyCode: 36 });
    // This is unreliable without text selection, but Shift+End then Delete works
    dispatchKey('End', { code: 'End', keyCode: 35, shiftKey: true });
    dispatchKey('Delete', { code: 'Delete', keyCode: 46 });
}

export function selectWord() {
    // Basic inner word selection: Ctrl+Left then Ctrl+Shift+Right
    dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, ctrlKey: true });
    dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true, shiftKey: true });
}

export function deleteSelected() {
    dispatchKey('Delete', { code: 'Delete', keyCode: 46 });
}

export function undo() {
    dispatchKey('z', { code: 'KeyZ', keyCode: 90, ctrlKey: true });
}

export function redo() {
    dispatchKey('y', { code: 'KeyY', keyCode: 89, ctrlKey: true });
}

export function selectLine() {
    dispatchKey('Home', { code: 'Home', keyCode: 36 });
    dispatchKey('End', { code: 'End', keyCode: 35, shiftKey: true });
}

// --- Search helpers ---

/**
 * Opens the native Google Docs Find toolbar (Ctrl+F).
 * We delegate search entirely to the native UI since we cannot
 * read DOM text from inside the Docs iframe.
 */
export function openFindBar() {
    dispatchKey('f', { code: 'KeyF', keyCode: 70, ctrlKey: true });
}

/** Moves to the next search result (Ctrl+G). */
export function findNext() {
    dispatchKey('g', { code: 'KeyG', keyCode: 71, ctrlKey: true });
}

/** Moves to the previous search result (Ctrl+Shift+G). */
export function findPrev() {
    dispatchKey('g', { code: 'KeyG', keyCode: 71, ctrlKey: true, shiftKey: true });
}

// --- Text object helpers ---

/**
 * Best-effort selection inside a matching pair of delimiters.
 * Since we cannot read document text from the iframe, we use a
 * keyboard-scan approach: jump to the start of the surrounding
 * bracket/quote pair using Ctrl+Shift+Left to anchor, then
 * Ctrl+Shift+Right to extend right past the closing delimiter.
 *
 * For symmetric delimiters (quotes), we select the word and its
 * surrounding characters, then trim one char from each side.
 *
 * @param {string} openChar  Opening delimiter, e.g. '('
 * @param {string} closeChar Closing delimiter, e.g. ')'
 */
export function selectInsidePair(openChar, closeChar) {
    const isSymmetric = openChar === closeChar; // e.g. '"' or "'"

    if (isSymmetric) {
        // For quotes: select the whole word block and narrow by one char each side.
        // Move to word start, then select to word end.
        dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, ctrlKey: true });
        // Select from word start to word end
        dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true, shiftKey: true });
        // Trim 1 char from the right (the closing quote)
        dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, shiftKey: true });
    } else {
        // For asymmetric pairs: move to the start of the current "word" boundary,
        // then select forward to the next word boundary.
        // This approximates selecting inside brackets for short expressions.
        dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, ctrlKey: true });
        dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true, shiftKey: true });
    }
}
