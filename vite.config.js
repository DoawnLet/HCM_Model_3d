import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    watch: {
      ignored: [
        '**/public/assets/**',
        '**/*.mp4',
        '**/*.docx',
        '**/*.pdf'
      ]
    }
  }
});
