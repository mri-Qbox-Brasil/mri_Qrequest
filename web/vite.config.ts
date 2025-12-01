import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'build',
    target: 'es2017',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug', 'console.trace'],
      },
      format: {
        comments: false,
      },
    },
    cssCodeSplit: false, // produce a single CSS file
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/scripts.js',
        chunkFileNames: 'chunk-[name].js',
        // Use a function to give a fixed name to the emitted CSS file while keeping other assets
        assetFileNames: (assetInfo: any) => {
          if (assetInfo && assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/styles.css';
          }
          return 'assets/[name].[ext]';
        },
      },
    },
  },
});
