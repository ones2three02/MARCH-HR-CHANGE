<template>
  <div class="app-container">
    <!-- MacOS 顶部可拖拽无边框视窗占位区 -->
    <div class="titlebar-drag-region"></div>

    <!-- 一体化大面板底盘 (Workbench Console) -->
    <div class="bezel-shell titlebar-interactive">
      <div class="bezel-core">
        
        <!-- 左侧边栏 (Workbench Sidebar) -->
        <aside class="workbench-sidebar">
          <div class="sidebar-top">
            <!-- 侧边栏 Logo 区域 -->
            <div class="sidebar-logo">
              <el-icon class="sidebar-logo-icon" :size="24"><SwitchFilled /></el-icon>
              <span class="sidebar-logo-text">批量调岗控制台</span>
            </div>
            
            <!-- 竖向胶囊式导航 (Vertical Pill Tabs) -->
            <nav class="sidebar-nav">
              <div 
                class="nav-item" 
                :class="{ 'is-active': activeTab === 'config' }"
                @click="activeTab = 'config'"
              >
                <el-icon class="nav-icon"><Setting /></el-icon>
                <span>数据库配置</span>
              </div>
              
              <div 
                class="nav-item" 
                :class="{ 'is-active': activeTab === 'import' }"
                @click="activeTab = 'import'"
              >
                <el-icon class="nav-icon"><Upload /></el-icon>
                <span>数据导入校验</span>
              </div>
              
              <div 
                class="nav-item" 
                :class="{ 
                  'is-active': activeTab === 'wizard',
                  'is-disabled': parsedData.length === 0 
                }"
                @click="goToWizardPage"
              >
                <el-icon class="nav-icon"><Cpu /></el-icon>
                <span>分步调岗向导</span>
              </div>
            </nav>
          </div>
          
          <div class="sidebar-bottom">
            <!-- 主题一键切换卡 -->
            <button class="theme-switch-btn" @click="toggleTheme" style="width: 100%; margin-bottom: 12px;">
              <span class="theme-icon-container">
                <el-icon :size="16">
                  <Sunny v-if="themeMode === 'dark'" />
                  <Moon v-else />
                </el-icon>
              </span>
              <span>{{ themeMode === 'dark' ? 'Alabaster 浅色' : '曜石深色' }}</span>
            </button>

            <!-- 直连/SQL 模式切换卡 -->
            <div class="sidebar-toggle-card">
              <span class="toggle-title">工作运行模式</span>
              <el-switch
                v-model="dbConfig.directMode"
                class="mode-switch-compact"
                style="--el-switch-on-color: #059669; --el-switch-off-color: #2563eb"
                active-text="直连模式"
                inactive-text="SQL 导出"
                @change="handleModeChange"
              />
            </div>
            
            <!-- 数据库连接状态 -->
            <div class="sidebar-status">
              <span class="status-dot" :class="{ 'is-active': dbConnected }"></span>
              <span>{{ dbConnected ? '服务已连接' : '服务未连接' }}</span>
            </div>
          </div>
        </aside>

        <!-- 右侧主舞台 (Workbench Stage) -->
        <section class="workbench-stage">
          
          <!-- Tab 1: 数据库连接配置 -->
          <div v-show="activeTab === 'config'" class="stage-pane">
            <h3 class="stage-title">
              <el-icon class="stage-title-icon"><Setting /></el-icon> Oracle 数据库直连配置
            </h3>
            
            <el-form :model="dbConfig" label-width="120px" class="db-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="数据库主机">
                    <el-input v-model="dbConfig.host" placeholder="127.0.0.1" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="端口号">
                    <el-input v-model="dbConfig.port" placeholder="1521" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="用户名">
                    <el-input v-model="dbConfig.user" placeholder="SYSTEM" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="密码">
                    <el-input v-model="dbConfig.password" type="password" show-password placeholder="请输入密码" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="连接方式">
                    <el-radio-group v-model="dbConfig.connectType">
                      <el-radio value="serviceName">服务名 (ServiceName)</el-radio>
                      <el-radio value="sid">实例 ID (SID)</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12" v-if="dbConfig.connectType === 'serviceName'">
                  <el-form-item label="服务名">
                    <el-input v-model="dbConfig.serviceName" placeholder="例如: ORCL" />
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-else>
                  <el-form-item label="实例 SID">
                    <el-input v-model="dbConfig.sid" placeholder="例如: helowin" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="人力专员工号">
                    <el-input v-model="dbConfig.hrUser" placeholder="例如: 31430614" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item class="form-actions" label-width="0">
                <div style="display: flex; gap: 12px; width: 100%;">
                  <el-button type="primary" class="btn-primary-glow" @click="testDbConnection" :loading="testingConnection">
                    测试连接
                  </el-button>
                  <el-button type="success" class="btn-success-glow" @click="saveDbConfig">
                    保存配置
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </div>

          <!-- Tab 2: Excel上传与数据校验 -->
          <div v-show="activeTab === 'import'" class="stage-pane">
            <h3 class="stage-title">
              <el-icon class="stage-title-icon"><Upload /></el-icon> Excel 数据上传及合法性分析
            </h3>

            <!-- 拖拽上传区域 -->
            <div
              class="upload-drag-area"
              :class="{ 'drag-over': isDragOver }"
              @dragover.prevent="isDragOver = true"
              @dragleave="isDragOver = false"
              @drop.prevent="handleFileDrop"
              @click="triggerFileSelect"
            >
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">
                <p class="primary-text">将“员工调岗基础数据整理格式.xlsx”拖拽到此处，或<span>点击上传</span></p>
                <p class="sub-text">系统将自动分析表头并匹配后台字典（部门/岗位）校验</p>
              </div>
              <input ref="fileInput" type="file" accept=".xlsx" style="display: none" @change="handleFileSelect" />
            </div>

            <!-- 文件信息和分析结果展示 -->
            <div v-if="parsedData.length > 0" class="analysis-results">
              <div class="file-summary">
                <el-descriptions title="解析摘要" :column="3" border>
                  <el-descriptions-item label="文件名">{{ fileName }}</el-descriptions-item>
                  <el-descriptions-item label="总条数">{{ parsedData.length }} 条</el-descriptions-item>
                  <el-descriptions-item label="数据状态">
                    <el-tag :type="validationErrors.length > 0 ? 'danger' : 'success'">
                      {{ validationErrors.length > 0 ? `有 ${validationErrors.length} 项异常` : '校验通过 (无异常)' }}
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 异常明细展示 -->
              <div v-if="validationErrors.length > 0" class="error-section">
                <h4 class="section-title error-text">
                  <el-icon><Warning /></el-icon> 发现 {{ validationErrors.length }} 处可能导致数据库报错的异常：
                </h4>
                <el-table :data="validationErrors" style="width: 100%" class="error-table" height="200px">
                  <el-table-column prop="rowNum" label="Excel行号" width="100" />
                  <el-table-column prop="empNo" label="员工编号" width="120" />
                  <el-table-column prop="field" label="出错字段" width="150" />
                  <el-table-column prop="val" label="填写值" width="180" />
                  <el-table-column prop="reason" label="异常原因" />
                </el-table>
              </div>

              <!-- 数据表格预览 (只显示前 15 条以保性能) -->
              <div class="preview-section">
                <h4 class="section-title">
                  <el-icon><View /></el-icon> 数据预览 (仅显示前 15 条)
                </h4>
                <el-table :data="parsedData.slice(0, 15)" style="width: 100%" height="300px">
                  <el-table-column prop="员工编号" label="工号" width="120" />
                  <el-table-column prop="调后域" label="调后域" width="90" />
                  <el-table-column prop="调后部门ID" label="调后部门ID" width="120" />
                  <el-table-column prop="调后岗位编码" label="岗位编码" width="150" />
                  <el-table-column prop="调后板块" label="板块" width="90" />
                  <el-table-column prop="调岗日期" label="调岗日期" width="150" />
                  <el-table-column prop="原因" label="调岗原因" width="150" />
                  <el-table-column prop="调后工资表ID" label="工资表ID" width="110" />
                  <el-table-column prop="人力专员" label="人力专员" width="110" />
                </el-table>
              </div>

              <!-- 执行跳转按钮 -->
              <div class="action-bar">
                <el-button type="primary" size="large" class="btn-primary-glow" @click="goToWizard">
                  下一步：进入批量调岗向导
                </el-button>
              </div>
            </div>
          </div>

          <!-- Tab 3: 分步操作控制台 -->
          <div v-show="activeTab === 'wizard'" class="stage-pane">
            <h3 class="stage-title">
              <el-icon class="stage-title-icon"><Cpu /></el-icon> 分步调岗向导工作台
            </h3>

            <!-- 步骤条 -->
            <el-steps :active="wizardStep" finish-status="success" align-center class="custom-steps">
              <el-step title="导入临时表" description="写入 Excel 数据" />
              <el-step title="数据映射" description="生成正式调岗表" />
              <el-step title="对照备份" description="备份员工当前信息" />
              <el-step title="更新生效" description="运行调岗更新过程" />
            </el-steps>

            <!-- 步骤一：导入临时表 -->
            <div v-show="wizardStep === 0" class="step-container">
              <div class="step-info">
                <h3>步骤 1：清空并导入调岗数据至临时表 (Bl_Hr_Temp_Ff_Tab)</h3>
                <p class="description-text">
                  此步骤将清空临时表 `Bl_Hr_Temp_Ff_Tab` 的历史数据，并将导入 {{ parsedData.length }} 条记录作为调岗基础。
                </p>
              </div>

              <div class="step-body">
                <!-- 直连模式 -->
                <div v-if="dbConfig.directMode" class="direct-action">
                  <div class="info-alert">
                    <p><strong>直连状态：</strong> 已开启数据库直连。点击下方按钮，系统将自动在数据库中执行清空并批量插入操作。</p>
                  </div>
                  <el-button type="primary" size="large" class="btn-primary-glow" @click="executeStep1Direct" :loading="step1Loading">
                    一键在库中清空并导入临时表
                  </el-button>
                </div>

                <!-- SQL 导出模式 -->
                <div v-else class="sql-action">
                  <div class="info-alert">
                    <p><strong>SQL模式：</strong> 复制以下 PL/SQL 代码，在 PL/SQL Developer 的 SQL 窗口中一键运行：</p>
                  </div>
                  <div class="sql-code-box">
                    <pre><code>{{ step1Sql }}</code></pre>
                    <el-button type="success" size="small" class="copy-btn btn-success-glow" @click="copyText(step1Sql)">
                      一键复制 SQL
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="step-footer">
                <el-button type="primary" @click="nextStep" :disabled="dbConfig.directMode && !step1Done">
                  已完成，进入下一步
                </el-button>
              </div>
            </div>

            <!-- 步骤二：数据映射（导入正式表） -->
            <div v-show="wizardStep === 1" class="step-container">
              <div class="step-info">
                <h3>步骤 2：生成并导入正式调岗记录 (Bl_Hr_Per_Change_Tab)</h3>
                <p class="description-text">
                  此步骤将临时表中的数据进行格式转换，生成调岗表所需的完整记录。为新记录自增分配唯一的 ID 主键。
                </p>
              </div>

              <div class="step-body">
                <!-- 自增 ID 交互 -->
                <div class="id-calc-box glass-card">
                  <el-form label-width="150px" style="max-width: 500px">
                    <el-form-item label="当前正式表最大 ID">
                      <el-input-number v-model="maxIdInput" :min="0" style="width: 200px" :disabled="dbConfig.directMode && dbConnected" />
                      <el-button v-if="dbConfig.directMode && dbConnected" type="info" size="small" style="margin-left: 10px" @click="fetchMaxId" :loading="fetchingMaxId">
                        重新获取
                      </el-button>
                      <div class="help-text">新写入数据的 ID 将从此最大值 + 1 开始依次递增累加。</div>
                    </el-form-item>
                  </el-form>
                </div>

                <!-- 直连模式 -->
                <div v-if="dbConfig.directMode" class="direct-action" style="margin-top: 20px">
                  <div class="info-alert">
                    <p><strong>直连状态：</strong> 点击下方按钮，系统将自动基于最新的最大 ID，在数据库中完成向正式表的写入。</p>
                  </div>
                  <el-button type="primary" size="large" class="btn-primary-glow" @click="executeStep2Direct" :loading="step2Loading" :disabled="maxIdInput === 0">
                    一键在库中自动执行调岗表写入
                  </el-button>
                </div>

                <!-- SQL 导出模式 -->
                <div v-else class="sql-action" style="margin-top: 20px">
                  <div class="info-alert">
                    <p><strong>SQL模式：</strong> 基于最大 ID {{ maxIdInput }} 生成的批量插入 SQL，复制后在 PL/SQL Developer 中运行：</p>
                  </div>
                  <div class="sql-code-box">
                    <pre><code>{{ step2Sql }}</code></pre>
                    <el-button type="success" size="small" class="copy-btn btn-success-glow" @click="copyText(step2Sql)">
                      一键复制 SQL
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="step-footer">
                <el-button @click="prevStep">上一步</el-button>
                <el-button type="primary" @click="nextStep" :disabled="dbConfig.directMode && !step2Done">
                  已完成，进入下一步
                </el-button>
              </div>
            </div>

            <!-- 步骤三：数据备份存档 -->
            <div v-show="wizardStep === 2" class="step-container">
              <div class="step-info">
                <h3>步骤 3：调岗前基础数据对照备份</h3>
                <p class="description-text">
                  在最终生效更新前，我们需要备份受本次调岗影响的 {{ parsedData.length }} 名员工当前的真实人事信息以防万一。
                </p>
              </div>

              <div class="step-body">
                <!-- 直连模式 -->
                <div v-if="dbConfig.directMode" class="direct-action">
                  <div class="info-alert">
                    <p><strong>直连状态：</strong> 系统将根据本次调岗数据执行备份查询，并支持直接将结果导出为 Excel 存档。</p>
                  </div>
                  <el-button type="success" size="large" class="btn-success-glow" @click="executeStep3Direct" :loading="step3Loading">
                    <el-icon style="margin-right: 8px"><Download /></el-icon> 执行备份并导出 Excel 存档
                  </el-button>
                </div>

                <!-- SQL 导出模式 -->
                <div v-else class="sql-action">
                  <div class="info-alert">
                    <p><strong>SQL模式：</strong> 自动生成的备份 SQL，复制并在 PL/SQL Developer 中查询并导出 Excel 存档：</p>
                  </div>
                  <div class="sql-code-box">
                    <pre><code>{{ step3Sql }}</code></pre>
                    <el-button type="success" size="small" class="copy-btn btn-success-glow" @click="copyText(step3Sql)">
                      一键复制 SQL
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="step-footer">
                <el-button @click="prevStep">上一步</el-button>
                <el-button type="primary" @click="nextStep" :disabled="dbConfig.directMode && !step3Done">
                  备份完毕，进入下一步
                </el-button>
              </div>
            </div>

            <!-- 步骤四：执行更新存储过程 -->
            <div v-show="wizardStep === 3" class="step-container">
              <div class="step-info">
                <h3>步骤 4：执行调岗更新存储过程</h3>
                <p class="description-text">
                  调岗生效的最后一步。执行后将正式根据已录入的调岗数据，更新员工的真实岗位、部门及绩效工资表。
                </p>
              </div>

              <div class="step-body">
                <div class="danger-warning glass-card">
                  <div class="warning-header">
                    <el-icon class="warning-icon"><WarningFilled /></el-icon>
                    <h4>高危操作安全声明</h4>
                  </div>
                  <p class="warning-desc">
                    该操作将直接更新生产环境的员工数据。请务必确认前面步骤的数据已被正确写入且完成备份！
                  </p>
                </div>

                <!-- 直连模式 -->
                <div v-if="dbConfig.directMode" class="direct-action" style="margin-top: 20px">
                  <div class="info-alert">
                    <p><strong>直连状态：</strong> 点击下方按钮将直接向数据库提交并执行更新存储过程（有二次确认弹窗）。</p>
                  </div>
                  <el-button type="danger" size="large" class="btn-danger-glow" @click="executeStep4Direct" :loading="step4Loading">
                    确认执行调岗更新存储过程
                  </el-button>
                </div>

                <!-- SQL 导出模式 -->
                <div v-else class="sql-action" style="margin-top: 20px">
                  <div class="info-alert">
                    <p><strong>SQL模式：</strong> 复制以下 PL/SQL 代码，在 PL/SQL Developer 执行以生效本次调岗：</p>
                  </div>
                  <div class="sql-code-box">
                    <pre><code>{{ step4Sql }}</code></pre>
                    <el-button type="success" size="small" class="copy-btn btn-success-glow" @click="copyText(step4Sql)">
                      一键复制 SQL
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="step-footer">
                <el-button @click="prevStep">上一步</el-button>
                <el-button type="primary" @click="resetWizard" :disabled="!step4Done">
                  完成调岗流程
                </el-button>
              </div>
            </div>
          </div>

        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'

