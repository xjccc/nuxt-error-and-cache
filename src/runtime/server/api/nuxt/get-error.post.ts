import fs from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'url'
import { readBody, defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'

function getFileName (filePath: string, filePrefix: string) {
  // 获取文件名称 server/logs/errorLog_201901.log
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
function fileCreate (filename: string) {
  return new Promise((resolve, reject) => {
    fs.access(filename, fs.constants.F_OK, (err) => {
      if (err) {
        fs.writeFile(filename, '', (err) => {
          if (err) {
            // console.log(err)
            reject(new Error('file create failed'))
          }
          resolve(true)
        })
      }
      resolve(true)
    })
  })
}

// 增量更新日志文件
function fileWrite (
  filePath: string,
  errData: Record<string, string>,
  options: Record<string, string> = {}
) {
  const prefix = options.prefix || 'nuxt'
  const filename = getFileName(filePath, prefix)
  return new Promise((resolve, reject) => {
    // 先读取文件内容
    fileCreate(filename)
      .then(() => {
        fs.readFile(filename, 'utf8', (err, fileData) => {
          if (err) { reject(err) }
          let data = fileData
          data += '\r\n'
          data += `报错内容：${JSON.stringify(errData.msg)}\r\n`
          data += `报错时间：${new Date().toLocaleString()}\r\n`
          data += `报错页面：${errData.url}\r\n`
          data += `报错位置：${JSON.stringify(errData.stack)}\r\n`
          data += `userAgent：${errData.ua}\r\n`
          // data += `cookie：${errData.cookie}\r\n`
          // 追加错误内容
          fs.writeFile(filename, data, (eb) => {
            if (eb) { reject(eb) }

            resolve(true)
          })
        })
      })
      .catch((err) => {
        reject(err)
      })
  })
}

export default defineEventHandler(async (event) => {
  const { errorCacheConfig } = useRuntimeConfig()
  let collect = { path: '', prefix: 'nuxt' }
  if (typeof errorCacheConfig.collect === 'object') {
    collect = errorCacheConfig.collect
  }

  const body = await readBody(event)
  const { req } = event.node
  body.ua = req.headers['user-agent']
  // body.cookie = req.headers['cookie']
  const file = collect.path || './logs'

  await fileWrite(file, body, collect)
  return 'upload success'
})
