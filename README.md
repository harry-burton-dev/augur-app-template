# Starter

Part of AUGUR, which is proprietary; see `LICENSE`.

What Starter is for, in a line: say it here and in `manifest.json`'s description.

<!-- template-only -->
## A new app in 15 minutes

This repository is the template every AUGUR app starts from: a service on the service kit's starter
(`startAppService`), a React frontend on Quill's starter (`defineReactApp`), one file of wire types both
share, a manifest the registry checks, CI that builds, signs and releases it, and a stub of its scenarios
for AUGUR's run suite. It works as it is; you only give it a name.

You need Node 22, pnpm 10, a GitHub token that can read GitHub Packages (classic, `read:packages`) and a
checkout of [AUGUR](https://github.com/harry-burton-dev/augur) next to where your app will go.

Backstage does steps 1 and 2 for you: **Create** → **New AUGUR app** makes `augur-<id>`, names it (the
**Name the app** workflow) and adds it to the catalog. Clone it and carry on from step 3. By hand:

1. **Make the repository.** On GitHub, **Use this template** → **Create a new repository**, named
   `augur-<id>`. Clone it next to your AUGUR checkout.
2. **Name it.** The id is the app's route (`/<id>`) and its prefix behind the gateway (`/api/<id>`): 2 to
   40 lowercase letters, digits and dashes.
   ```sh
   export NODE_AUTH_TOKEN=<your token>
   pnpm make-app expenses --name "Expenses"
   pnpm install && pnpm test
   ```
3. **Run it in the shell.** From your AUGUR checkout (after its own `pnpm install`):
   ```sh
   pnpm dev:app ../augur-expenses
   ```
   Open http://localhost:5173/expenses. It's AUGUR's real shell and kit, with your frontend from source
   and your service beside it, signed in as a stand-in person. Edit either and it reloads. AUGUR's
   `docs/build-an-app.md` says what the stand-in shell does and doesn't do.
4. **Push it.** Commit and push to `main`. Then, in the repository's settings:
   - Secrets: `PACKAGES_READ_TOKEN` (reads AUGUR's packages) and `APP_RELEASES_TOKEN` (tells AUGUR's
     release feed about a new release).
   - Secret `RELEASE_TOKEN`: a fine-grained token for this repository with Contents and Pull requests
     write, so the Version packages pull request opens itself and its CI starts.
   - Actions → General → Workflow permissions: **Read and write**, with **Allow GitHub Actions to create
     and approve pull requests** ticked (without `RELEASE_TOKEN`, the Release workflow needs it).
   - Add the repository to AUGUR's `release/app-repos.json` in a pull request there, so deployments
     trust what it releases (AUGUR's ADR 0047).

How long the machine's part of steps 2 and 3 takes is timed by **Actions → Time to the shell** in the template
repository (alpha goal 6: 15 minutes in all).

Then make it yours: rename the places in `frontend/src/app.tsx`, add routes to `service/src/app.ts`, keep
their types in `service/src/api-types.ts`, and replace this section of the README with what the app is for.
<!-- /template-only -->

| Path | What it is |
| --- | --- |
| `manifest.json` | How the registry lists the app: its route, entry, floors, the SDK range it works with. `$schema` points at AUGUR's published schema, so your editor checks it |
| `service/` | The app's own API behind the gateway at `/api/starter` (`@apps/starter`): `src/app.ts` its routes, `src/index.ts` starts it |
| `service/src/api-types.ts` | The wire types, written once: the service answers with them and the frontend reads them |
| `frontend/` | The micro frontend the shell mounts at `/starter` (`@apps/starter-frontend`): `src/entry.tsx` is what the shell loads, `src/app.tsx` its places |
| `run/index.ts` | Its scenarios for AUGUR's run suite (augur-run): give each a RUN id there when the app joins the proving run |
| `docs/decisions/` | Decisions that only concern this app |

`pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` run everything; set `NODE_AUTH_TOKEN` first.

## Releases

| Workflow | When | What |
| --- | --- | --- |
| CI | Every pull request | Lint, typecheck, test and build |
| App previews | A pull request that changes the app | A signed preview its developers can run beside the app |
| App dev builds | Every merge into main | A signed dev build for preview servers |
| Release | Merging Version packages | The beta release `app/starter@<version>`, then AUGUR's feed lists it |

Every pull request carries a changeset (`pnpm changeset`). The first one, `.changeset/first-release.md`,
releases the app as 0.1.0. An empty changeset (`pnpm changeset --empty`) never holds back a release. The template repository itself releases nothing: the three release workflows
skip a repository marked as a template.
