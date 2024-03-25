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
    production: true,
    cache: {
      lru: {},
      routes: {
        '/': 10
      },
      excludeDir: ['/server/api/nuxt'],
      excludePath: ['/api/nuxt/write-404', '/api/nuxt/get-error']
    },
    collect: {
      path: './notExist'
    }
  }
})
