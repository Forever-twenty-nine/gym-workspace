import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@ionic/core/components',
        replacement: path.resolve(__dirname, 'node_modules/@ionic/core/components/index.js'),
      },
      {
        find: /@ionic\/core\/components\/(.*)/,
        replacement: path.resolve(__dirname, 'node_modules/@ionic/core/components/index.js'),
      },
      {
        find: '@ionic/core',
        replacement: path.resolve(__dirname, 'node_modules/@ionic/core/dist/esm/index.js'),
      },
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
