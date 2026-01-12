import express, { Response as Res } from 'express'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import fetch from 'node-fetch'
import config from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)

// 用于存储SSE连接的Set
const sseConnections = new Set<Res<any, Record<string, any>>>()

app.use(cors())
app.use(express.json())

// 静态文件服务 - 提供 /web 路由访问前端资源
app.use('/web', express.static(path.join(__dirname, '../../live-bridge-web/dist')))

// 添加代理API端点，用于访问限制origin头的内容
app.get('/proxy', async (req, res) => {
  try {
    // 获取目标URL
    const targetUrl = req.query.url
    
    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).json({ error: 'Missing target URL' })
    }

    // 发起请求，不包含origin头部
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        // 不包含origin头部，只传递必要的headers
        'User-Agent': req.get('User-Agent') || 'LiveBridge-Proxy',
        'Accept': req.get('Accept') || '*/*',
        'Accept-Language': req.get('Accept-Language') || 'en-US,en;q=0.9',
        'Accept-Encoding': req.get('Accept-Encoding') || 'gzip, deflate, br',
      },
    })

    // 设置响应头
    res.status(response.status)
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, value)
      }
    })

    // 返回响应体
    const arrayBuffer = await response.arrayBuffer()
    res.send(Buffer.from(arrayBuffer))
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ error: 'Proxy request failed' })
  }
})

// 接收其他内网应用发送的弹幕数据
app.post('/danmuData/:platform', (req, res) => {
  const platform = req.params.platform
  const data = req.body

    // 将数据发送给所有SSE连接
    ;[...sseConnections].forEach(connection => {
      try {
        connection.write(`data: ${JSON.stringify({ platform, data })}\n\n`)
      } catch (e) {
        // 如果写入失败，从连接集合中移除该连接
        sseConnections.delete(connection)
        connection.destroy()
      }
    })

  // console.log(`收到 ${platform} 平台弹幕数据:`, data)
  res.json({ success: true })
})

// SSE 端点，用于转发弹幕数据
app.get('/danmuAPI', (req, res) => {
  // 设置 SSE 响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  })

  // 将当前连接添加到连接集合中
  sseConnections.add(res)

  // 每隔一段时间发送心跳，保持连接
  const heartbeatInterval = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 15000)

  // 当客户端断开连接时清理资源
  req.on('close', () => {
    clearInterval(heartbeatInterval)
    // 从连接集合中移除当前连接
    sseConnections.delete(res)
  })
})

const port = config.port

server.listen(port, () => {
  console.log(`服务器运行在端口 ${port}`)
})