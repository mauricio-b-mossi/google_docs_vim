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

### Visual Mode
- Supports character-wise (`v`) and line-wise (`V`) selection.
- Apply operators like `d`, `c`, `y` on selection.

### Customization
- Fully customizable keybindings for basic navigation via the extension's options page.
- Toggle extension on/off globally.

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

## 🏗 Architecture

VimDocs works by injecting a content script (`src/content.js`) into Google Docs tabs. 

1.  **Event Interception**: The extension attaches a `keydown` listener in the capture phase to intercept keystrokes before Google Docs processes them.
2.  **State Management**: It maintains a state machine to track the current mode (Normal, Insert, Visual) and any pending command sequences (e.g., `dd`).
3.  **Emulation Layer**: When a Vim command is triggered, the extension uses `src/emulator.js` to dispatch synthetic `KeyboardEvent`s (like `ArrowDown` or `Home`) to the Google Docs editor components.
4.  **UI Feedback**: A lightweight mode indicator is injected into the DOM to provide real-time feedback on the current mode and active command sequence.

## ⚠️ Known Limitations

### Clipboard Access
Due to browser security restrictions, the extension cannot directly programmaticallly access the system clipboard.
- When using `y` (yank) or `p` (put), a temporary UI toast will guide you to use native shortcuts (`Ctrl+C` / `Ctrl+V`).
- The extension explicitly allows these native modifier combinations to pass through un-intercepted.

## 📄 License

This project is licensed under the [ISC License](LICENSE).
