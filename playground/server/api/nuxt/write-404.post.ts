import fs from 'fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'url'
import { defineEventHandler, readBody } from 'h3'
// 获取文件名称 server/logs/errorLog_201901.log
function getFileName (filePath: string, filePrefix: string) {
  const rootDir = fileURLToPath(new URL('./', import.meta.url))
  let path = resolve(rootDir, filePath)
  // filePath最后如果不是 / , 添加 /
  if (path.charAt(filePath.length - 1) !== '/') {
    path = `${path}/`
  }
  return `${path}index.txt`
}

// 若文件不存在，创建一个
function fileCreate (filename: string) {
  return new Promise((resolve, reject) => {
    fs.exists(filename, (exists) => {
      if (!exists) {
        fs.writeFile(filename, '', (err) => {
          if (err) {
            // console.log(err)
            reject(new Error('file create failed'))
          }
          resolve(true)
        })
      } else {
        resolve(true)
      }
    })
  })
}

// 增量更新日志文件
function fileWrite (
  filePath: string,
  filePrefix: string,
  errData: Record<string, string>
) {
  const filename = getFileName(filePath, filePrefix)

  return new Promise((resolve, reject) => {
    // 先读取文件内容
    fileCreate(filename)
      .then(() => {
        fs.readFile(filename, 'utf8', (err, fileData) => {
          if (err) { reject(err) }
          let data = fileData
          const urlLine = `${errData.url}\r\n`
          // if (data.includes(urlLine)) {
          //   // 已经记录404页面
          //   resolve('已存在404页面，无需再次写入')
          //   return
          // }
          data += urlLine
          fs.writeFile(filename, data, (eb) => {
            if (eb) { reject(eb) }
            resolve('写入404页面成功')
          })
        })
      })
      .catch((err) => {
        reject(err)
      })
  })
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const res = await fileWrite('../../notExist', '', body)
  return res
})
