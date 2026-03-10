# Project Context: VimDocs

**Goal**: Bring the power and speed of Vim modal editing to Google Docs users.

## Why this exists
Google Docs lacks natively customizable shortcuts for advanced typography and navigation. VimDocs intercepts standard key presses and translates them into navigation and editing commands within the Google Docs canvas.

## Current Status
- **Core Navigation**: Implemented (`h`, `j`, `k`, `l` — dynamically customizable via options page).
- **Core Modes**: Implemented (Normal, Insert, Visual).
- **Advanced Navigation**: Implemented (`w`, `e`, `b`, `0`, `^`, `$`, `gg`, `G`, `{`, `}`).
- **Editing**: Implemented (`x`, `d`, `c`, `D`, `C`, `s`).
- **Visual Mode**: Working (`v` character, `V` line; movement extends selection).
- **Search**: Delegated to native Google Docs. Pressing `/`, `?`, `n`, or `N` triggers a guidance toast directing users to native `Ctrl+F`/`Ctrl+G`.
- **Text Objects**: `iw` only (`ciw`, `diw`, `yiw`). Delimiter objects (`i(`, `i"`, etc.) are **not implementable** — see Known Blockers.
- **Custom Escape Key**: Users can configure an additional key (e.g. `j`) to exit any mode, identical to `Escape`. The physical `Escape` key is always reserved regardless of this setting.

## Known Blockers & Solutions

1. **Clipboard**: The browser fiercely protects clipboard access within the Docs iframe. We cannot synthetically trigger a copy or paste.
   - *Solution*: `y`/`p` show a toast guiding users to `Ctrl+C`/`Ctrl+V`. Those shortcuts are explicitly passed through un-intercepted.

2. **Delimiter text objects** (`di(`, `ci"`, etc.): Requires reading the document text to locate surrounding bracket/quote characters. Google Docs renders inside a canvas-based iframe — the text is not accessible from the extension's content script.
   - *No solution available* without a Google Docs API integration (which doesn't exist for real-time editing).

3. **Macros** (`q`/`@`): Macro replay needs to re-trigger the Normal mode handler. The `isTrusted` guard (essential to block infinite loops from synthetic events dispatched to Docs) blocks replayed keystrokes from cycling back through our handler.
   - *No clean solution*. Bypassing the `isTrusted` check risks breakage. Deferred to future research.

4. **Search Delegation**: Due to Google Docs' complex rendering (Canvas-based) and separate iframes for the find/replace toolbar, maintaining a custom Vim Search Mode integrated into the Docs UI is not reliable.
   - *Solution*: Search is handled transparently by native Docs shortcuts. The extension provides guidance toasts to bridge the UX gap.

## Future Roadmap

### Feasible
- **Count prefixes** (`3w`, `5dd`, `10j`): Pure state machine work, no DOM access needed.
- **`f`/`F`/`t`/`T` character-find motions**: Requires the same text-reading workaround as delimiter objects — currently not feasible, but worth revisiting if a reliable text-extraction method emerges.
- **`s` (substitute) improvements**: Currently maps to `cl`. Could be refined.
- **Mark-based navigation** (`m`, `` ` ``, `'`): Would require storing cursor positions via the Docs API or a selection snapshot — may be feasible.

### Requires Docs API / Not Feasible Without Browser Access
- **Delimiter text objects** (`di(`, `ci"`, etc.)
- **Macros with faithful replay**
- **Visual block mode** (`Ctrl+V`)
- **`:` command mode** (Ex commands)
