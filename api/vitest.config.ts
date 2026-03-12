import { defineConfig } from 'vitest/config';
import tsconfig from './tsconfig.json' with { type: 'json' };
import path from 'path';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/test/**',
        'src/index.ts',
        'src/lib/prisma.ts',
      ],
    },
  },
  esbuild: {
    target: (tsconfig.compilerOptions?.target as string) ?? 'ES2022',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
