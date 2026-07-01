import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      {
        // Alias para que los tests resuelvan "gym-library" igual que Angular
        find: 'gym-library',
        replacement: path.resolve(__dirname, '../../projects/gym-library/src/public-api'),
      },
    ],
  },
  optimizeDeps: {
    include: ['@ionic/core/components', '@ionic/core/components/index.js', '@ionic/core/dist/esm/index.js'],
  },
  ssr: {
    noExternal: ['@ionic/core', '@ionic/angular'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
});
