# Task History: VimDocs

This file acts as a chronological changelog of major milestones and decisions. Future agents should read the most recent entries to understand the current trajectory.

## v1.0.0 (Foundation and UI)
- **Initiation**: Created base structure for Vim Google Docs extension.
- **Core Engine**: Implemented `content.js` state machine for Normal, Insert, and Visual modes.
- **Visual Mode Fixes**: Resolved bugs with `v` and `V` selection leaking into normal navigation.
- **Clipboard Handling Pivot**: After attempting synthetic copy/paste events (`document.execCommand`), discovered Google Docs iframe security prevents it. Pivoted to a *native pass-through* strategy. `Ctrl+C` and `Ctrl+V` are now explicitly ignored by the extension's `keydown` listener, and `y`/`p` show a toast to prompt the user.
- **Manifest Evolution**: Migrated to Vite/crxjs for modern bundling.
- **UI Customization**: Implemented a "Neon-Dark" settings panel (`options.html`) allowing users to:
  - Toggle the entire extension on/off.
  - Dynamically remap core navigation (`h`, `j`, `k`, `l`) via a "click-to-capture" interactive button UI.
- **Documentation**: Established this `docs/` folder, `.agentrc.md`, and agentic workflows to track progress and onboard future engineers.

## v1.1.0 (Roadmap Features — Partial)
- **Search** (`/` and `?`): Added `SEARCH` mode to the state machine. `/` or `?` in Normal mode opens the native Google Docs find toolbar (`Ctrl+F`), mirrors the query in the mode indicator (purple tint). `n`/`N` map to `Ctrl+G`/`Ctrl+Shift+G` and respect direction. Added `openFindBar()`, `findNext()`, `findPrev()` to `emulator.js`.
- **Text Objects (partial)**: `iw` text object implemented in `pendingOperator` handler (`ciw`, `diw`, `yiw`). Delimiter-based objects (`di(`, `ci"`, etc.) were prototyped but removed — see Known Blockers in `PROJECT_CONTEXT.md`.
- **Macros (attempted, reverted)**: `q`/`@` recording/replay was implemented but cannot work reliably due to the `isTrusted` constraint on replayed keystrokes. All macro code removed.

## v1.1.1 (Fixes & Cleanup)
- **Search cursor fix**: Enter in SEARCH mode no longer calls `e.preventDefault()`, allowing the real keypress to reach the Docs find bar. After Docs processes it, a synthetic `Escape` (30–50ms later) closes the find bar and places the cursor on the match — approximating Vim's post-search cursor placement.
- **Dead code removal**: Stripped `processNormalModeKey()` abstraction and all macro state variables. `content.js` is ~11.5 kB (down from ~12.4 kB).
- **Docs updated**: `PROJECT_CONTEXT.md` overhauled to accurately reflect implemented features, known blockers with root causes, and a feasibility-annotated roadmap.

## v1.1.2 (Custom Escape Key)
- **Custom escape**: Added a user-configurable alternate escape key in the options page ("Mode Shortcuts" section). Any single key can be mapped to act identically to `Escape` across all modes (Normal, Insert, Visual, Search).
- **`Escape` always reserved**: The physical `Escape` key is hardcoded and cannot be overridden — the custom key is an *additional* alias, not a replacement.
- **Conflict prevention**: The options UI blocks setting the custom escape to a key already used for navigation (and vice versa).
- **`isEscapeKey()` helper**: Introduced in `content.js` to centralise the escape check; all four mode handlers call it instead of hardcoded `key === 'Escape'` comparisons.
- **Storage**: `customEscape` persisted to `chrome.storage.sync`, loaded on init, and updated live via `onChanged`.

## v1.1.3 (Search Delegation & UI Fixes)
- **Search Mode Pivot**: Removed custom `SEARCH` mode. Search is now delegated entirely to native Google Docs shortcuts (`Ctrl+F`, `Ctrl+G`, `Ctrl+H`). 
- **Guidance Toasts**: Pressing `/`, `?`, `n`, or `N` in Normal Mode now triggers a guidance toast (like Yank/Paste) to direct users to native shortcuts.
- **Transparency**: Explicitly made `Ctrl+F`, `Ctrl+G`, and `Ctrl+H` transparent in the `keydown` listener.
- **Disable Toggle UX**: Added "VIM DISABLED/ENABLED" toasts when toggling the extension. Mode now resets to `NORMAL` on both disable and enable.
- **Refactoring**: Extracted `handleOperatorSequence` in `content.js` for better readability and removed duplicate `case 'u'` logic.
- **Build Verification**: Verified all changes with clean production builds (`npm run build`).

## v1.1.4 (Real-Time Synergy)
- **Auto-Save Refactor**: Eliminated the manual "Save" button in settings. All settings (toggle, keys, size) now persist instantly on interaction.
- **Visual Feedback**: Added a "SAVED" indicator in the options dashboard.
- **Messaging System**: Implemented `chrome.tabs.sendMessage` for live status line size previews, allowing users to see size changes in Docs before releasing the slider.
- **Documentation Overhaul**: Comprehensive update of `README.md` and `docs/` to provide a full command matrix, limitation solutions, and architectural details.
