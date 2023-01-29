import LRU from 'lru-cache'
import { NodeIncomingMessage, NodeServerResponse, fromNodeMiddleware } from 'h3'
import { createResolver } from '@nuxt/kit'
import glob from 'glob'
import { useRuntimeConfig } from '#imports'

const { errorCacheConfig } = useRuntimeConfig()
// 排除的文件、路径
const excludeDir = errorCacheConfig.cache.excludeDir || []
const excludePath = errorCacheConfig.cache.excludePath || []

// 存储文件路径
let paths: string[] = []

// 获取exclude文件路径
function getFilesPath () {
  const { resolve } = createResolver(import.meta.url)
  excludeDir.forEach((dir) => {
    const workDir = resolve(process.cwd(), dir)
    const files = glob.sync(`{${workDir}/**.*,}`)
    paths = [...paths, ...files.map(p => p.replace(/^(?:.*\/)?([^/]+?|)(?:(?:.[^/.]*)?$)/, '$1').replace(/.\w+$/, ''))]
  })
  paths = [...paths, ...excludePath]
}

getFilesPath()

const lruConfig = {
  max: 5000,
  ttl: 1000 * 60 * 5,
  allowStale: true,
  ...errorCacheConfig.cache?.lru
}

const cachePage = new LRU<string, { html: string }>(lruConfig)

function setCacheTimes (t: number) {
  return 1000 * 60 * t
}

const routesCache = { ...errorCacheConfig.cache.routes }

export default fromNodeMiddleware((req: NodeIncomingMessage, res: NodeServerResponse, next: (err?: Error) => unknown) => {
  if (process.env.NODE_ENV === 'development' && errorCacheConfig.cache.dev) { return next() }
  const url = req.url!
  // 判断是否是exclude
  for (const item of excludePath) {
    if (url.includes(item)) { return next() }
  }

  let regUrl = ''
  let regKey = ''
  const keys = [...paths, ...Object.keys(routesCache)]

  for (const item of keys) {
    if (item === '/' && url === '/') {
      regUrl = '/'
      regKey = '/'
      break
    }
    const reg = RegExp(item)
    if (reg.test(url)) {
      if (!routesCache[item]) {
        routesCache[item] = 0
      }
      regUrl = url
      regKey = item
      break
    }
  }

  const timer = regKey ? setCacheTimes(routesCache[regKey]) : setCacheTimes(lruConfig.ttl / (1000 * 60))
  if (url.includes('nocache=true')) {
    const link = url.replace(/(\?|&)?nocache=true/, '')
    cachePage.delete(link)
  } else if (url.includes('nocache=all')) {
    cachePage.clear()
  } else {
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
