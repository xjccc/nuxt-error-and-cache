export default defineEventHandler(async (event) => {
  const { req } = event
  // console.log(req,'请求')
  const ip = req.socket.remoteAddress || req.connection.remoteAddress || req.headers['x-forwarded-for']
  return {
    ip
  }
})