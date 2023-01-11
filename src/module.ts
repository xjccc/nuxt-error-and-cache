import { fileURLToPath } from 'url'
import type LRU from 'lru-cache'
import { defineNuxtModule, addPlugin, createResolver, addServerHandler, addTemplate } from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'

export interface ModuleOptions {
  cache?: {
    dev?: boolean
    lru?: Partial<LRU<string, {html: string}>>
    routes?: Record<string, unknown>
  }
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
      lru: {},
      routes: {}
    },
    collect: true
  },
  setup (options, nuxt) {
    // @ts-ignore
    nuxt.options.runtimeConfig.public.$options = options

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

    if (options.cache) {
      addServerHandler({
        handler: resolve(runtimeDir, 'cache')
      })
    }
  }
})

export default module
