// Makes this copy of the template your app: its id, its name, and nothing left of the template.
//   pnpm make-app <id> [--name "Display name"]
// Run it once, in a repository you made from the template ("Use this template" on GitHub).
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const nameAt = args.indexOf('--name');
const id = args.find((a, i) => !a.startsWith('--') && i !== nameAt + 1);
const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};
if (!id) fail('Usage: pnpm make-app <id> [--name "Display name"]');
// The registry's own rule for app ids.
if (!/^[a-z][a-z0-9-]{1,39}$/.test(id)) fail(`"${id}" can't be an app id: use 2 to 40 lowercase letters, digits and dashes, starting with a letter.`);
if (id === 'starter') fail('Pick your app’s own id.');
const name = nameAt >= 0 ? args[nameAt + 1] : id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
if (!name) fail('--name needs a value.');

// Every file that names the template's app. Anything else is the same in every app.
const files = [
  'manifest.json',
  'catalog-info.yaml',
  'package.json',
  'service/package.json',
  'frontend/package.json',
  'service/src/app.test.ts',
  'frontend/src/app.tsx',
  'frontend/src/styles.css',
  '.changeset/config.json',
  '.changeset/first-release.md',
  'run/index.ts',
  'README.md',
  'AGENTS.md',
];
// The app's own repository, for its catalog entry: as `augur-app catalog` finds it.
const remote = () => {
  try {
    return execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: root, encoding: 'utf8' });
  } catch {
    return '';
  }
};
const repo = process.env.GITHUB_REPOSITORY || remote().trim().match(/github\.com[:/]([^/\s]+\/[^/\s]+?)(?:\.git)?\/?$/)?.[1];
const TEMPLATE_ONLY = /<!-- template-only -->[\s\S]*?<!-- \/template-only -->\n*/g;
for (const file of files) {
  const path = join(root, file);
  if (!existsSync(path)) continue;
  const text = readFileSync(path, 'utf8')
    .replace(TEMPLATE_ONLY, '')
    .replaceAll('harry-burton-dev/augur-app-template', repo ?? 'harry-burton-dev/augur-app-template')
    .replaceAll('augur-app-starter', `augur-${id}`)
    .replaceAll('Starter', name)
    .replaceAll('starter', id);
  writeFileSync(path, text);
}
// The template's own tool goes once it's done its one job.
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
delete pkg.scripts['make-app'];
writeFileSync(join(root, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
rmSync(join(root, 'scripts/make-app.mjs'));

console.log(`
${name} is ready, as the app "${id}" at /${id}.

  pnpm install && pnpm test      check it works${repo ? '' : `
  GITHUB_REPOSITORY=<owner>/<repo> pnpm exec augur-app catalog   no GitHub remote found: write the catalog entry`}
  README.md                      run it in AUGUR's shell, then make it yours`);
