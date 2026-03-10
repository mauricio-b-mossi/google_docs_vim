# Project Context: VimDocs

**Goal**: Deliver a high-performance Vim editing experience within the Google Docs ecosystem.

## Current Implementation State

### ✅ Fully Implemented Features
- **Modal Logic**: Robust state machine for `NORMAL`, `INSERT`, and `VISUAL`.
- **Custom Navigation**: Remappable `h`, `j`, `k`, `l` via Chrome Storage.
- **Advanced Motions**: 
  - Word: `w`, `e`, `b`
  - Line: `0`, `^`, `$`
  - Document: `gg`, `G`
  - Paragraph/Page: `{`, `}`
- **Operators**: Supporting `d` (delete) and `c` (change) with motions.
  - **Yank**: Pressing `y` is a short-circuit command that only displays a guidance toast.


- **Text Objects**: `iw` (inner word) correctly targets current word.
- **Real-Time Synergy**: Auto-saving options with instant propagation to all tabs.

### 🛡 Delegation Strategies (Solutions for Technical Blockers)

1. **Clipboard (`y`, `p`)**:
   - *Blocker*: Programmatic clipboard access is restricted within cross-origin iframes.
   - *Solution*: Intercept Vim yanking keys and display a notification guiding users to press **`Ctrl+C`**. No automated selection or Vim-style yanking is implemented to maintain a clean UX boundary. `Ctrl+C` and `Ctrl+V` are passed through transparently.

2. **Search (`/`, `?`, `n`, `N`)**:
   - *Blocker*: Google Docs find/replace bar exists in a separate iframe, making programmatic interaction unreliable.
   - *Solution*: Intercept search keys and guide users to **`Ctrl+F`** and **`Ctrl+G`**. These native shortcuts are explicitly whitelisted in the event listener.

3. **Text Context (`di"`, `ci(`)**:
   - *Blocker*: Canvas rendering prevents the content script from reading "text" to find delimiters like brackets or quotes.
   - *Solution*: Limited to `iw` (inner word) which can be inferred via simulated cursor selection.

### ❌ Deprecated / Unfeasible Features
- **Macros (`q`, `@`)**: Replay logic is blocked by the `isTrusted` browser security flag on synthesized events.
- **Visual Block Mode (`Ctrl+V`)**: Implementing multi-line cursor blocks in Canvas is not possible without deep internal state access.

---

## Technical Maintenance
- **Build**: Vite + crxjs for Manifest V3 compliance.
- **Persistence**: `chrome.storage.sync` with an `onChanged` listener for real-time updates.
- **Injection**: Content script injected into all Google Docs frames to capture input at the lowest level.

## Documentation Reference
- See [ARCHITECTURE.md](file:///home/mauri/google-doc-vim/docs/ARCHITECTURE.md) for data flow and component hierarchy.
- See [TASK_HISTORY.md](file:///home/mauri/google-doc-vim/docs/TASK_HISTORY.md) for a chronological record of pivots.
