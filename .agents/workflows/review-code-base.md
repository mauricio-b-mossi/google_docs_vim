---
description: How to comprehensively review the code base
---
1. Start by utilizing the `list_dir` and `view_file_outline` tools to map out the structure of the project and understand the main components at a high level.
2. Read the `package.json`, `manifest.json`, or other configuration files to understand the project's dependencies, runtime environment, and entry points.
3. Read the core implementation files iteratively using `view_file`.
4. Systematically analyze the code against the following pillars:
   - **Structural Quality**: Are functions getting too large? Is there duplicated code (DRY principle violated)? Can large logic blocks be abstracted into smaller atomic helper functions?
   - **Correctness/Logic**: Are there missing edge cases, improper type casts, or logical bugs?
   - **Maintainability**: Are variables and functions named expressively? Are comments outdated or missing for complex logic? Are there hardcoded values that should be configurable constants?
   - **Security & Performance**: Are there inefficient DOM manipulations, memory leaks (e.g. un-cleared intervals/listeners), or un-sanitized inputs?
5. Propose and document specific, actionable changes.
6. Use the `multi_replace_file_content` tool to iteratively implement these structural, performance, and correctness fixes.
7. Always ensure the project still builds and runs correctly after review changes.
// turbo
8. Verify that the build succeeds by running `npm run build` using the run_command tool.