// --- 轻量 Web API 代理层 ---
const getApiUrl = (path: string) => {
  if (typeof window !== 'undefined') {
    const isDev = window.location.port === '5173' || window.location.port === '5174'
    if (isDev) {
      return `http://localhost:3000${path}`
    }
  }
  return path
}

const api = {
  async loadConfig() {
    try {
      const configStr = localStorage.getItem('dbConfig')
      if (configStr) {
        return { success: true, config: JSON.parse(configStr) }
      }
    } catch (e) {}
    return { success: true, config: null }
  },

  async saveConfig(config: any) {
    try {
      localStorage.setItem('dbConfig', JSON.stringify(config))
      return { success: true }
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  },

  async dbTest(config: any) {
    try {
      const res = await fetch(getApiUrl('/api/db-test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'HTTP 错误')
      return data
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  },

  async dbQuery(config: any, sql: string) {
    try {
      const res = await fetch(getApiUrl('/api/db-query'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, sql })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'HTTP 错误')
      return data
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  },

  async dbExecuteBatch(config: any, sqls: string[]) {
    try {
      const res = await fetch(getApiUrl('/api/db-execute-batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, sqls })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'HTTP 错误')
      return data
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  },

  async dbExecuteProcedure(config: any, procedureName: string) {
    try {
      const res = await fetch(getApiUrl('/api/db-execute-procedure'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, procedureName })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'HTTP 错误')
      return data
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  },

  async exportBackupExcel(rows: any[]): Promise<{ success: boolean; filePath?: string; message?: string }> {
    try {
      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '对照备份')
      XLSX.writeFile(workbook, '员工调岗前对照备份.xlsx')
      return { success: true, filePath: '已由浏览器下载至本地' }
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }
}

// --- 主题控制 ---
const themeMode = ref<'light' | 'dark'>('dark')

const toggleTheme = () => {
  themeMode.value = themeMode.value === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', themeMode.value)
  localStorage.setItem('theme', themeMode.value)
}

// --- 数据定义 ---
const activeTab = ref('config')
const dbConnected = ref(false)
const testingConnection = ref(false)
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')

// 数据库配置
const dbConfig = ref({
  host: '',
  port: '1521',
  user: '',
  password: '',
  connectType: 'serviceName', // 新增：连接类型 (serviceName 或 sid)
  serviceName: '',
  sid: '',
  hrUser: '31430614', // 默认人力专员
  directMode: false // 默认是纯 SQL 导出模式，不进行直连
})

const getPureConfig = () => {
  return JSON.parse(JSON.stringify(dbConfig.value))
}


// 解析的数据结构
interface PersonRow {
  员工编号: string
  调后域: string
  调后部门ID: string
  调后工资发放域: string
  调后工资发放部门ID: string
  调后岗位编码: string
  调后板块: string
  调岗日期: string
  原因: string
  调后工资表ID: string
  文员绩效考核部门ID: string
  人力专员: string
}

const parsedData = ref<PersonRow[]>([])
const validDeptsMap = ref<Map<string, string>>(new Map()) // 部门字典
const validPostsMap = ref<Map<string, string>>(new Map()) // 岗位字典

// 校验错误
interface ValidationError {
  rowNum: number
  empNo: string
  field: string
  val: string
  reason: string
}
const validationErrors = ref<ValidationError[]>([])

// 向导进度
const wizardStep = ref(0)
const maxIdInput = ref(0)
const fetchingMaxId = ref(false)

// 步骤完成状态（直连模式下校验使用）
const step1Done = ref(false)
const step1Loading = ref(false)
const step2Done = ref(false)
const step2Loading = ref(false)
const step3Done = ref(false)
const step3Loading = ref(false)
const step4Done = ref(false)
const step4Loading = ref(false)

// --- 生命钩子 ---
onMounted(async () => {
  // 1. 初始化主题
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
  if (savedTheme) {
    themeMode.value = savedTheme
  } else {
    themeMode.value = 'dark'
  }
  document.documentElement.setAttribute('data-theme', themeMode.value)

  // 2. 加载数据库配置
  const res = await api.loadConfig()
  if (res.success && res.config) {
    dbConfig.value = { ...dbConfig.value, ...res.config }
    // 如果之前是直连模式，尝试测试连接
    if (dbConfig.value.directMode) {
      testDbConnectionQuietly()
    }
  }
})

// 监听配置，如果有重要变更将状态置为未连接
watch(
  [() => dbConfig.value.host, () => dbConfig.value.port, () => dbConfig.value.user, () => dbConfig.value.password],
  () => {
    dbConnected.value = false
  }
)

// --- 方法：模式与配置 ---
const handleModeChange = (val: any) => {
  if (val) {
    // 直连模式，需要测试连接
    testDbConnection()
  } else {
    dbConnected.value = false
  }
  saveDbConfig()
}

const saveDbConfig = async () => {
  const res = await api.saveConfig(getPureConfig())
  if (res.success) {
    ElMessage.success('配置已保存到本地')
  } else {
    ElMessage.error('配置保存失败: ' + res.message)
  }
}

const testDbConnection = async () => {
  if (!dbConfig.value.host || !dbConfig.value.user || !dbConfig.value.password) {
    ElMessage.warning('请先完整填写数据库主机、用户名和密码！')
    dbConfig.value.directMode = false
    return
  }
  testingConnection.value = true
  try {
    const res = await api.dbTest(getPureConfig())
    if (res.success) {
      dbConnected.value = true
      ElMessage.success('数据库连接测试成功！')
      // 如果在向导第二步，连通后尝试拉取最大ID
      if (wizardStep.value === 1) {
        fetchMaxId()
      }
    } else {
      dbConnected.value = false
      dbConfig.value.directMode = false
      ElMessageBox.alert('连接失败，详情如下：\n' + res.message, '连接测试失败', { type: 'error' })
    }
  } catch (err: any) {
    dbConnected.value = false
    dbConfig.value.directMode = false
    ElMessage.error('测试出错: ' + err.message)
  } finally {
    testingConnection.value = false
  }
}

const testDbConnectionQuietly = async () => {
  if (!dbConfig.value.host || !dbConfig.value.user || !dbConfig.value.password) return
  try {
    const res = await api.dbTest(getPureConfig())
    dbConnected.value = res.success
  } catch (err) {}
}

// --- 方法：文件解析与校验 ---
const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length > 0) {
    parseExcelFile(files[0])
  }
}

const handleFileDrop = (e: DragEvent) => {
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    parseExcelFile(files[0])
  }
}

const parseExcelFile = (file: File) => {
  if (!file.name.endsWith('.xlsx')) {
    ElMessage.error('仅支持导入 .xlsx 格式的 Excel 文件！')
    return
  }
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = (e: any) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    
    // 1. 读取参考字典
    readReferenceDictionaries(workbook)

    // 2. 读取要调岗的人员名单
    const sheetName = '整理-调岗基础信息整理2026'
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      ElMessageBox.alert(`Excel 中未找到名称为 [${sheetName}] 的工作表，请使用标准模板！`, '工作表错误', { type: 'error' })
      return
    }

    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    if (jsonData.length <= 1) {
      ElMessage.warning('工作表中没有检测到有效数据！')
      return
    }

    // 表头解析
    // const headers = jsonData[0] as any[]
    
    // 数据行提取与整理
    const rows: PersonRow[] = []
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[]
      if (!row || row.length === 0 || row.every(val => val === null || val === undefined || val === '')) continue

      // 按位置读取（即使表头被微改也可以按列顺序映射）
      rows.push({
        员工编号: String(row[0] || '').trim(),
        调后域: String(row[1] || '').trim(),
        调后部门ID: String(row[2] || '').trim(),
        调后工资发放域: String(row[3] || '').trim(),
        调后工资发放部门ID: String(row[4] || '').trim(),
        调后岗位编码: String(row[5] || '').trim(),
        调后板块: String(row[6] || '').trim(),
        调岗日期: formatExcelDate(row[7]),
        原因: String(row[8] || '组织架构调整').trim(),
        调后工资表ID: String(row[9] || '').trim(),
        文员绩效考核部门ID: String(row[10] || '').trim(),
        人力专员: String(row[12] || dbConfig.value.hrUser).trim() // 第13列
      })
    }

    parsedData.value = rows
    validateData()
  }
  reader.readAsArrayBuffer(file)
}

const formatExcelDate = (val: any): string => {
  if (!val) return ''
  if (typeof val === 'number') {
    // 处理 Excel 序列日期数
    const date = new Date((val - 25569) * 86400 * 1000)
    return date.toISOString().slice(0, 10)
  }
  if (typeof val === 'string') {
    // 截取类似 ISO 的日期前段
    if (val.includes('T')) return val.split('T')[0]
    return val.trim()
  }
  return ''
}

// 读取岗位和部门参考页签
const readReferenceDictionaries = (workbook: any) => {
  validDeptsMap.value.clear()
  validPostsMap.value.clear()

  // 1. 部门字典
  const deptSheet = workbook.Sheets['查看-部门']
  if (deptSheet) {
    const rows = XLSX.utils.sheet_to_json(deptSheet) as any[]
    rows.forEach(row => {
      const deptId = String(row['部门ID'] || '').trim()
      const desc = String(row['部门描述'] || '').trim()
      if (deptId) {
        validDeptsMap.value.set(deptId, desc)
      }
    })
  }

  // 2. 岗位字典
  const postSheet = workbook.Sheets['查看-岗位']
  if (postSheet) {
    const rows = XLSX.utils.sheet_to_json(postSheet) as any[]
    rows.forEach(row => {
      const postCode = String(row['岗位编码'] || '').trim()
      const desc = String(row['岗位描述'] || '').trim()
      if (postCode) {
        validPostsMap.value.set(postCode, desc)
      }
    })
  }
}

// 智能逻辑校验
const validateData = () => {
  validationErrors.value = []

  parsedData.value.forEach((row, index) => {
    const rowNum = index + 2 // Excel 是 1-indexed，且第1行是表头

    if (!row.员工编号) {
      validationErrors.value.push({
        rowNum,
        empNo: '未知',
        field: '员工编号',
        val: '',
        reason: '员工编号不能为空'
      })
    }

    if (!row.调岗日期) {
      validationErrors.value.push({
        rowNum,
        empNo: row.员工编号,
        field: '调岗日期',
        val: '',
        reason: '调岗日期不能为空'
      })
    }

    // 校验部门 ID 是否存在于参考数据中
    if (row.调后部门ID && validDeptsMap.value.size > 0) {
      if (!validDeptsMap.value.has(row.调后部门ID)) {
        validationErrors.value.push({
          rowNum,
          empNo: row.员工编号,
          field: '调后部门ID',
          val: row.调后部门ID,
          reason: `部门ID在[查看-部门]页签的字典中不存在！`
        })
      }
    }

    // 校验岗位编码是否存在
    if (row.调后岗位编码 && validPostsMap.value.size > 0) {
      if (!validPostsMap.value.has(row.调后岗位编码)) {
        validationErrors.value.push({
          rowNum,
          empNo: row.员工编号,
          field: '调后岗位编码',
          val: row.调后岗位编码,
          reason: `岗位编码在[查看-岗位]页签的字典中不存在！`
        })
      }
    }
  })

  if (validationErrors.value.length === 0) {
    ElMessage.success('数据格式与基础字典校验成功！全部有效！')
  } else {
    ElMessage.warning(`校验完毕：发现 ${validationErrors.value.length} 处格式或编码不匹配，请注意确认！`)
  }
}

const goToWizard = () => {
  activeTab.value = 'wizard'
  wizardStep.value = 0
  if (dbConfig.value.directMode && dbConnected.value) {
    fetchMaxId()
  }
}

// --- SQL 拼接生成器逻辑 ---

// 步骤 1 SQL：插入临时表
const step1Sql = computed(() => {
  if (parsedData.value.length === 0) return '-- 无数据'
  
  let sqls = []
  sqls.push('DECLARE')
  sqls.push('BEGIN')
  sqls.push('  -- 1. 清空临时表')
  sqls.push('  DELETE FROM Bl_Hr_Temp_Ff_Tab;')
  sqls.push('')
  sqls.push('  -- 2. 批量插入本次调岗基础数据')
  
  parsedData.value.forEach(row => {
    // 拼装每条 Insert
    const c1 = row.员工编号
    const c2 = row.调后域
    const c3 = row.调后部门ID
    const c4 = row.调后工资发放域
    const c5 = row.调后工资发放部门ID
    const c6 = row.调后岗位编码
    const c7 = row.调后板块
    const c8 = row.调岗日期
    const c9 = row.原因
    const c10 = row.调后工资表ID
    const c11 = row.文员绩效考核部门ID || row.调后部门ID // 非文员默认调后部门ID
    const c13 = row.人力专员

    sqls.push(`  INSERT INTO Bl_Hr_Temp_Ff_Tab (Col1, Col2, Col3, Col4, Col5, Col6, Col7, Col8, Col9, Col10, Col11, Col13) VALUES ` + 
              `('${c1}', '${c2}', '${c3}', '${c4}', '${c5}', '${c6}', '${c7}', '${c8}', '${c9}', '${c10}', '${c11}', '${c13}');`)
  })
  
  sqls.push('')
  sqls.push('  COMMIT;')
  sqls.push('END;')
  
  return sqls.join('\n')
})

// 步骤 2 SQL：根据自增 ID 批量写入正式调岗表
const step2Sql = computed(() => {
  if (parsedData.value.length === 0) return '-- 无数据'

  let sqls = []
  sqls.push('DECLARE')
  sqls.push('BEGIN')
  sqls.push('  -- 批量向 BL_HR_PER_CHANGE_TAB 插入完整映射记录')

  let curId = Number(maxIdInput.value)
  parsedData.value.forEach(row => {
    curId += 1
    const empNo = row.员工编号
    const postCode = row.调后岗位编码
    const changeDate = row.调岗日期
    const hrUser = row.人力专员
    const reason = row.原因
    const deptId = row.调后部门ID
    const contract = row.调后域
    const wageContract = row.调后工资发放域
    const wageDept = row.调后工资发放部门ID
    const unit = row.调后板块
    const pwId = row.调后工资表ID
    const kpiDeptId = row.文员绩效考核部门ID || row.调后部门ID

    // 使用 Word 文档中完整的 Insert 模板转换每一条
    // 这里做主键和各个 Col 替换
    sqls.push(`  -- 员工 [${empNo}] 调岗插入`)
    sqls.push(`  Insert Into Bl_Hr_Per_Change_Tab (id, p_id, f_contract, f_dept_id, f_post_code, t_contract, t_dept_id, t_post_code, change_date, remark, enter_user, enter_date, change_reason, flag, f_unit, f_emptype, f_operatortype, f_pw_id, f_wage_contract, f_wage_dept, t_unit, t_emptype, t_operatortype, t_wage_contract, t_wage_dept, mail_flag, emp_no, f_jobtype, f_selltype, t_jobtype, t_selltype, change_type, the_phone, the_telephone, f_post_type, f_dept_manager_no, f_feevest, t_post_type, t_dept_manager_no, t_feevest, t_pw_id, state, f_kpi_dept_id, t_kpi_dept_id, if_real_shortage, hr_confirm_user, hr_update_flag)`)
    sqls.push(`  Select `)
    sqls.push(`    ${curId}, T1.p_Id, T1.Contract, T1.Dept_Id, T1.Post_Code, `)
    sqls.push(`    '${contract}', '${deptId}', Nvl('${postCode}', T1.Post_Code), To_Date('${changeDate}', 'yyyy-mm-dd'), `)
    sqls.push(`    '', '${hrUser}', Sysdate, '${reason}', '1', T1.Unit, T1.Emptype, T1.Operatortype, T1.Pw_Id, `)
    sqls.push(`    Nvl(T1.Wage_Contract, T1.Contract), Nvl(T1.Wage_Dept, T1.Dept_Id), `)
    sqls.push(`    '${unit}', T1.Emptype, T1.Operatortype, `)
    sqls.push(`    '${wageContract}', '${wageDept}', '0', '${empNo}', T1.Jobtype, T1.Selltype, T1.Jobtype, T1.Selltype, `)
    sqls.push(`    '2', '', T1.Mobilephone, Bl_Post_Api.Get_Post_Type(T1.Post_Code), '', T1.Feevest, `)
    sqls.push(`    Bl_Post_Api.Get_Post_Type(Nvl('${postCode}', T1.Post_Code)), '', Bl_Workshop_Api.Get_Feevest(Nvl(To_Number('${deptId}'), T1.Dept_Id)), `)
    sqls.push(`    Nvl('${pwId}', T1.Pw_Id), '1', T1.Kpi_Dept_Id, '${kpiDeptId}', '1', '${hrUser}', '0'`)
    sqls.push(`  From Bl_Hr_Personnel_Tab T1 Where T1.Emp_No = '${empNo}';`)
    sqls.push('')
  })

  sqls.push('  COMMIT;')
  sqls.push('END;')
  return sqls.join('\n')
})

// 步骤 3 SQL：备份前对照
const step3Sql = computed(() => {
  if (parsedData.value.length === 0) return '-- 无数据'

  const empNos = parsedData.value.map(r => `'${r.员工编号}'`).join(', ')
  const firstRow = parsedData.value[0]
  const hrUser = firstRow.人力专员
  const changeDate = firstRow.调岗日期

  return `Select t.Emp_No 员工编号,
       t.Emp_Name 员工姓名,
       t.Contract 工作所在域,
        (Select A1.t_contract
           From Bl_Hr_Per_Change_Tab A1
          Where A1.Emp_No = t.Emp_No
            And A1.Enter_User = '${hrUser}'
            And A1.Change_Date = To_Date('${changeDate}', 'yyyy-mm-dd')
            And To_Char(A1.Enter_Date, 'yyyy-mm-dd') =
                To_Char(Sysdate, 'yyyy-mm-dd')) 调后工作所在域,
       t.Dept_Id 工作所在部门id,
       Bl_Workshop_Api.Get_Description_(t.Dept_Id) 工作所在部门描述,
       (Select A2.t_Dept_Id
          From Bl_Hr_Per_Change_Tab A2
         Where A2.Emp_No = t.Emp_No
           And A2.Enter_User = '${hrUser}'
           And A2.Change_Date = To_Date('${changeDate}', 'yyyy-mm-dd')
           And To_Char(A2.Enter_Date, 'yyyy-mm-dd') =
               To_Char(Sysdate, 'yyyy-mm-dd')) 调后工作所在部门id,
       Bl_Workshop_Api.Get_Description_((Select A2.t_Dept_Id
                                          From Bl_Hr_Per_Change_Tab A2
                                         Where A2.Emp_No = t.Emp_No
                                           And A2.Enter_User = '${hrUser}'
                                           And A2.Change_Date =
                                               To_Date('${changeDate}',
                                                       'yyyy-mm-dd')
                                           And To_Char(A2.Enter_Date,
                                                       'yyyy-mm-dd') =
                                               To_Char(Sysdate,
                                                       'yyyy-mm-dd'))) 调后工作所在部门描述,
       t.Wage_Contract 工资发放域,
       (Select A3.t_Wage_Contract
          From Bl_Hr_Per_Change_Tab A3
         Where A3.Emp_No = t.Emp_No
           And A3.Enter_User = '${hrUser}'
           And A3.Change_Date = To_Date('${changeDate}', 'yyyy-mm-dd')
           And To_Char(A3.Enter_Date, 'yyyy-mm-dd') =
               To_Char(Sysdate, 'yyyy-mm-dd')) 调后工资发放域,
       t.Wage_Dept 工资发放部门,
       (Select A4.t_Wage_Dept
          From Bl_Hr_Per_Change_Tab A4
         Where A4.Emp_No = t.Emp_No
           And A4.Enter_User = '${hrUser}'
           And A4.Change_Date = To_Date('${changeDate}', 'yyyy-mm-dd')
           And To_Char(A4.Enter_Date, 'yyyy-mm-dd') =
               To_Char(Sysdate, 'yyyy-mm-dd')) 调后工资发放部门,
       t.Post_Code 岗位编码,
       (Select A5.t_Post_Code
          From Bl_Hr_Per_Change_Tab A5
         Where A5.Emp_No = t.Emp_No
           And A5.Enter_User = '${hrUser}'
           And A5.Change_Date = To_Date('${changeDate}', 'yyyy-mm-dd')
           And To_Char(A5.Enter_Date, 'yyyy-mm-dd') =
               To_Char(Sysdate, 'yyyy-mm-dd')) 调后岗位编码,
       t.Unit 板块,
       (Select A6.t_Unit
          From Bl_Hr_Per_Change_Tab A6
         Where A6.Emp_No = t.Emp_No
           And A6.Enter_User = '${hrUser}'
           And A6.Change_Date = To_Date('${changeDate}', 'yyyy-mm-dd')
           And To_Char(A6.Enter_Date, 'yyyy-mm-dd') =
               To_Char(Sysdate, 'yyyy-mm-dd')) 调后板块,
       t.Kpi_Dept_Id 调前绩效考核部门id,
       (Select A6.t_Kpi_Dept_Id
          From Bl_Hr_Per_Change_Tab A6
         Where A6.Emp_No = t.Emp_No
           And A6.Enter_User = '${hrUser}'
           And A6.Change_Date = To_Date('${changeDate}', 'yyyy-mm-dd')
           And To_Char(A6.Enter_Date, 'yyyy-mm-dd') =
               To_Char(Sysdate, 'yyyy-mm-dd')) 调后绩效考核部门id,
       (Select t.Dept_Id
          From Bl_Kpi_Person_Tab t
         Where t.A007_Id = T.Emp_No) 员工当前绩效考核中的考核部门id,
       t.Pw_Id 调前工资表id,
       (Select A6.t_Pw_Id
          From Bl_Hr_Per_Change_Tab A6
         Where A6.Emp_No = t.Emp_No
           And A6.Enter_User = '${hrUser}'
           And A6.Change_Date = To_Date('${changeDate}', 'yyyy-mm-dd')
           And To_Char(A6.Enter_Date, 'yyyy-mm-dd') =
               To_Char(Sysdate, 'yyyy-mm-dd')) 调后工资表id,
       t.*,
       Sysdate 数据导出时间
  From Bl_Hr_Personnel_Tab t
 Where t.Emp_No In (${empNos})
   And Exists
 (Select 1 From Bl_Hr_Temp_Ff_Tab a Where a.Col1 = t.Emp_No);`
})

// 步骤 4 SQL：存储过程执行
const step4Sql = `BEGIN
  Bl_Hr_Per_Change_Api.Auto_To_Update_Hrm__(0, null, 1);
END;`

// --- 辅助工具：复制文本 ---
const copyText = (text: string) => {
  navigator.clipboard.writeText(text).then(
    () => ElMessage.success('已成功复制到剪贴板！'),
    () => ElMessage.error('复制失败，请手动选择复制。')
  )
}

// --- 步骤直连执行逻辑 ---

// 1. 获取最大 ID
const fetchMaxId = async () => {
  if (!dbConnected.value) return
  fetchingMaxId.value = true
  try {
    const res = await api.dbQuery(getPureConfig(), 'SELECT MAX(id) as max_id FROM BL_HR_PER_CHANGE_TAB')
    if (res.success && res.rows && res.rows.length > 0) {
      const maxVal = res.rows[0].MAX_ID || 0
      maxIdInput.value = Number(maxVal)
      ElMessage.success(`成功从数据库同步最大 ID: ${maxVal}`)
    } else {
      ElMessage.error('获取最大 ID 失败：' + res.message)
    }
  } catch (err: any) {
    ElMessage.error('查询出错: ' + err.message)
  } finally {
    fetchingMaxId.value = false
  }
}

// 2. 步骤 1 直连执行
const executeStep1Direct = async () => {
  if (!dbConnected.value) {
    ElMessage.error('数据库未连接，请先配置并测试连接！')
    return
  }
  
  step1Loading.value = true
  try {
    // 拆分 PL/SQL 的执行语句（主进程的 executeBatch 支持数组）
    const sqls = []
    sqls.push('DELETE FROM Bl_Hr_Temp_Ff_Tab')
    
    parsedData.value.forEach(row => {
      const c1 = row.员工编号
      const c2 = row.调后域
      const c3 = row.调后部门ID
      const c4 = row.调后工资发放域
      const c5 = row.调后工资发放部门ID
      const c6 = row.调后岗位编码
      const c7 = row.调后板块
      const c8 = row.调岗日期
      const c9 = row.原因
      const c10 = row.调后工资表ID
      const c11 = row.文员绩效考核部门ID || row.调后部门ID
      const c13 = row.人力专员

      sqls.push(
        `INSERT INTO Bl_Hr_Temp_Ff_Tab (Col1, Col2, Col3, Col4, Col5, Col6, Col7, Col8, Col9, Col10, Col11, Col13) VALUES ` + 
        `('${c1}', '${c2}', '${c3}', '${c4}', '${c5}', '${c6}', '${c7}', '${c8}', '${c9}', '${c10}', '${c11}', '${c13}')`
      )
    })

    const res = await api.dbExecuteBatch(getPureConfig(), sqls)
    if (res.success) {
      step1Done.value = true
      ElMessage.success('临时表数据批量导入成功！')
    } else {
      ElMessageBox.alert(res.message, '导入临时表失败', { type: 'error' })
    }
  } catch (err: any) {
    ElMessage.error('执行失败: ' + err.message)
  } finally {
    step1Loading.value = false
  }
}

// 3. 步骤 2 直连执行
const executeStep2Direct = async () => {
  if (!dbConnected.value) {
    ElMessage.error('数据库未连接！')
    return
  }
  
  step2Loading.value = true
  try {
    const sqls: string[] = []
    let curId = Number(maxIdInput.value)

    parsedData.value.forEach(row => {
      curId += 1
      const empNo = row.员工编号
      const postCode = row.调后岗位编码
      const changeDate = row.调岗日期
      const hrUser = row.人力专员
      const reason = row.原因
      const deptId = row.调后部门ID
      const contract = row.调后域
      const wageContract = row.调后工资发放域
      const wageDept = row.调后工资发放部门ID
      const unit = row.调后板块
      const pwId = row.调后工资表ID
      const kpiDeptId = row.文员绩效考核部门ID || row.调后部门ID

      // 拼装每条 Insert
      sqls.push(
        `Insert Into Bl_Hr_Per_Change_Tab (id, p_id, f_contract, f_dept_id, f_post_code, t_contract, t_dept_id, t_post_code, change_date, remark, enter_user, enter_date, change_reason, flag, f_unit, f_emptype, f_operatortype, f_pw_id, f_wage_contract, f_wage_dept, t_unit, t_emptype, t_operatortype, t_wage_contract, t_wage_dept, mail_flag, emp_no, f_jobtype, f_selltype, t_jobtype, t_selltype, change_type, the_phone, the_telephone, f_post_type, f_dept_manager_no, f_feevest, t_post_type, t_dept_manager_no, t_feevest, t_pw_id, state, f_kpi_dept_id, t_kpi_dept_id, if_real_shortage, hr_confirm_user, hr_update_flag) ` +
        `Select ` +
        `  ${curId}, T1.p_Id, T1.Contract, T1.Dept_Id, T1.Post_Code, ` +
        `  '${contract}', '${deptId}', Nvl('${postCode}', T1.Post_Code), To_Date('${changeDate}', 'yyyy-mm-dd'), ` +
        `  '', '${hrUser}', Sysdate, '${reason}', '1', T1.Unit, T1.Emptype, T1.Operatortype, T1.Pw_Id, ` +
        `  Nvl(T1.Wage_Contract, T1.Contract), Nvl(T1.Wage_Dept, T1.Dept_Id), ` +
        `  '${unit}', T1.Emptype, T1.Operatortype, ` +
        `  '${wageContract}', '${wageDept}', '0', '${empNo}', T1.Jobtype, T1.Selltype, T1.Jobtype, T1.Selltype, ` +
        `  '2', '', T1.Mobilephone, Bl_Post_Api.Get_Post_Type(T1.Post_Code), '', T1.Feevest, ` +
        `  Bl_Post_Api.Get_Post_Type(Nvl('${postCode}', T1.Post_Code)), '', Bl_Workshop_Api.Get_Feevest(Nvl(To_Number('${deptId}'), T1.Dept_Id)), ` +
        `  Nvl('${pwId}', T1.Pw_Id), '1', T1.Kpi_Dept_Id, '${kpiDeptId}', '1', '${hrUser}', '0' ` +
        `From Bl_Hr_Personnel_Tab T1 Where T1.Emp_No = '${empNo}'`
      )
    })

    const res = await api.dbExecuteBatch(getPureConfig(), sqls)
    if (res.success) {
      step2Done.value = true
      ElMessage.success('批量写入正式调岗表成功！')
    } else {
      ElMessageBox.alert(res.message, '写入调岗表失败', { type: 'error' })
    }
  } catch (err: any) {
    ElMessage.error('执行出错: ' + err.message)
  } finally {
    step2Loading.value = false
  }
}

// 4. 步骤 3 直连执行 (备份数据查询并导出)
const executeStep3Direct = async () => {
  if (!dbConnected.value) {
    ElMessage.error('数据库未连接！')
    return
  }

  step3Loading.value = true
  try {
    // 运行备份 SQL
    const res = await api.dbQuery(getPureConfig(), step3Sql.value)
    if (res.success && res.rows) {
      if (res.rows.length === 0) {
        ElMessage.warning('备份查询未匹配到任何员工，请核实前面的步骤数据是否已成功导入！')
        step3Loading.value = false
        return
      }
      
      // 导出为 Excel
      const exportRes = await api.exportBackupExcel(res.rows)
      if (exportRes.success) {
        step3Done.value = true
        ElMessageBox.alert(`备份文件导出成功！\n文件路径: ${exportRes.filePath}`, '备份成功', { type: 'success' })
      } else {
        ElMessage.warning('导出已取消或失败: ' + exportRes.message)
      }
    } else {
      ElMessageBox.alert(res.message, '备份查询失败', { type: 'error' })
    }
  } catch (err: any) {
    ElMessage.error('备份执行出错: ' + err.message)
  } finally {
    step3Loading.value = false
  }
}

// 5. 步骤 4 直连执行
const executeStep4Direct = async () => {
  if (!dbConnected.value) {
    ElMessage.error('数据库未连接！')
    return
  }

  ElMessageBox.confirm(
    '您确定要最终执行调岗数据更新存储过程吗？此操作是不可逆的真实业务更新！',
    '高危业务操作确认',
    {
      confirmButtonText: '确定执行',
      cancelButtonText: '取消操作',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    step4Loading.value = true
    try {
      const res = await api.dbExecuteProcedure(getPureConfig(), 'Bl_Hr_Per_Change_Api.Auto_To_Update_Hrm__(0, null, 1)')
      if (res.success) {
        step4Done.value = true
        ElMessageBox.alert('批量调岗更新存储过程执行成功！本次人员调岗已正式生效。', '调岗更新成功', { type: 'success' })
      } else {
        ElMessageBox.alert(res.message, '执行更新失败', { type: 'error' })
      }
    } catch (err: any) {
      ElMessage.error('调用出错: ' + err.message)
    } finally {
      step4Loading.value = false
    }
  }).catch(() => {
    ElMessage.info('操作已取消')
  })
}

// --- 导航步骤跳转 ---
const nextStep = () => {
  if (wizardStep.value < 3) {
    wizardStep.value++
  }
}

const prevStep = () => {
  if (wizardStep.value > 0) {
    wizardStep.value--
  }
}

const resetWizard = () => {
  wizardStep.value = 0
  step1Done.value = false
  step2Done.value = false
  step3Done.value = false
  step4Done.value = false
  parsedData.value = []
  fileName.value = ''
  activeTab.value = 'import'
  ElMessage.success('向导流程已重置，可重新导入文件进行新一轮操作')
}

const goToWizardPage = () => {
  if (parsedData.value.length === 0) {
    ElMessage.warning('请先导入并校验 Excel 数据！')
    return
  }
  goToWizard()
}
</script>

<style scoped>
.app-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 20px;
  box-sizing: border-box;
}

