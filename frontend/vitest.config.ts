import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Plugin do Vite necessário para resolver import.meta.glob em traits.ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
});
