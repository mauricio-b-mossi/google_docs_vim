# Architecture: VimDocs

## Tech Stack
- **Build Tool**: Vite (`vite.config.js`)
- **Extension Framework**: `@crxjs/vite-plugin` (Manifest V3)
- **UI Styling**: Vanilla CSS with CSS Variables (`options.css`)

## Directory Structure
```
/
├── manifest.json       # Extension configuration
├── package.json        # Dependencies and scripts (npm run build)
├── vite.config.js      # Vite build pipeline setup
├── .agentrc.md         # Onboarding instructions for AI agents
├── DESIGN_SYSTEM.md    # UI/UX aesthetic guidelines
├── docs/               # Project documentation
│   ├── PROJECT_CONTEXT.md
│   └── TASK_HISTORY.md
├── src/                # Core extension logic
│   ├── content.js      # Content script injected into Google Docs
│   ├── emulator.js     # Helper functions for dispatching key events
│   └── options.css     # Styling for the settings panel
├── options.html        # Settings panel structure
└── options.js          # Settings panel logic
```

## How It Works

1.  **Injection**: When a user opens Google Docs, `manifest.json` tells Chrome to inject `src/content.js`.
2.  **State Machine**: `content.js` maintains a `currentMode` (Normal, Insert, Visual).
3.  **Event Interception**: 
    - `content.js` attaches a `keydown` listener to `window` (with `capture: true`).
    - If enabled, it intercepts keystrokes before Docs processes them.
    - Modifier keys (`Ctrl+C`, `Ctrl+V`, `Ctrl+F`, `Ctrl+G`, `Ctrl+H`) are explicitly ignored to allow native OS/Docs functionality.
4.  **Emulation**: When a Vim command is recognized (e.g., `j`), `content.js` calls a helper in `src/emulator.js`. `emulator.js` reconstructs a synthetic `KeyboardEvent` (e.g., `ArrowDown`) and dispatches it directly to the nested `docs-editor` component or the active element.
5.  **UI Feedback / Guidance**: 
    - A Mode Indicator displays `-- NORMAL --`, `-- INSERT --`, etc.
    - For non-implementable Vim features (Clipboard access, Search), guidance toasts (e.g., `USE CTRL+F TO SEARCH`) appear to leverage native browser/Docs shortcuts.
6.  **Real-Time Settings**: 
    - Users customize keybindings and status line size in `options.html`. 
    - All changes are auto-saved to `chrome.storage.sync` immediately upon interaction.
    - **Live Preview**: The options page sends a `VIM_DOCS_SIZE_PREVIEW` message via `chrome.tabs.sendMessage` for instant UI feedback without requiring a save/storage cycle.
    - `content.js` uses a `chrome.storage.onChanged` listener to propagate settings globally across all open tabs instantly.


