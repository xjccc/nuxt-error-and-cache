import { defineNuxtConfig } from 'nuxt/config'
import nuxtErrorCache from '..'

export default defineNuxtConfig({
  modules: [
    nuxtErrorCache
  ],
  vite: {
    server: {
      fs: {
        allow: ['../../../node_modules/']
      }
    }
  },
  errorCacheConfig: {
    cache: {
      dev: false,
      lru: {},
      routes: {
        '/': 10
      },
      excludeDir: ['./playground/server/api/nuxt'],
      excludePath: ['/api/nuxt/write-404']
    },
    collect: {}
  }
})
