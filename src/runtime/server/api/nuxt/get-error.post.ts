import fs from 'node:fs/promises'
import { fileURLToPath } from 'url'
import { resolve, dirname } from 'node:path'
import { defineEventHandler, readBody } from 'h3'
import { useRuntimeConfig } from '#imports'

function getFileName (filePath: string, filePrefix: string) {
  // 获取文件名称 logs/nuxt_201901.log
  const rootDir = fileURLToPath(new URL('../../', import.meta.url))
  const path = resolve(rootDir, filePath, filePrefix)

  const date = new Date()
  const year = date.getFullYear()
  let month = String(date.getMonth() + 1)
  if (+month < 10) {
    month = `0${month}`
  }
  return `${path}_${year}${month}.log`
}

// 若文件不存在，创建一个
async function fileCreate (filename: string) {
  try {
    const dir = dirname(filename)
    // 检查文件夹是否存在，如果不存在则创建
    try {
      await fs.access(dir)
    } catch (err) {
      // 文件夹不存在，创建它
      await fs.mkdir(dir, { recursive: true })
    }

    // 检查文件是否存在
    try {
      await fs.access(filename)
      // 文件已存在，返回 true
      return true
    } catch (err) {
      // 文件不存在，创建文件
      await fs.writeFile(filename, '')
    }
  } catch (error) {
    // 处理可能的错误
    console.error('An error occurred:', error)
    throw error
  }
}

// 增量更新日志文件
async function fileWrite (
  filePath: string,
  errData: Record<string, string>,
  options: Record<string, string> = {}
) {
  const prefix = options.prefix || 'nuxt'
  const filename = getFileName(filePath, prefix)

  // 先读取文件内容
  await fileCreate(filename)
  const fileData = await fs.readFile(filename, 'utf8')

  let data = fileData
  data += '\r\n'
  data += `报错内容：${JSON.stringify(errData.msg)}\r\n`
  data += `报错时间：${new Date().toLocaleString()}\r\n`
  data += `报错页面：${errData.url}\r\n`
  data += `报错位置：${JSON.stringify(errData.stack)}\r\n`
  data += `userAgent：${errData.ua}\r\n`
  // data += `cookie：${errData.cookie}\r\n`
  // 追加错误内容
  await fs.writeFile(filename, data)
}

export default defineEventHandler(async (event) => {
  const { errorCacheConfig } = useRuntimeConfig()
  let collect = { path: '', prefix: 'nuxt' }
  if (typeof errorCacheConfig.collect === 'object') {
    collect = { ...collect, ...errorCacheConfig.collect }
  }

  const body = await readBody(event)
  const { req } = event.node
  body.ua = req.headers['user-agent']
  // body.cookie = req.headers['cookie']
  const file = collect.path || './logs'

  await fileWrite(file, body, collect)
  return 'upload success'
})
