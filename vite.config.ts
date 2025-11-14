import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['quill/dist/quill.snow.css']
  }
});

