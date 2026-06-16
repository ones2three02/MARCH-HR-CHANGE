import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import oracledb from 'oracledb'
import * as XLSX from 'xlsx'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保使用 Thin 模式（不需要 Oracle Instant Client 客户端）
// oracledb v6+ 在没有配置 native client 时默认就是 Thin 模式

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    titleBarStyle: 'hiddenInset', // 苹果风格的无边框
    webPreferences: {
      preload: fs.existsSync(path.join(__dirname, 'preload.mjs'))
        ? path.join(__dirname, 'preload.mjs')
        : path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // 如果是开发环境，加载 Vite 开发服务器
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // 生产环境下加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// --- 辅助函数：构造 Oracle 连接字符串 ---
function getConnectString(config: any) {
  if (config.connectType === 'sid' || (!config.connectType && config.sid)) {
    return `${config.host}:${config.port}:${config.sid}`
  }
  return `${config.host}:${config.port}/${config.serviceName}`
}

// --- IPC 逻辑处理 ---

// 1. 数据库测试连接
ipcMain.handle('db:test', async (_event, config: any) => {
  let conn
  try {
    conn = await oracledb.getConnection({
      user: config.user,
      password: config.password,
      connectString: getConnectString(config),
    })
    return { success: true }
  } catch (err: any) {
    return { success: false, message: err.message }
  } finally {
    if (conn) {
      await conn.close().catch(() => {})
    }
  }
})

// 2. 事务批量执行多条 SQL
ipcMain.handle('db:execute-batch', async (_event, config: any, sqls: string[]) => {
  let conn
  try {
    conn = await oracledb.getConnection({
      user: config.user,
      password: config.password,
      connectString: getConnectString(config),
    })
    
    // 开始事务
    for (const sql of sqls) {
      // 过滤掉空语句或只有空格的语句
      if (!sql.trim()) continue
      await conn.execute(sql)
    }
    // 提交事务
    await conn.commit()
    return { success: true }
  } catch (err: any) {
    if (conn) {
      await conn.rollback().catch(() => {})
    }
    return { success: false, message: err.message }
  } finally {
    if (conn) {
      await conn.close().catch(() => {})
    }
  }
})

// 3. 执行查询并返回结果集
ipcMain.handle('db:query', async (_event, config: any, sql: string) => {
  let conn
  try {
    conn = await oracledb.getConnection({
      user: config.user,
      password: config.password,
      connectString: getConnectString(config),
    })
    const result = await conn.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })
    return { success: true, rows: result.rows, metaData: result.metaData }
  } catch (err: any) {
    return { success: false, message: err.message }
  } finally {
    if (conn) {
      await conn.close().catch(() => {})
    }
  }
})

// 4. 执行存储过程
ipcMain.handle('db:execute-procedure', async (_event, config: any, procedureName: string) => {
  let conn
  try {
    conn = await oracledb.getConnection({
      user: config.user,
      password: config.password,
      connectString: getConnectString(config),
    })
    
    // 执行存储过程，在 PL/SQL 中要用 BEGIN ... END; 包裹起来
    await conn.execute(`BEGIN ${procedureName}; END;`)
    await conn.commit()
    return { success: true }
  } catch (err: any) {
    return { success: false, message: err.message }
  } finally {
    if (conn) {
      await conn.close().catch(() => {})
    }
  }
})

// 5. 弹出保存对话框，将备份数据导出为本地 Excel 文件
ipcMain.handle('file:export-excel', async (_event, data: any[]) => {
  if (!mainWindow) return { success: false, message: '主窗口不存在' }
  
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: '保存备份数据',
    defaultPath: `调岗备份数据_${new Date().toISOString().slice(0, 10)}.xlsx`,
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
  })
  
  if (!filePath) {
    return { success: false, message: '用户取消了导出' }
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '备份存档')
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    fs.writeFileSync(filePath, buffer)
    return { success: true, filePath }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
})

// 6. 保存数据库配置到本地 (加密或普通存储在 appData 下)
ipcMain.handle('config:save', async (_event, config: any) => {
  try {
    const configPath = path.join(app.getPath('userData'), 'db_config.json')
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    return { success: true }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
})

// 7. 读取本地数据库配置
ipcMain.handle('config:load', async () => {
  try {
    const configPath = path.join(app.getPath('userData'), 'db_config.json')
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      return { success: true, config: JSON.parse(data) }
    }
    return { success: true, config: null }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
})
