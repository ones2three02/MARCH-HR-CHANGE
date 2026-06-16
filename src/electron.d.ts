interface Window {
  electronAPI: {
    dbTest: (config: any) => Promise<{ success: boolean; message?: string }>
    dbExecuteBatch: (config: any, sqls: string[]) => Promise<{ success: boolean; message?: string }>
    dbQuery: (config: any, sql: string) => Promise<{ success: boolean; rows?: any[]; metaData?: any[]; message?: string }>
    dbExecuteProcedure: (config: any, procedureName: string) => Promise<{ success: boolean; message?: string }>
    exportBackupExcel: (data: any[]) => Promise<{ success: boolean; filePath?: string; message?: string }>
    saveConfig: (config: any) => Promise<{ success: boolean; message?: string }>
    loadConfig: () => Promise<{ success: boolean; config: any; message?: string }>
  }
}

// 使用最简宽容声明彻底避免类型和兼容冲突
declare module 'element-plus';
declare module 'xlsx';
declare module '@element-plus/icons-vue';
