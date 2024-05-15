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
      excludePath: ['/api/*']
    },
    collect: {
      path: './notExist'
    }
  }
})