/* 导航项置灰 */
.nav-item.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

/* 直连模式微调 */
.mode-switch-compact {
  transform: scale(0.9);
  transform-origin: left center;
}
.mode-switch-compact :deep(.el-switch__label) {
  font-size: 11px;
  color: #64748b;
}
.mode-switch-compact :deep(.el-switch__label.is-active) {
  color: #0f172a;
  font-weight: 600;
}

.db-form {
  max-width: 900px;
}

.form-actions {
  margin-top: 28px;
}

/* 水晶拖拽岛屿 (The Crystal Drop Zone) */
.upload-drag-area {
  border: 2px dashed rgba(37, 99, 235, 0.2);
  border-radius: 16px;
  padding: 50px 20px;
  text-align: center;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.02) 0%, rgba(255, 255, 255, 0.8) 100%);
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: inset 0 2px 8px rgba(37, 99, 235, 0.01);
}

.upload-drag-area:hover, .upload-drag-area.drag-over {
  border-color: var(--accent-color);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(255, 255, 255, 1) 100%);
  box-shadow: 
    inset 0 2px 8px rgba(37, 99, 235, 0.02),
    0 12px 30px -10px rgba(37, 99, 235, 0.15);
}

.upload-icon {
  font-size: 48px;
  color: #64748b;
  margin-bottom: 16px;
  transition: transform 0.3s;
}

