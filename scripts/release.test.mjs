// `node --test scripts/*.test.mjs` (part of `pnpm test`): the release file the workflows attach.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { releaseOf, readCheckout } from './release.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const digest = (c) => `sha256:${c.repeat(64)}`;
const bundle = {
  service: `ghcr.io/example-org/augur-app/app@${digest('a')}`,
  frontend: { artifact: `ghcr.io/example-org/augur-app/app-frontend@${digest('b')}`, digest: digest('c') },
  channel: 'beta',
};
const signer = { repository: 'example-org/augur-app', workflow: '.github/workflows/release.yml' };

test('writes release v2: the manifest, the frontend and every part pinned to the image the build pushed', () => {
  const checkout = readCheckout(root);
  const release = releaseOf({ ...checkout, bundle, signer });
  assert.equal(release.schema, 'augur.app-release/v2');
  assert.equal(release.id, checkout.manifest.id);
  assert.equal(release.version, checkout.manifest.version);
  assert.equal(release.channel, 'beta');
  assert.deepEqual(release.signer, signer);
  assert.equal(release.frontend.artifact, bundle.frontend.artifact);
  // Jobs first: the runner runs them in the order the release gives, before the switch.
  assert.deepEqual(
    release.parts.map((p) => p.metadata.name),
    ['migrate', 'web'],
  );
  for (const part of release.parts) for (const c of Object.values(part.containers)) assert.equal(c.image, bundle.service);
});

test('writes out what an admin agrees to', () => {
  const checkout = readCheckout(root);
  const { asks } = releaseOf({ ...checkout, bundle, signer });
  assert.deepEqual(asks.scopes, checkout.manifest.scopes);
  assert.deepEqual(asks.settings, checkout.manifest.contributes.settings.map((s) => s.id));
  assert.ok(asks.resources.some((r) => r.part === 'web' && r.type === 'augur-gateway' && r.params?.inbound === true));
  assert.ok(asks.resources.some((r) => r.part === 'migrate' && r.type === 'augur-database'));
  assert.deepEqual(Object.keys(asks.limits).sort(), ['migrate', 'web']);
});

test('refuses a bundle without the image its parts are built from', () => {
  const checkout = readCheckout(root);
  assert.throws(() => releaseOf({ ...checkout, bundle: { ...bundle, service: null }, signer }), /image/);
});

test('a preview carries its pull request', () => {
  const checkout = readCheckout(root);
  const release = releaseOf({ ...checkout, manifest: { ...checkout.manifest, version: '1.0.0-pr.12.3' }, bundle: { ...bundle, channel: 'preview' }, signer, env: { PR_NUMBER: '12', PR_TITLE: 'A change' } });
  assert.deepEqual(release.preview, { pr: 12, title: 'A change' });
  assert.equal(release.channel, 'preview');
});

test('the manifest’s version is its packages’ version', () => {
  const { manifest } = readCheckout(root);
  for (const pkg of ['frontend', 'service']) assert.equal(JSON.parse(readFileSync(`${root}/${pkg}/package.json`, 'utf8')).version, manifest.version);
});
