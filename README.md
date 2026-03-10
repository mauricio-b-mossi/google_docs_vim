# VimDocs — Vim for Google Docs

**VimDocs** brings the efficiency of modal editing to Google Docs. It transforms the standard typing experience into a powerful text-manipulation engine using Vim's core philosophies.

## 🚀 Key Features

- **Modal Editing**: Toggle between **Normal**, **Insert**, and **Visual** modes seamlessly.
- **Real-Time Synergy**: Settings update instantly across all open Google Docs tabs.
- **Customizable Dashboard**: A premium, neon-dark settings interface (`dist/options.html`).
- **Native Pass-Through**: Cleverly delegates restricted browser APIs (Clipboard, Search) to native Google Docs shortcuts with helpful guidance.
- **Customizable Escape**: Map an additional key (like `j`) to exit modes, while `Esc` remains always active.

---

## 🎮 Command Reference

### Normal Mode (Navigation)
| Key | Action |
| :--- | :--- |
| `h`, `j`, `k`, `l` | Basic movement (Left, Down, Up, Right) - **Remappable** |
| `w`, `e`, `b` | Word-level navigation (Start, End, Backward) |
| `0`, `^` | Jump to start of line |
| `$` | Jump to end of line |
| `gg`, `G` | Jump to start / end of document |
| `{`, `}` | Page Up / Page Down |

### Normal Mode (Editing)
| Key | Action |
| :--- | :--- |
| `i`, `I` | Enter Insert Mode (at cursor / at start of line) |
| `a`, `A` | Enter Insert Mode (after cursor / at end of line) |
| `o`, `O` | Open new line below / above and enter Insert Mode |
| `x`, `D`, `C` | Delete character / delete to end / change to end |
| `u`, `Ctrl+R` | Undo / Redo |

### Operators (`d`, `c`, `y`)
Combine these with motions for powerful editing.
- **Examples**: `dw` (delete word), `cc` (change line).
- **Text Objects**: Supports `iw` (inner word), e.g., `ciw`.
- **Yanking/Copying**: Pressing `y` immediately shows a guidance toast prompting you to use **`Ctrl+C`**. The extension does **not** handle yanking or automated selection to ensure a clear boundary between extension logic and native system shortcuts.



---

## 🛠 Limitations & Pro-Tips

Due to the unique architecture of Google Docs (Canvas-based rendering) and browser security models, some features are handled via **Delegation Strategy**:

| Feature | Limitation | Extension Strategy |
| :--- | :--- | :--- |
| **Clipboard** (`y`, `p`) | Programmatic access blocked by Chrome. | Shows toast: **"USE CTRL+C / CTRL+V"**. |
| **Search** (`/`, `?`, `n`) | Docs find-bar is in a separate iframe. | Shows toast: **"USE CTRL+F / CTRL+G"**. |
| **Text Objects** | Cannot read "content" to find brackets/quotes. | **`iw` (inner word)** is supported. |
| **Macros** | Blocked by `isTrusted` security constraints. | Feature removed for stability. |

---

## ⚙️ Customization

Access the settings dashboard by clicking the extension icon.
- **Navigation Keys**: Click to capture any key for `h`, `j`, `k`, `l`.
- **Status Line Size**: Adjust the mode indicator size (10px - 30px) with real-time preview.
- **Additional Escape**: Map an alias to `Escape` for faster mode exits.
- **Global Toggle**: Instantly enable or disable the entire extension.

---

## 🛠 Development & Build

1. **Clone & Install**:
   ```bash
   npm install
   ```
2. **Build for Production**:
   ```bash
   npm run build
   ```
3. **Load in Chrome**:
   Load the `dist/` directory as an unpacked extension in `chrome://extensions`.

---

*VimDocs is built for speed.* ⚡
