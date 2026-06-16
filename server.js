import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import oracledb from 'oracledb'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 启用 JSON 解析和跨域支持
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// 托管前端打包后的静态资源 (Vite 打包默认输出至 dist)
const distPath = path.join(__dirname, 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  console.log(`[Server] Front-end assets detected and hosted from ${distPath}`)
} else {
  console.log(`[Server] Warning: Frontend dist directory not found. Please run 'npm run build' first if you wish to host it via this server.`)
}

// 辅助函数：构造 Oracle 连接字符串（与 Electron 主进程逻辑对齐）
function getConnectString(config: any) {
  if (config.connectType === 'sid' || (!config.connectType && config.sid)) {
    return `${config.host}:${config.port}:${config.sid}`
  }
  return `${config.host}:${config.port}/${config.serviceName}`
}

// --- API 路由设计 ---

// 1. 数据库测试连接
app.post('/api/db-test', async (req, res) => {
  const { host, port, user, password, connectType, serviceName, sid } = req.body
  let conn
  try {
    conn = await oracledb.getConnection({
      user,
      password,
      connectString: getConnectString(req.body),
    })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  } finally {
    if (conn) {
      await conn.close().catch(() => {})
    }
  }
})

// 2. 事务批量执行多条 SQL
app.post('/api/db-execute-batch', async (req, res) => {
  const { config, sqls } = req.body
  let conn
  try {
    conn = await oracledb.getConnection({
      user: config.user,
      password: config.password,
      connectString: getConnectString(config),
    })
    
    // 执行事务
    for (const sql of sqls) {
      if (!sql.trim()) continue
      await conn.execute(sql)
    }
    await conn.commit()
    res.json({ success: true })
  } catch (err: any) {
    if (conn) {
      await conn.rollback().catch(() => {})
    }
    res.status(500).json({ success: false, message: err.message })
  } finally {
    if (conn) {
      await conn.close().catch(() => {})
    }
  }
})

// 3. 执行查询并返回结果集
app.post('/api/db-query', async (req, res) => {
  const { config, sql } = req.body
  let conn
  try {
    conn = await oracledb.getConnection({
      user: config.user,
      password: config.password,
      connectString: getConnectString(config),
    })
    const result = await conn.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })
    res.json({ success: true, rows: result.rows, metaData: result.metaData })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  } finally {
    if (conn) {
      await conn.close().catch(() => {})
    }
  }
})

// 4. 执行存储过程
app.post('/api/db-execute-procedure', async (req, res) => {
  const { config, procedureName } = req.body
  let conn
  try {
    conn = await oracledb.getConnection({
      user: config.user,
      password: config.password,
      connectString: getConnectString(config),
    })
    await conn.execute(`BEGIN ${procedureName}; END;`)
    await conn.commit()
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  } finally {
    if (conn) {
      await conn.close().catch(() => {})
    }
  }
})

// 统一的 SPA 降级路由（支持 HTML5 History 路由，如有）
app.get('*', (req, res) => {
  const indexHtml = path.join(distPath, 'index.html')
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml)
  } else {
    res.send('批量调岗智能辅助工具本地后台服务已启动。API 通信正常。')
  }
})

// 启动服务
app.listen(PORT, () => {
  console.log(`\n======================================================`)
  console.log(`🚀 批量调岗智能辅助工具轻量 Web 服务已成功启动！`)
  console.log(`👉 控制台访问路径: http://localhost:${PORT}`)
  console.log(`👉 数据库代理接口: http://localhost:${PORT}/api/*`)
  console.log(`======================================================\n`)
})