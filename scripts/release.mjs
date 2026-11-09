// The app's release file on contract 3: `augur.app-release/v2` (AUGUR's app contract, 3.3), written with
// @augur/app-tools from manifest.json, score/*.score.yaml and what `augur-app bundle` pushed. Each part's
// image is pinned to the digest the build pushed, and `asks` says what an admin agrees to.
//   node scripts/release.mjs describe [bundle.json]   prints the release file (placeholder digests without one)
//   node scripts/release.mjs publish <bundle.json>    makes the GitHub release app/<id>@<version> with it attached
// The workflows run it where `augur-app publish` wrote release v1; app-tools' own `augur-app release`
// takes its place once it ships.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appTag, changelogSection, releaseNotes, signerOf } from '@augur/app-tools';
import { appRelease2 } from '@augur/app-tools/release2';
import { readApp } from '@augur/app-tools/validate';

/** The manifest and the parts, from a checkout: jobs first, the order the runner runs them in before the switch. */
export const readCheckout = (root) => {
  const { manifest, parts } = readApp(root, { readdirSync, existsSync, join });
  const workloads = Object.values(parts);
  const isJob = (p) => p.metadata?.annotations?.['augur.dev/part'] === 'job';
  return { manifest, parts: [...workloads.filter(isJob), ...workloads.filter((p) => !isJob(p))] };
};

/**
 * The release file. `bundle` is what `augur-app bundle` printed: `service` (the image every part whose
 * Score file says `image: .` is built from), `frontend` and `channel`. A preview names its pull request
 * from PR_NUMBER, PR_TITLE and PR_URL.
 */
export const releaseOf = ({ manifest, parts, bundle, signer, notes = '', env = {} }) => {
  const built = parts.filter((p) => Object.values(p.containers ?? {}).some((c) => c.image === '.'));
  if (built.length && !bundle.service) throw new Error(`${built.map((p) => p.metadata.name).join(', ')} ${built.length === 1 ? 'is' : 'are'} built from this repository's image, and the bundle has no image.`);
  const preview = bundle.channel === 'preview' && env.PR_NUMBER ? { pr: Number(env.PR_NUMBER), ...(env.PR_TITLE ? { title: env.PR_TITLE.slice(0, 300) } : {}), ...(env.PR_URL ? { url: env.PR_URL } : {}) } : undefined;
  if (bundle.channel === 'preview' && !preview) throw new Error('A preview is released from a pull request: PR_NUMBER is not set.');
  return appRelease2({
    manifest,
    parts,
    bundle: { ...(bundle.frontend ? { frontend: bundle.frontend } : {}), images: Object.fromEntries(built.map((p) => [p.metadata.name, bundle.service])), ...(bundle.channel ? { channel: bundle.channel } : {}) },
    signer,
    notes,
    ...(preview ? { preview } : {}),
  });
};

/** This version's changelog, from the frontend's and the service's. */
const notesFor = (root, version) =>
  ['frontend', 'service']
    .map((p) => join(root, p, 'CHANGELOG.md'))
    .filter((f) => existsSync(f))
    .map((f) => changelogSection(readFileSync(f, 'utf8'), version))
    .filter(Boolean)
    .join('\n\n');

const main = ([mode, file]) => {
  const root = process.cwd();
  const checkout = readCheckout(root);
  const zero = `sha256:${'0'.repeat(64)}`;
  const bundle = file
    ? JSON.parse(readFileSync(file, 'utf8'))
    : { service: `ghcr.io/example/${checkout.manifest.id}@${zero}`, frontend: checkout.manifest.frontend ? { artifact: `ghcr.io/example/${checkout.manifest.id}-frontend@${zero}`, digest: zero } : undefined };
  const quiet = bundle.channel === 'preview' || bundle.channel === 'dev';
  const release = releaseOf({ ...checkout, bundle, signer: signerOf(), notes: quiet ? '' : notesFor(root, checkout.manifest.version), env: process.env });
  if (mode === 'describe') return console.log(JSON.stringify(release, null, 2));
  if (mode !== 'publish' || !file) throw new Error('Usage: node scripts/release.mjs describe [bundle.json] | publish <bundle.json>');
  const run = (args, opts = {}) => execFileSync('gh', args, { cwd: root, encoding: 'utf8', ...opts });
  const tag = appTag(release.id, release.version);
  if (execFileSync('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`], { cwd: root, encoding: 'utf8' }).trim()) return console.log(`${tag} is already released.`);
  const dir = mkdtempSync(join(tmpdir(), 'augur-release-'));
  writeFileSync(join(dir, 'app-release.json'), `${JSON.stringify(release, null, 2)}\n`);
  writeFileSync(join(dir, 'notes.md'), releaseNotes(release, { target: process.env.RELEASE_TARGET || 'main' }));
  // Every release starts as a pre-release (beta) until it's promoted; a preview is tagged on the pull request's head.
  const target = process.env.RELEASE_TARGET || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  run(['release', 'create', tag, '--target', target, '--title', `${release.manifest.name} ${release.version}`, '--notes-file', join(dir, 'notes.md'), '--prerelease', '--latest=false', join(dir, 'app-release.json')], { stdio: 'inherit' });
  console.log(`Released ${tag}.`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
