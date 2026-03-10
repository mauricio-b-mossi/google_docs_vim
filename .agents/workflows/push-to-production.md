---
description: How to build, commit, and push the project to production
---

// turbo-all

Follow these steps to ensure a safe and automated push to production:

1. **Verify the build**
   Run the build script to ensure there are no compilation errors before pushing.
   ```bash
   npm run build
   ```

2. **Stage all changes**
   Stage all modified and new files for the commit.
   ```bash
   git add .
   ```

3. **Commit the changes**
   Commit the staged changes with a descriptive message. If no message is provided, use a generic "Internal updates and production build" message.
   ```bash
   git commit -m "Production release: $(date +'%Y-%m-%d %H:%M:%S')"
   ```

4. **Push to master**
   Push the committed changes to the remote `master` branch.
   ```bash
   git push origin master
   ```
