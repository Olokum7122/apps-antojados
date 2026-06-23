import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'

const root = resolve('dist/spa')
const port = Number(process.env.PORT || 9002)
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

function safePath(url) {
  const cleanUrl = decodeURIComponent(url.split('?')[0])
  const requested = join(root, cleanUrl === '/' ? 'index.html' : cleanUrl)
  return requested.startsWith(root) ? requested : join(root, 'index.html')
}

createServer(async (req, res) => {
  let filePath = safePath(req.url || '/')

  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) filePath = join(root, 'index.html')
  } catch {
    filePath = join(root, 'index.html')
  }

  try {
    const data = await readFile(filePath)
    res.writeHead(200, { 'Content-Type': types[extname(filePath)] || 'application/octet-stream' })
    res.end(data)
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end(String(error))
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Antojados iOS V2 web: http://localhost:${port}/`)
})
