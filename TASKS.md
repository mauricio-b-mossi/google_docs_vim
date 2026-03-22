# Reference Manual Implementation - Parallel Tasks

This document outlines the independent tasks for implementing the Reference Manual feature across the website, extension options, and in-app overlay. The work has been divided to ensure that Agents A, B, and C can work entirely in parallel without encountering git conflicts or overlapping file logic.

---

## 👨‍💻 Agent A: Website Documentation Creation
**Goal**: Create a dedicated Command Reference page on the VimDocs website.
**Files to Modify**: `website/reference.html`, `website/index.html` (optional), `website/styles.css` (optional)

**Instructions for Agent A**:
1. Create a new file `website/reference.html`.
2. Extract the "Command Overview" and "Limitations / Transparency" content from `website/index.html` into this new page. Make sure the new page retains the project's Neon-Dark aesthetic.
3. Provide a clear "Back to Home" button or link in `reference.html`.
4. (Optional) In `website/index.html`, update links or add a button that points to the new `reference.html` page.
5. The final hosted URL will be relative to the GitHub pages root, e.g., `https://mauricio-b-mossi.github.io/google_docs_vim/reference.html`.

---

## 👨‍💻 Agent B: Extension Setting Menu Integration
**Goal**: Add a quick access button in the extension's `options.html` page that navigates to the new website reference link.
**Files to Modify**: `options.html`, `options.js`, `src/options.css`

**Instructions for Agent B**:
1. Open `options.html` and locate the header or a prominent new section (e.g., "Documentation").
2. Add a new button or anchor tag labeled "Command Reference" or "Cheat Sheet".
3. Style the button in `src/options.css` to match the existing Neon-Dark aesthetic (e.g., using `var(--primary)`).
4. Make the button open `https://mauricio-b-mossi.github.io/google_docs_vim/reference.html` in a new tab. You can do this via a simple `<a target="_blank">` tag or by adding a click listener in `options.js` that uses `chrome.tabs.create({ url: "..." })`.

---

## 👨‍💻 Agent C: In-App `:help` Overlay (Content Script)
**Goal**: Implement an in-app help modal inside Google Docs triggered by `:help` and closed by `:q` or `Escape`.
**Files to Modify**: `src/content.js`

**Instructions for Agent C**:
1. Open `src/content.js`.
2. Modify `handleNormalModeEvent` to intercept the `:` key. 
3. When `:` is pressed, you need to capture the subsequent characters until `Enter` is pressed. If the sequence is `help`, display the Help Overlay. If the sequence is `q`, close the Help Overlay (if open). 
    - *Tip*: You might want to create a lightweight `COMMAND` mode or simply handle this as a special string buffer in `NORMAL` mode.
4. Create a function `toggleHelpOverlay(show)` that injects a `div` element (e.g., `<div id="vim-docs-help-overlay">`) containing a quick CSS-styled cheat sheet of the available commands. Ensure its `z-index` is high enough to sit above the Google Docs canvas, and use `#333` / `#fff` styling to match the mode indicator.
5. Ensure that hitting `Escape` or `:q` removes the overlay from the DOM and returns the user to normal typing.
