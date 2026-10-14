import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

function localMediaPlugin() {
  return {
    name: 'local-media-streamer',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/local-media/')) {
          return next()
        }

        const rawPath = req.url.replace('/local-media/', '').split('?')[0]
        const decodedPath = decodeURIComponent(rawPath)
        
        const possibleRoots = [
          process.env.MEDIA_FOLDER,
          'X:\\',
          '/mnt/capyflix'
        ].filter(Boolean) as string[]

        let filePath = ''
        for (const root of possibleRoots) {
          const testPath = path.join(root, decodedPath)
          if (fs.existsSync(testPath)) {
            filePath = testPath
            break
          }
        }

        if (!filePath) {
          res.statusCode = 404
          res.end('File not found')
          return
        }

        const stat = fs.statSync(filePath)
        const fileSize = stat.size
        const range = req.headers.range

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-')
          const start = parseInt(parts[0], 10)
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
          const chunksize = end - start + 1
          const file = fs.createReadStream(filePath, { start, end })
          const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4'
          }
          res.writeHead(206, head)
          file.pipe(res)
        } else {
          const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes'
          }
          res.writeHead(200, head)
          fs.createReadStream(filePath).pipe(res)
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    localMediaPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'favicon-96x96.png',
        'web-app-manifest-192x192.png',
        'web-app-manifest-512x512.png',
        'capy-icon.svg'
      ],
      manifest: {
        name: 'CapyFlix - Cinema & Animes da Casa',
        short_name: 'CapyFlix',
        description: 'Streaming retrô de animes, filmes e séries dos amigos da Capihouse',
        theme_color: '#a66130',
        background_color: '#12100e',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
})
