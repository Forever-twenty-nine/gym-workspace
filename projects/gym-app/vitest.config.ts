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
        find: '@ionic/core/components/',
        replacement: path.resolve(__dirname, 'node_modules/@ionic/core/components/index.js'),
      },
      {
        find: '@ionic/core',
        replacement: path.resolve(__dirname, 'node_modules/@ionic/core/dist/esm/index.js'),
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
  },
});
