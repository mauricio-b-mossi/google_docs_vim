---
description: How to comprehensively document the project state after completing a major task
---

1. After completing significant features or architecture changes, review the recent git commits or your own short-term `task.md` memory to understand what was accomplished.
2. Read `docs/TASK_HISTORY.md`. Add a new bullet point or section detailing the *what* and *why* of your recent changes. Focus on architectural pivots or newly supported core features.
3. If your changes altered the overall architecture (e.g., added a background service worker, changed how state is handled in `content.js`), read `docs/ARCHITECTURE.md` and update it accordingly using `replace_file_content`.
4. If your changes fundamentally altered the scope or limits of the project, read `docs/PROJECT_CONTEXT.md` and update the "Current Status" or "Known Blockers" section.
5. If you learned a new "rule" about the codebase that future agents absolutely *must* know (like "Never do X because Google Docs blocks it"), append it to `.agentrc.md`.
6. Use `git add` and `git commit` to save these documentation updates as a separate commit (e.g., `docs: update agentic memory for feature X`).
