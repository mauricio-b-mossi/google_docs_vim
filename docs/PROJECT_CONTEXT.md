# Project Context: VimDocs

**Goal**: Bring the power and speed of Vim modal editing to Google Docs users.

## Why this exists
Google Docs lacks natively customizable shortcuts for advanced typography and navigation. VimDocs intercepts standard key presses and translates them into navigation and editing commands within the Google Docs canvas.

## Current Status
- **Core Navigation**: Implemented (`h`, `j`, `k`, `l` - dynamically customizable).
- **Core Modes**: Implemented (Normal, Insert, Visual).
- **Advanced Navigation**: Implemented (`w`, `e`, `b`, `0`, `^`, `$`, `gg`, `G`).
- **Editing**: Implemented (`x`, `d`, `c`, `s`, `D`, `C`).
- **Visual Mode Integration**: Working for selecting lines (`V`) and characters (`v`).

## Known Blockers & Solutions
1.  **Clipboard**: The browser fiercely protects clipboard access within the Docs iframe. We cannot synthetically trigger a copy or paste.
    - *Solution*: When a user presses `y` or `p`, we show a UI toast guiding them to use `Ctrl+C` or `Ctrl+V`. The extension explicitly allows these shortcuts to pass through un-intercepted.

## Future Roadmap (Ideas)
- Search (`/` and `?`).
- Text objects (`ciw`, `di(`).
- Macros (`q`).
