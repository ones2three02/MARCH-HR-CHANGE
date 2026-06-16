import { defineConfig } from 'vite'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron/simple'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        // Electron 主进程入口
        entry: 'electron/main.ts',
        vite: {
          build: {
            rolldownOptions: {
              // 适配 Vite 8 + Rolldown 的外部化排除依赖机制
              external: ['oracledb', 'xlsx'],
            }
          }
        }
      },
      preload: {
        // Preload 脚本入口
        input: 'electron/preload.ts',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
