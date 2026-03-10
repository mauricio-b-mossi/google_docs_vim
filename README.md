# Vim for Google Docs

Bring the power and speed of Vim modal editing to Google Docs. This extension intercepts standard key presses and translates them into navigation and editing commands within the Google Docs canvas, allowing for a more efficient and keyboard-driven workflow.

## 🚀 Features

### Core Vim Functionality
- **Modes**: Normal, Insert, and Visual modes.
- **Basic Navigation**: `h`, `j`, `k`, `l` (customizable).
- **Word-based Movement**: `w` (next word), `e` (end of word), `b` (back a word).
- **Line Navigation**: `0`, `^` (start of line), `$` (end of line).
- **Document Navigation**: `gg` (top of document), `G` (bottom of document).
- **Editing**: `x` (delete char), `d` (delete), `c` (change), `s` (substitute), `D`, `C` (to end of line).
- **Undo/Redo**: `u` (undo), `Ctrl+r` (redo).

### Search
- **Transparent Delegation**: Pressing search keys shows a guidance toast for native Google Docs shortcuts.
- **Native Integration**: Use `Ctrl+F` for searching and `Ctrl+G` for next result.
- **Consistency**: Mirrors the "native pass-through" strategy used for clipboard access.

### Customization
- Fully customizable keybindings for basic navigation via the extension's options page.
- Customizable additional escape key (e.g. `jj` equivalent).
- **Status Line Size**: Adjust the font size of the mode indicator with real-time preview.
- Toggle extension on/off globally with visual "DISABLED/ENABLED" feedback.
- **Neon-Dark Aesthetic**: Premium UI with glassmorphism and neon accents.

## 🛠 Installation

### For Local Development

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/mauricio-b-mossi/google_docs_vim.git
    cd google_docs_vim
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Build the project**:
    ```bash
    npm run build
    ```

### Loading into Chrome

1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** (toggle in the top right corner).
3.  Click **Load unpacked**.
4.  Navigate to the project directory and select the `dist` folder (created after running `npm run build`).

## 📖 Usage

- Once installed, open any Google Doc.
- You will see a mode indicator at the bottom-left corner of the screen.
- **Normal Mode**: Default mode. Use Vim keys for navigation and commands.
- **Insert Mode**: Press `i`, `I`, `a`, `A`, `o`, or `O` to enter. Type normally. Press `Esc` or `Ctrl+[` to return to Normal Mode.
- **Visual Mode**: Press `v` or `V` to start selecting text. Press `Esc` to return to Normal Mode.
- **Search**: For searching, use Google Docs' native `Ctrl+F` and `Ctrl+G`. The extension delegates search functionality to the native Google Docs experience.

## 🏗 Architecture

VimDocs works by injecting a content script (`src/content.js`) into Google Docs tabs. 

1.  **Event Interception**: The extension attaches a `keydown` listener in the capture phase to intercept keystrokes before Google Docs processes them.
2. **State Management**: It maintains a state machine to track the current mode (Normal, Insert, Visual) and any pending command sequences (e.g., `dd`).
3.  **Emulation Layer**: When a Vim command is triggered, the extension uses `src/emulator.js` to dispatch synthetic `KeyboardEvent`s (like `ArrowDown` or `Home`) to the Google Docs editor components.
4.  **UI Feedback**: A lightweight mode indicator is injected into the DOM to provide real-time feedback on the current mode and active command sequence.

## ⚠️ Known Limitations

### Clipboard Access
Due to browser security restrictions, the extension cannot directly programmatically access the system clipboard.
- When using `y` (yank) or `p` (put), a temporary UI toast will guide you to use native shortcuts (`Ctrl+C` / `Ctrl+V`).

### Delimiter Text Objects (`di(`, `ci"`, etc.)
Requires reading the document text to locate surrounding bracket/quote characters. Since Google Docs renders inside a canvas-based iframe, the text is not accessible from the extension's content script. 
- **Only `iw` (inner word) is supported**, as it relies on native word-boundary navigation shortcuts.

### Search
Due to Google Docs' complex rendering (Canvas-based) and the use of separate iframes for the find/replace toolbar, the extension cannot reliably manage a custom Vim search mode.
- Pressing `/`, `?`, `n`, or `N` will show a guidance toast directing you to use native shortcuts (`Ctrl+F`, `Ctrl+G`).
- This ensures full compatibility with Google Docs' native search and replace functionality.

### Macros (`q` / `@`)
Reliable macro replay is currently blocked by browser `isTrusted` event security, which prevents replayed keyboard events from being re-intercepted by the extension's own state machine without risking infinite loops.

## 📄 License

This project is licensed under the [ISC License](LICENSE).
