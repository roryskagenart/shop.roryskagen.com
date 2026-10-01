import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // tsconfig sets `baseUrl: "."`, so application code imports `lib/...` as a bare
      // specifier. Without this alias any module under lib/ fails to load in tests.
      lib: path.resolve(__dirname, './lib'),
    },
  },
});
