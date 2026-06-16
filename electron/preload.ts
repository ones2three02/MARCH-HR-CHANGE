import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  dbTest: (config: any) => ipcRenderer.invoke('db:test', config),
  dbExecuteBatch: (config: any, sqls: string[]) => ipcRenderer.invoke('db:execute-batch', config, sqls),
  dbQuery: (config: any, sql: string) => ipcRenderer.invoke('db:query', config, sql),
  dbExecuteProcedure: (config: any, procedureName: string) => ipcRenderer.invoke('db:execute-procedure', config, procedureName),
  exportBackupExcel: (data: any[]) => ipcRenderer.invoke('file:export-excel', data),
  saveConfig: (config: any) => ipcRenderer.invoke('config:save', config),
  loadConfig: () => ipcRenderer.invoke('config:load'),
})
