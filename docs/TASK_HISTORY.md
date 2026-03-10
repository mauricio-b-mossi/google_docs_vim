# Task History: VimDocs

This file acts as a chronological changelog of major milestones and decisions. Future agents should read the most recent entries to understand the current trajectory.

## v1.0.0 (Foundation and UI)
- **Initiation**: Created base structure for Vim Google Docs extension.
- **Core Engine**: Implemented `content.js` state machine for Normal, Insert, and Visual modes.
- **Visual Mode Fixes**: Resolved bugs with `v` and `V` selection leaking into normal navigation.
- **Clipboard Handling Pivot**: After attempting synthetic copy/paste events (`document.execCommand`), discovered Google Docs iframe security prevents it. Pirvoted to a *native pass-through* strategy. `Ctrl+C` and `Ctrl+V` are now explicitly ignored by the extension's `keydown` listener, and `y`/`p` show a toast to prompt the user.
- **Manifest Evolution**: Migrated to Vite/crxjs for modern bundling.
- **UI Customization**: Implemented a "Neon-Dark" settings panel (`options.html`) allowing users to:
  - Toggle the entire extension on/off.
  - Dynamically remap core navigation (`h`, `j`, `k`, `l`) via a "click-to-capture" interactive button UI.
- **Documentation**: Established this `docs/` folder, `.agentrc.md`, and agentic workflows to track progress and onboard future engineers.
