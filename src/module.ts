import { fileURLToPath } from 'url'
import type { LRUCache } from 'lru-cache'
import { defineNuxtModule, addPlugin, createResolver, addServerHandler } from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
type CacheOptions = {
  lru?: Partial<LRUCache<string, { html: string }>>
  routes?: Record<string, unknown>,
  excludeDir?: string[]
  excludePath?: string[]
}
export interface ModuleOptions {
  production: boolean
  cache?: CacheOptions | boolean
  collect?: boolean | { prefix?: string, path?: string }
}

declare module 'nuxt/schema' {
  interface RuntimeConfig {
    errorCacheConfig: {
      production: boolean
      cache?: CacheOptions | boolean
      collect?: boolean | { prefix?: string, path?: string }
    }
  }
}

const defaultsCache = {
  lru: {},
  routes: {},
  excludeDir: [],
  excludePath: []
}

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-error-and-cache',
    configKey: 'errorCacheConfig'
  },
  defaults: {
    production: process.env.NODE_ENV === 'production' || true,
    cache: defaultsCache,
    collect: true
  },
  setup (options, nuxt) {
    nuxt.options.runtimeConfig.errorCacheConfig = options ?? {
      production: process.env.NODE_ENV === 'production',
      cache: defaultsCache,
      collect: true
    }
    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)
    if (options.collect) {
      addPlugin(resolve(runtimeDir, 'plugin'))
      addServerHandler({
        route: '/api/nuxt/get-error',
        handler: resolve(runtimeDir, 'server/api/nuxt/get-error.post')
      })
    }

    let cache = options.cache

    if (typeof cache === 'boolean' && cache) {
      cache = defaultsCache
    }

    if (typeof cache === 'object' && options.production) {
      addServerHandler({
        handler: resolve(runtimeDir, 'cache')
      })
    }
  }
})

export default module
