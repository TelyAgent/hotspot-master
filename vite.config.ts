import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 监听所有网卡，允许通过局域网 IP 访问（如 http://192.168.x.x:5173）
    host: true,
    // 开发环境把 /api 代理到 NestJS 服务端，避免跨域与硬编码主机名
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
