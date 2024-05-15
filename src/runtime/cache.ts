import { LRUCache } from 'lru-cache'
import type { NodeIncomingMessage, NodeServerResponse } from 'h3'
import { fromNodeMiddleware } from 'h3'
import { useRuntimeConfig } from '#imports'

const { errorCacheConfig } = useRuntimeConfig()
// 排除的文件、路径
const cache = errorCacheConfig.cache ?? {}
let excludePath: string[] = []
let lru: Partial<LRUCache<string, { html: string }>> = {}
let routes = {}
const production = errorCacheConfig.production
if (typeof cache === 'object' && cache) {
  excludePath = cache.excludePath || []
  lru = cache.lru || {}
  routes = cache.routes || {}
}

const lruConfig = {
  max: 5000,
  ttl: 1000 * 60 * 5,
  allowStale: true,
  ...lru
}

const cachePage = new LRUCache<string, { html: string }>(lruConfig)

function setCacheTimes (t: number) {
  return 1000 * 60 * t
}

const routesCache: Record<string, number> = { ...routes }

export default fromNodeMiddleware((req: NodeIncomingMessage, res: NodeServerResponse, next: (err?: Error) => unknown) => {
  if (!production) {
    return next()
  }
  const url = req.url!
  // 判断是否是exclude
  for (const item of excludePath) {
    if (url.includes(item)) {
      return next()
    }
  }

  let regKey = ''
  const keys = [...excludePath, ...Object.keys(routesCache)]

  for (const item of keys) {
    if (item === '/' && url === '/') {
      regKey = '/'
      break
    }
    const reg = RegExp(item)
    if (reg.test(url)) {
      if (!routesCache[item]) {
        routesCache[item] = 0
      }
      regKey = item
      break
    }
  }

  const timer = regKey ? setCacheTimes(routesCache[regKey]) : setCacheTimes(lruConfig.ttl / (1000 * 60))
  if (url.includes('nocache=true')) {
    const link = url.replace(/(\?|&)?nocache=true/, '')
    cachePage.delete(link)
  }
  else if (url.includes('nocache=all')) {
    cachePage.clear()
  }
  else {
    const html = cachePage.get(url)

    if (html && timer) {
      res.setHeader('Content-Type', 'text/html;charset=utf-8')
      res.setHeader('server-cache-times', timer)
      return res.end(html.html, 'utf-8')
    }
  }
  const resEnd = res.end.bind(res)
  res.end = function (data) {
    if (res.statusCode === 200) {
      cachePage.set(
        url,
        {
          html: data
        },
        { ttl: timer }
      )
    }
    resEnd(data, 'utf-8')
  } as NodeServerResponse['end']
  next()
})
