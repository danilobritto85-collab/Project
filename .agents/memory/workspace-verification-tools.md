---
name: Workspace verification tools
description: Artifact-local test executables are not necessarily available from the workspace root.
---

Invoke verification tools from the artifact package that owns them rather than assuming root-level executable resolution.

**Why:** Root-level `pnpm exec tsx` reported a missing command even though the web artifact already had the executable. Compiling tests from the root also missed the artifact's Node type declarations.

**How to apply:** Use `pnpm --filter <artifact-package> exec <tool>` for artifact-local test tools. Check the artifact's installed binaries before adding dependencies or creating a separate compilation workaround.
