<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `bunx convex ai-files install`.
<!-- convex-ai-end -->

## Project conventions

1. **Package manager:** Always use [Bun](https://bun.sh) instead of npm — use `bun install`, `bun run`, `bunx`, etc., not `npm`, `npx`, or `yarn`.
2. **React:** Do not use `useEffect()`. Prefer declarative data flow, event handlers, derived state, framework primitives (e.g. Server Components, loaders), or other patterns that avoid effect-based synchronization.
