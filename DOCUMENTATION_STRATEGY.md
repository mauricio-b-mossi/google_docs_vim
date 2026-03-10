# Project Documentation Strategy

To ensure seamless onboarding and context continuity for both human engineers and AI agents, I recommend implementing a structured documentation system directly within the repository.

This system relies on maintaining a few key markdown files that act as the "brain" of the project, clearly separating context, architecture, and task history.

## 1. The Core Documents

I propose adding a `.docs` or `docs/` or even an `.agents` folder (which we've already started to use for workflows) at the root of the repository, containing the following files:

### `PROJECT_CONTEXT.md` (The "What and Why")
- **Purpose**: A high-level overview of the project's goal, target audience, and current status.
- **Content**:
    - Elevator pitch.
    - Key features completed.
    - Known limitations/blockers (e.g., "Google Docs iframe security prevents native clipboard API access").
    - Links to important resources (like `DESIGN_SYSTEM.md`).

### `ARCHITECTURE.md` (The "How")
- **Purpose**: A technical breakdown of how the codebase is structured.
- **Content**:
    - Directory structure and the responsibility of each key file (e.g., what `content.js` does vs `emulator.js`).
    - Core mechanisms (e.g., "How we intercept key events in the Google Docs Canvas").
    - State management (e.g., "Modes are tracked via 'currentMode' in content.js, synced with UI via messaging").
    - Build process (e.g., "Using Vite with CRXJS for modern extension building").

### `CHANGELOG.md` or `TASK_HISTORY.md` (The "When")
- **Purpose**: A running log of major milestones, decisions, and completed tasks.
- **Content**:
    - Chronological list of features added.
    - Important architectural pivots (e.g., "Switched from executiveCommand('copy') to native pass-through on YYYY-MM-DD").

## 2. Agentic Integration (The "Prompt Context")

For AI agents specifically, having a single entry-point file is often the most effective.

I recommend creating a `.cursorrules` or `.agentrc.md` file at the root.

### `.agentrc.md`
This file acts as the ultimate system prompt augmentation for any agent joining the project.
```markdown
# Agent Onboarding

Welcome to the VimDocs project. Please review the following before making changes:
1. **Context**: Read `docs/PROJECT_CONTEXT.md` to understand our goals and iframe limitations.
2. **Design**: Read `DESIGN_SYSTEM.md` for our Neon-Dark aesthetic. DO NOT use generic Tailwind colors.
3. **Architecture**: Read `docs/ARCHITECTURE.md` to see where code lives.

**Critical Rules**:
- Do not attempt to use `navigator.clipboard`. We use native shortcut pass-throughs.
- Always use `npm run build` to compile the Vite extension.
- UI changes must update `options.css` and `options.html`.
```

## 3. Workflow Implementation

To keep this updated without friction, we can create a workflow script (e.g., `npm run update-docs`) or an agentic workflow in `.agents/workflows/update-docs.md` that instructs an agent to:
1. Review recent git commits.
2. Update the `TASK_HISTORY.md`.
3. Check if architectural changes were made and update `ARCHITECTURE.md` accordingly.

Would you like me to generate these initial files (`PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, and `.agentrc.md`) based on everything we've built so far?
