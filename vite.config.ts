import { defineConfig } from 'vite';
import type { PluginOption } from 'vite';
import { resolve } from 'path';
import { crossOriginIsolation } from 'vite-plugin-cross-origin-isolation';

export default defineConfig({
  optimizeDeps: {
    exclude: [
      '@ffmpeg/core',
      '@ffmpeg/ffmpeg',
      '@ffmpeg/core-mt',
      '@ffmpeg/util',
      'worker.js',
      'ffmpeg-core.worker.js'
    ]
  },
  worker: {
    format: 'es',
    plugins: (): PluginOption[] => [],
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: '[name].js'
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          ffmpeg: ['@ffmpeg/core', '@ffmpeg/core-mt', '@ffmpeg/ffmpeg', '@ffmpeg/util']
        }
      }
    }
  },
  server: {
    fs: {
      allow: [
        'node_modules'
      ]
    }
  },
  plugins: [
    {
      name: 'fix-ffmpeg-worker',
      transform(code, id) {
        if (id.includes('@ffmpeg/ffmpeg')) {
          // Replace the worker initialization code
          return code.replace(
            /new Worker\(new URL\("\.\/worker\.js", import\.meta\.url\)/,
            'new Worker(new URL("/node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js", import.meta.url)'
          );
        }
      }
    },
    crossOriginIsolation()
  ],
  resolve: {
    alias: {
      './worker.js': resolve(__dirname, 'node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js')
    }
  }  
}); 