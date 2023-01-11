import LRU from 'lru-cache'
import type { NodeIncomingMessage, NodeServerResponse } from 'h3'
import { fromNodeMiddleware } from 'h3'
// @ts-ignore
import { useRuntimeConfig } from '#imports'
const { public: { $options } } = useRuntimeConfig()

const lruConfig = {
  max: 5000,
  ttl: 1000 * 60 * 5,
  allowStale: true,
  ...$options.cache?.lru
}

const cachePage = new LRU<string, { html: string }>(lruConfig)

function setCacheTimes (t: number) {
  return 1000 * 60 * t
}

export default fromNodeMiddleware((req: NodeIncomingMessage, res: NodeServerResponse, next: (err?: Error) => unknown) => {
  if (process.env.NODE_ENV === 'development' && $options.cache.dev) { return next() }
  const url = req.url!
  const timer = $options.cache.routes[url] ? setCacheTimes($options.cache.routes[url]) : setCacheTimes(5)

  if (url.includes('nocache=true')) {
    const link = url.replace(/(\?|&)?nocache=true/, '')
    cachePage.delete(link)
  } else {
    const html = cachePage.get(url)
    if (html) {
      res.setHeader('Content-Type', 'text/html;charset=utf-8')
      res.setHeader('server-cache-times', timer)
      return res.end(html.html, 'utf-8')
    }
  }

  const resEnd = res.end
  res.end = function (data: string) {
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
