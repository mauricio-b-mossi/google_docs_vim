// src/emulator.js
/**
 * Keyboard Emulation Layer
 * Responsible for dispatching synthetic KeyboardEvents to the active element.
 */

function dispatchKey(key, options = {}) {
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

    target.dispatchEvent(event);

    // Optionally dispatch keyup if needed by Docs, though usually keydown is enough for actions
    const upEvent = new KeyboardEvent('keyup', eventOptions);
    target.dispatchEvent(upEvent);
}

// --- Specific Vim Command Mappings ---

function moveLeft() {
    dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37 });
}

function moveDown() {
    dispatchKey('ArrowDown', { code: 'ArrowDown', keyCode: 40 });
}

function moveUp() {
    dispatchKey('ArrowUp', { code: 'ArrowUp', keyCode: 38 });
}

function moveRight() {
    dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39 });
}

function moveWordForward() {
    // Docs uses Ctrl+Right for next word start
    dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true });
}

function moveWordBackward() {
    // Docs uses Ctrl+Left for previous word start
    dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, ctrlKey: true });
}

function moveWordEnd() {
    // Docs uses Ctrl+Right for next word, we can approximate 'e' with Ctrl+Right + Left
    dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true });
    dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37 });
}

function movePageDown() {
    dispatchKey('PageDown', { code: 'PageDown', keyCode: 34 });
}

function movePageUp() {
    dispatchKey('PageUp', { code: 'PageUp', keyCode: 33 });
}

function moveDocumentStart() {
    // Ctrl+Home
    dispatchKey('Home', { code: 'Home', keyCode: 36, ctrlKey: true });
}

function moveDocumentEnd() {
    // Ctrl+End
    dispatchKey('End', { code: 'End', keyCode: 35, ctrlKey: true });
}

function deleteChar() {
    // Simulates 'x' in Vim
    dispatchKey('Delete', { code: 'Delete', keyCode: 46 });
}

function pressEnter() {
    dispatchKey('Enter', { code: 'Enter', keyCode: 13 });
}

function moveHome() {
    dispatchKey('Home', { code: 'Home', keyCode: 36 });
}

function moveEnd() {
    dispatchKey('End', { code: 'End', keyCode: 35 });
}

function deleteToLineEnd() {
    // Shift+End then Delete
    dispatchKey('End', { code: 'End', keyCode: 35, shiftKey: true });
    dispatchKey('Delete', { code: 'Delete', keyCode: 46 });
}

function selectWord() {
    // Basic inner word selection: Ctrl+Left then Ctrl+Shift+Right
    dispatchKey('ArrowLeft', { code: 'ArrowLeft', keyCode: 37, ctrlKey: true });
    dispatchKey('ArrowRight', { code: 'ArrowRight', keyCode: 39, ctrlKey: true, shiftKey: true });
}

function deleteSelected() {
    dispatchKey('Delete', { code: 'Delete', keyCode: 46 });
}

function undo() {
    dispatchKey('z', { code: 'KeyZ', keyCode: 90, ctrlKey: true });
}

function redo() {
    dispatchKey('y', { code: 'KeyY', keyCode: 89, ctrlKey: true });
}

function selectLine() {
    dispatchKey('Home', { code: 'Home', keyCode: 36 });
    dispatchKey('End', { code: 'End', keyCode: 35, shiftKey: true });
}

function selectLines(count) {
    dispatchKey('Home', { code: 'Home', keyCode: 36 });
    for (let i = 1; i < count; i++) {
        dispatchKey('ArrowDown', { code: 'ArrowDown', keyCode: 40, shiftKey: true });
    }
    dispatchKey('End', { code: 'End', keyCode: 35, shiftKey: true });
}

function indent() {
    dispatchKey('Tab', { code: 'Tab', keyCode: 9 });
}

function dedent() {
    dispatchKey('Tab', { code: 'Tab', keyCode: 9, shiftKey: true });
}

// --- Document helpers ---

window.emulator = { dispatchKey, moveLeft, moveDown, moveUp, moveRight, moveWordForward, moveWordBackward, moveWordEnd, movePageDown, movePageUp, moveDocumentStart, moveDocumentEnd, deleteChar, pressEnter, moveHome, moveEnd, deleteToLineEnd, selectWord, deleteSelected, undo, redo, selectLine, selectLines, indent, dedent };
