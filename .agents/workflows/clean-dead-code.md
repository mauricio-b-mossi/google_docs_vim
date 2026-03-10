---
description: How to clean dead code from the project
---
1. Analyze the project structure and identify core files using `list_dir`.
2. Inspect the codebase for common dead code indicators:
   - Commented-out blocks of code or legacy functions.
   - Unused imports, variables, or constants no longer needed after recent refactors.
   - Functions or methods that are defined but never called.
   - Unreachable code (e.g., code after a return statement).
3. If a linter like ESLint or a type checker like TypeScript is configured, run it using `run_command` (e.g., `npm run lint`) to automatically detect unused variables and imports.
4. Manually search for exported functions or variables out of suspicion using `grep_search` to ensure they are actually imported and used elsewhere in the project.
5. Use `replace_file_content` or `multi_replace_file_content` to carefully delete the identified dead code. Make sure to prune related comments and console.logs.
6. Verify the application build process still succeeds to ensure no active code was accidentally removed.
// turbo
7. Verify the build step by running `npm run build` using the run_command tool.
