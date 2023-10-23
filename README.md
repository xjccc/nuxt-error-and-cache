# Nuxt Module

1. 收集运行时错误信息
2. 服务端生成 html 缓存
3. 清除单独链接 lrucache(url?nocache=true)
4. 清除所有 lru-cache(url?nocache=all)

## 使用方式

```js
// nuxt.config.js

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['nuxt-error-and-cache'],
  errorCacheConfig: {
    /**
     * cache: boolean | 
     * {
        production?: boolean
        lru?: Partial<LRU<string, { html: string }>>
        routes?: Record<string, unknown>,
        excludeDir?: string[]
        excludePath?: string[]
     * }
     */
    cache: {
      /**
       * 默认生产环境添加缓存
       * 生效会在html-response header写入res.setHeader('server-cache-times', timer)
       */
      production: process.env.NODE_ENV === 'production',
      /**
       * lru-cache参数配置
       * 默认
       *  max: 5000,
       * ttl: 1000 * 60 * 5,  默认根据ttl/(1000*60)缓存5分钟
       * allowStale: true
       */
      lru: {},
      // 设置路由在服务器缓存时间-min
      // 默认5分钟
      routes: {
        '/aaa': 3
      },
      /**
       * 相对工作目录路径
       * 排除的url地址、server端请求url（./server/api）
       */
      excludeDir: ['./playground/server/api/nuxt'],
      excludePath: ['/api/nuxt/write-404']
    },
    /**
     * 是否采集运行时错误
     * default: true
     * 采集内容-报错内容\报错时间\报错页面\报错位置\userAgent
     * 项目目录下需要有logs文件夹-错误信息会写入该目录
     * prefix: 文件前缀_YYYYMM.log
     * path: './logs' 相对路径
     */
    collect: {}
  }
})
```

## Development

- Run `npm run dev:prepare` to generate type stubs.
- Use `npm run dev` to start [playground](./playground) in development mode.
