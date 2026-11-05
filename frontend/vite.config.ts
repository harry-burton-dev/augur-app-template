import { isSharedModule } from '@augur/mfe-sdk/build';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// One ES module at dist/entry.js: the registry's entry URL for the app. React, the SDK and the
// kits stay out of it; the shell serves one copy of each to every app through its import map.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: 'src/entry.tsx', formats: ['es'], fileName: () => 'entry.js' },
    target: 'es2022',
    rollupOptions: { external: isSharedModule },
  },
  test: { environment: 'happy-dom' },
});
