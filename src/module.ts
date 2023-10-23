import { fileURLToPath } from 'url'
import type LRU from 'lru-cache'
import { defineNuxtModule, addPlugin, createResolver, addServerHandler } from '@nuxt/kit'
import type { NuxtModule, RuntimeConfig } from '@nuxt/schema'
type CacheOptions = {
  dev?: boolean
  production?: boolean
  lru?: Partial<LRU<string, { html: string }>>
  routes?: Record<string, unknown>,
  excludeDir?: string[]
  excludePath?: string[]
}
export interface ModuleOptions {
  cache?: CacheOptions | boolean
  collect?: boolean | { prefix?: string, path?: string }
}

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-error-and-cache',
    configKey: 'errorCacheConfig'
  },
  defaults: {
    cache: {
      dev: true,
      production: true,
      lru: {},
      routes: {},
      excludeDir: [],
      excludePath: []
    },
    collect: true
  },
  setup (options, nuxt) {
    nuxt.options.runtimeConfig.errorCacheConfig = { ...options as RuntimeConfig['errorCacheConfig'] }
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

    const cache = options.cache

    if ((typeof cache === 'boolean' && cache) || (typeof cache === 'object' && cache?.production)) {
      addServerHandler({
        handler: resolve(runtimeDir, 'cache')
      })
    }
  }
})

export default module
