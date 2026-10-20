import { defineConfig } from 'vite';

const inContainer = Boolean(process.env.DEV_PORT);
const expose = inContainer || Boolean(process.env.CLAUDE_DEV_EXPOSE);

export default defineConfig({
  test: { include: ['tests/**/*.test.js'] },
  server: {
    host: expose ? '0.0.0.0' : '127.0.0.1',
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  preview: {
    host: expose ? '0.0.0.0' : '127.0.0.1',
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
});
