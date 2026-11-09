# Starter

Part of AUGUR, which is proprietary; see `LICENSE`.

What Starter is for, in a line: say it here and in `manifest.json`'s description.

<!-- template-only -->
## A new app in 15 minutes

This repository is the template every AUGUR app starts from, on the app contract (contract 3): a manifest
that says what the shell draws for the app, a Score file for each of its parts (an inbound service and a
migration job), a frontend that runs in the shell's worker and draws Quill's remote elements, one file of
wire types the service and the frontend share, CI that checks all of it, workflows that build, sign and
release it, and a stub of its scenarios for AUGUR's run suite. It works as it is; you only give it a name.

You need Node 22, pnpm 10, a GitHub token that can read GitHub Packages (classic, `read:packages`) and a
checkout of [AUGUR](https://github.com/harry-burton-dev/augur) next to where your app will go.

Backstage does steps 1 and 2 for you: **Create** → **New AUGUR app** makes `augur-<id>`, names it (the
**Name the app** workflow) and adds it to the catalog. Clone it and carry on from step 3. By hand:

1. **Make the repository.** On GitHub, **Use this template** → **Create a new repository**, named
   `augur-<id>`. Clone it next to your AUGUR checkout.
2. **Name it.** The id is the app's address (`/<id>`), its prefix behind the gateway (`/api/<id>`) and
   the name of its sign-in, schema and network: 2 to 40 lowercase letters, digits and dashes.
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
   in its worker and your service beside it, signed in as a stand-in person. Edit either and it reloads.
   AUGUR's `docs/build-an-app.md` says what the stand-in shell does and doesn't do.
4. **Push it.** Commit and push to `main`. Then, in the repository's settings:
   - Secrets: `PACKAGES_READ_TOKEN` (reads AUGUR's packages) and `APP_RELEASES_TOKEN` (tells AUGUR's
     release feed about a new release).
   - Secret `RELEASE_TOKEN`: a fine-grained token for this repository with Contents and Pull requests
     write, so the Version packages pull request opens itself and its CI starts.
   - Actions → General → Workflow permissions: **Read and write**, with **Allow GitHub Actions to create
     and approve pull requests** ticked (without `RELEASE_TOKEN`, the Release workflow needs it).
   - Ask the admins of each deployment that should run it to add this repository to its
     `APP_PUBLISHERS`, so it trusts what the repository releases (AUGUR's ADR 0047).

How long the machine's part of steps 2 and 3 takes is timed by **Actions → Time to the shell** in the template
repository (alpha goal 6: 15 minutes in all).

### What happens when someone opens it

- **Start.** The shell draws the app bar entry, the rail's places and the About panel's sections from
  `manifest.json`, before any of the app's code loads. It starts the app's worker with
  `frontend/src/entry.ts` (built to the manifest's `frontend.entry`, served from `/apps/<id>/<version>/`)
  and calls its `start(ctx)`: the person, the floor, the path, and the calls the bridge carries. The
  worker has no DOM, no network and no token.
- **Draw.** `start` describes the screen in Quill's remote elements by name (`frontend/src/screen.ts`:
  `quill-section`, `quill-state`, `quill-notice`, `quill-button`), sets its pane's title and actions with
  `ctx.frame.set`, handles its `contributes.commands` with `ctx.frame.onCommand`, and fills its
  `contributes.about` sections with `ctx.frame.about(id)`. The shell draws them with the real kit and
  drops anything else, saying why on the console.
- **Call.** `ctx.fetch('/api/<id>/v1/greeting')` goes over the bridge; the shell adds the person's
  token, the floor and the app's id, and the gateway checks the app is on for the person there, then
  signs a delegated caller (the person, the floor, the app and its scopes, for `app-<id>` only) and sends
  the call to the inbound part, `score/web.score.yaml`. The part believes only that signed caller
  (`service/src/app.ts`; the service kit's `appServer` checks the audience) and answers; the shell hands
  the bytes back to the worker.
- **Events.** With `events:subscribe`, AUGUR pushes each event the app may see to the inbound part as
  `POST /augur/events`, signed as its events service, with an `Idempotency-Key`. The part keeps each key
  once and answers 204 (`service/src/events.ts`); anything else, and the event comes again.
- **Install.** A deployment installs the release file the Release workflow attaches (release v2, written
  by `augur-app release publish`): the manifest, the frontend by digest, each part's Score file with its
  image pinned by digest, who signed it, and the asks an admin agrees to. The runner runs `migrate` to completion, starts `web`, waits for
  its `/healthz` to answer the release's version, then switches over.

Then make it yours: draw your screens in `frontend/src/screen.ts`, declare their places, commands and
About sections in `manifest.json`, add routes to `service/src/app.ts` with their types in
`service/src/api-types.ts`, ask for what the parts need in `score/`, and replace this section of the README
with what the app is for.
<!-- /template-only -->

| Path | What it is |
| --- | --- |
| `manifest.json` | What the shell draws for the app (places, commands, About sections), its settings, the scopes it asks for and the floors it works on (manifest 3). `$schema` points at the schema in `@augur/app-tools`, so your editor checks it; `pnpm check:app` checks it as the registry will |
| `score/` | One Score file per part: `web` (the inbound service, with its database, setting and scratch folder) and `migrate` (a job that runs the migrations before each install switches over). Each says what the part asks for and its limits; `image: .` is pinned by digest in the release |
| `catalog-info.yaml` | The app's entry in Backstage's catalog, written from the manifest and the package.json files by `augur-app catalog`. Don't edit it: CI checks it's current (`pnpm check:catalog`) and Version packages rewrites it |
| `service/` | The image both parts run (`@apps/starter`): `src/app.ts` its routes and `/healthz`, `src/events.ts` the events pushed to it, `src/migrations.ts` its schema, `src/index.ts` and `src/migrate.ts` what each part starts, each reaching the app's database with the service kit's `appDatabaseFromEnv` (none under `pnpm dev:app`) |
| `service/src/api-types.ts` | The wire types, written once: the service answers with them, its OpenAPI document describes them and the frontend reads them |
| `frontend/` | What the shell runs in the app's worker (`@apps/starter-frontend`): `src/entry.ts` its `start(ctx)`, `src/screen.ts` what it draws |
| `run/index.ts` | Its scenarios for AUGUR's run suite (augur-run): give each a RUN id there when the app joins the proving run |

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm check:app` run everything; set
`NODE_AUTH_TOKEN` first.

## Releases

| Workflow | When | What |
| --- | --- | --- |
| CI | Every pull request | Lint, typecheck, test and build, and the manifest, the Score files and the release file they make checked against contract 3 |
| App previews | A pull request that changes the app | A signed preview its developers can run beside the app |
| App dev builds | Every merge into main | A signed dev build for preview servers |
| Release | Merging Version packages | The beta release `app/starter@<version>`, then AUGUR's feed lists it |

Every pull request carries a changeset (`pnpm changeset`). The first one, `.changeset/first-release.md`,
releases the app as 0.1.0. An empty changeset (`pnpm changeset --empty`) never holds back a release. The template repository itself releases nothing: the three release workflows
skip a repository marked as a template.