.upload-drag-area:hover .upload-icon {
  transform: translateY(-4px);
  color: #2563eb;
}

.upload-text .primary-text {
  font-size: 16px;
  color: #334155;
  margin: 0 0 8px 0;
}

.upload-text .primary-text span {
  color: #2563eb;
  font-weight: 600;
}

.upload-text .sub-text {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.analysis-results {
  margin-top: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  margin-bottom: 12px;
  color: #1e293b;
}

.error-text {
  color: #dc2626;
}

.error-table {
  border-radius: 8px;
  border: 1px solid rgba(220, 38, 38, 0.15);
  background: rgba(220, 38, 38, 0.01) !important;
}

.action-bar {
  margin-top: 24px;
  text-align: right;
}

/* 向导步骤样式 */
.custom-steps {
  margin-bottom: 28px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.step-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 12px;
}

.step-info h3 {
  margin: 0 0 8px 0;
  color: #1e293b;
}

.description-text {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.info-alert {
  background: rgba(37, 99, 235, 0.05);
  border: 1px solid rgba(37, 99, 235, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 14px;
}

.info-alert p {
  margin: 0;
  color: #475569;
}

.sql-code-box {
  position: relative;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
  margin-top: 10px;
}

.sql-code-box pre {
  margin: 0;
  overflow: auto;
  max-height: 350px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #38bdf8;
}

.copy-btn {
  position: absolute;
  top: 12px;
  right: 12px;
}

.step-footer {
  margin-top: 32px;
  display: flex;
  justify-content: space-between;
}

.id-calc-box {
  background: rgba(255, 255, 255, 0.6) !important;
  padding: 16px 20px;
}

.help-text {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
  line-height: 1.4;
}

.danger-warning {
  border: 1px solid rgba(220, 38, 38, 0.2);
  background: rgba(220, 38, 38, 0.02);
  padding: 20px;
  border-radius: 12px;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.warning-icon {
  color: #dc2626;
}

.warning-header h4 {
  margin: 0;
  font-size: 16px;
  color: #dc2626;
}

.warning-desc {
  margin: 0;
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
}
</style>