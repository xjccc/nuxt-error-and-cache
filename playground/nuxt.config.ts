import { defineNuxtConfig } from 'nuxt/config'
import nuxtErrorCache from '../dist/module.mjs'

export default defineNuxtConfig({
  modules: [
    nuxtErrorCache
  ],
  errorCacheConfig: {
    cache: {
      lru: {},
      routes: {}
    },
    collect: {}
  }
})
