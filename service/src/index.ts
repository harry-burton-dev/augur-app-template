import { readManifest, startAppService } from '@augur/service-kit';
import { buildApp } from './app.ts';

// Builds the service, listens on PORT, runs its jobs, gives the registry its frontend and puts it in
// the platform's catalogue (signed in as itself with SERVICE_CLIENT_SECRET). With no REGISTRY_URL,
// as under AUGUR's `pnpm dev:app`, it only listens.
const manifest = readManifest(import.meta.url);
await startAppService({ manifest, buildApp: ({ jobs }) => buildApp({ manifest, jobs }) });
