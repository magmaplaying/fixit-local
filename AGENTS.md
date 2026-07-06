<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Known trap (verified 2026-07-06): **do not add `loading.tsx`** to a route. In this
fork a Suspense loading boundary parks the streamed page in a hidden container
and never swaps it in; fixing that requires `export const unstable_instant`,
which in turn requires `nextConfig.cacheComponents` — an app-wide caching-model
change this project hasn't adopted. Skeleton/instant loading states are blocked
on that migration. After removing a bad segment-config export, restart the dev
server — Turbopack keeps serving the stale compile error.
<!-- END:nextjs-agent-rules -->
