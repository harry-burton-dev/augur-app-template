# Starter: notes for coding agents

Starter is an AUGUR app. It lives in its own repository and is built only against AUGUR's published
packages (`@augur/*`, aliased from `@harry-burton-dev/augur-*` on GitHub Packages). AUGUR itself, its ADRs
and its guides are in the `augur` repository; read its AGENTS.md and the ADRs there before changing how
this app reaches the platform.

<!-- template-only -->
This is the app template (`augur-app-template`). A change here is a change to every app made from it
from now on: keep it to what every app needs, keep it working as it is, and carry each pull request with
an empty changeset (`pnpm changeset --empty`), so `.changeset/first-release.md` stays the only real one.
<!-- /template-only -->

## Where to look
- AUGUR's ADRs (`augur` docs/decisions), especially 0012 (apps in their own repositories), 0015
  (React, Quill, Tailwind), 0047 (how this repository releases) and 0055 (one source per API).
- AUGUR's `docs/build-an-app.md`: the SDK, the service kit and the stand-in shell.
- This app's own decisions: `docs/decisions/` here.

## Rules
- The same rules as AUGUR: names, limits and URLs come from config or the manifest, never literals from chat;
  unavailable things stay visible and say why; a new dependency needs a record.
- Reach AUGUR only through `@augur/*` packages, the gateway, the manifest and events. Never bundle React or
  the kit: the shell serves them (`isSharedModule` in vite.config.ts).
- Wire types live once, in `service/src/api-types.ts`.
- Every pull request carries a changeset (`pnpm changeset`). Merging the Version packages pull request
  releases the app as a beta; AUGUR's Promote to stable makes it stable.
- `pnpm install`, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Locally you need
  `NODE_AUTH_TOKEN` set to a token that can read GitHub Packages.
- Merge your own pull request once CI is green, after merging fresh `origin/main` into it.
- Nothing in the repository names the tool that wrote it: no assistant trailers on commits or attribution
  in pull requests, and no links to private chats.
