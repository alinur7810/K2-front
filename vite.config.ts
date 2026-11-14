import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
  const base =
    mode === 'production'
      ? env.VITE_BASE_PATH || (repoName ? `/${repoName}/` : '/K2-front/')
      : '/';

  return {
    base,
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  };
});
