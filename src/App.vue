<template>
  <div class="app-container">
    <!-- MacOS/Windows 顶部无边框拖拽区 -->
    <div class="titlebar-drag-region"></div>

    <!-- 一体化 Workbench 双底座大面板 -->
    <div class="bezel-shell titlebar-interactive">
      <div class="bezel-core">

        <!-- 1. 顶部控制台 Header 综合状态栏 -->
        <header class="workbench-header">
          <div class="header-left">
            <div class="header-title-badge">
              <span class="header-pulse-dot"></span>
              <span class="header-title-text">WORKBENCH V{{ appVersion }}</span>
            </div>
            <div class="header-env-badge" :class="currentProfileEnvClass">
              <el-icon><Platform /></el-icon>
              <span>{{ currentProfileName }}</span>
            </div>
          </div>

          <div class="header-right">
            <div class="header-stat-item">
              <span class="stat-label">运行模式:</span>
              <span class="stat-value mode" :class="dbConfig.directMode ? 'direct' : 'sql'">
                {{ dbConfig.directMode ? 'Oracle 直连' : 'SQL 导出' }}
              </span>
            </div>
            <div class="header-divider"></div>
            <div class="header-stat-item">
              <span class="stat-label">数据状态:</span>
              <span class="stat-value" :class="parsedData.length > 0 ? 'active' : ''">
                {{ parsedData.length > 0 ? `${parsedData.length} 条已载入` : '未载入数据' }}
              </span>
            </div>
            <div class="header-divider"></div>
            <div class="header-stat-item update-trigger" @click="openUpdateModal" title="点击检测系统更新">
              <el-icon class="update-icon" :class="{ 'has-badge': hasNewUpdate }"><Download /></el-icon>
              <span class="stat-value">{{ hasNewUpdate ? '新版本可用 ➔' : `v${appVersion}` }}</span>
            </div>
          </div>
        </header>

        <div class="workbench-main-body">
          <!-- 2. 左侧边栏 (Workbench Sidebar) -->
          <aside class="workbench-sidebar">
            <div class="sidebar-top">
              <!-- 侧边栏 Logo 区域 -->
              <div class="sidebar-logo">
                <div class="sidebar-logo-badge">
                  <el-icon class="sidebar-logo-icon" :size="20"><SwitchFilled /></el-icon>
                </div>
                <div class="sidebar-logo-title-group">
                  <span class="sidebar-logo-text">批量调岗控制台</span>
                  <span class="sidebar-logo-sub">HR Executive Assistant</span>
                </div>
              </div>
              
              <!-- 竖向胶囊式导航 (Vertical Pill Tabs) -->
              <nav class="sidebar-nav">
                <div 
                  class="nav-item" 
                  :class="{ 'is-active': activeTab === 'config' }"
                  @click="activeTab = 'config'"
                >
                  <div class="nav-active-bar"></div>
                  <el-icon class="nav-icon"><Setting /></el-icon>
                  <span>数据库直连配置</span>
                </div>
                
                <div 
                  class="nav-item" 
                  :class="{ 'is-active': activeTab === 'import' }"
                  @click="activeTab = 'import'"
                >
                  <div class="nav-active-bar"></div>
                  <el-icon class="nav-icon"><Upload /></el-icon>
                  <span>数据导入校验</span>
                  <span class="nav-badge" v-if="parsedData.length">{{ parsedData.length }}</span>
                </div>
                
                <div 
                  class="nav-item" 
                  :class="{ 
                    'is-active': activeTab === 'wizard',
                    'is-disabled': parsedData.length === 0 
                  }"
                  @click="goToWizardPage"
                >
                  <div class="nav-active-bar"></div>
                  <el-icon class="nav-icon"><Cpu /></el-icon>
                  <span>分步调岗向导</span>
                </div>

                <div 
                  class="nav-item" 
                  :class="{ 'is-active': activeTab === 'audit' }"
                  @click="activeTab = 'audit'"
                >
                  <div class="nav-active-bar"></div>
                  <el-icon class="nav-icon"><Document /></el-icon>
                  <span>操作审计日志</span>
                </div>
              </nav>
            </div>
            
            <div class="sidebar-bottom">
              <!-- 软件版本与在线更新检测卡片 -->
              <div class="sidebar-update-card" @click="openUpdateModal" title="点击检测系统在线更新">
                <div class="update-card-left">
                  <div class="update-icon-box" :class="{ 'has-badge': hasNewUpdate }">
                    <el-icon class="update-card-icon"><Download /></el-icon>
                  </div>
                  <div class="update-card-info">
                    <span class="update-version-label">软件版本 v{{ appVersion }}</span>
                    <span class="update-status-label">{{ hasNewUpdate ? '发现新版本可用 ➔' : '检测在线更新 ➔' }}</span>
                  </div>
                </div>
                <span class="update-pulse-dot" v-if="hasNewUpdate" title="发现新版本可用"></span>
              </div>

              <!-- 主题一键切换卡 -->
              <button class="theme-switch-btn" @click="toggleTheme">
                <span class="theme-icon-container">
                  <el-icon :size="15">
                    <Sunny v-if="themeMode === 'dark'" />
                    <Moon v-else />
                  </el-icon>
                </span>
                <span>{{ themeMode === 'dark' ? '切换为 Alabaster 浅色' : '切换为 曜石深色' }}</span>
              </button>

              <!-- 直连/SQL 模式切换卡 -->
              <div class="sidebar-toggle-card">
                <div class="toggle-card-header">
                  <span class="toggle-title">工作运行模式</span>
                  <span class="toggle-tag">{{ dbConfig.directMode ? '直连执行' : 'SQL 导出' }}</span>
                </div>
                <el-switch
                  v-model="dbConfig.directMode"
                  class="mode-switch-compact"
                  style="--el-switch-on-color: #10b981; --el-switch-off-color: #6366f1"
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

          <!-- 3. 右侧主舞台 (Workbench Stage) -->
          <section class="workbench-stage">
            
            <!-- Tab 1: 数据库连接配置 -->
            <div v-show="activeTab === 'config'" class="stage-pane">
              <div class="profile-header">
                <h3 class="stage-title">
                  <el-icon class="stage-title-icon"><Setting /></el-icon> Oracle 数据库直连环境配置
                </h3>
                <div class="profile-selector-wrap">
                  <span style="font-size: 13px; color: var(--text-secondary);">当前环境:</span>
                  <el-select
                    v-model="currentProfileId"
                    @change="handleProfileChange"
                    placeholder="选择环境"
                    style="width: 160px;"
                  >
                    <el-option
                      v-for="item in dbProfiles"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                  <div style="display: flex; gap: 8px; margin-left: 8px;">
                    <el-button size="small" @click="promptAddProfile">
                      <el-icon><Plus /></el-icon> 新增环境
                    </el-button>
                    <el-button type="danger" plain size="small" @click="deleteCurrentProfile" :disabled="dbProfiles.length <= 1">
                      <el-icon><Delete /></el-icon> 删除
                    </el-button>
                  </div>
                </div>
              </div>
              
              <el-form :model="dbConfig" label-position="top" class="db-form" style="max-width: 780px;">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="数据库主机 (Host)">
                      <el-input v-model="dbConfig.host" placeholder="127.0.0.1" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="端口号 (Port)">
                      <el-input v-model="dbConfig.port" placeholder="1521" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="用户名 (User)">
                      <el-input v-model="dbConfig.user" placeholder="SYSTEM" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="密码 (Password)">
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
                    <el-form-item label="服务名 (ServiceName)">
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
                      测试 Oracle 连接
                    </el-button>
                    <el-button type="success" class="btn-success-glow" @click="saveDbConfig">
                      保存环境配置
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

              <!-- 文件信息与指标统计 Summary -->
              <div v-if="parsedData.length > 0" class="analysis-results">
                <!-- 指标卡片 Grid -->
                <div class="metrics-card-grid">
                  <div class="metric-card">
                    <div class="metric-icon-box primary">
                      <el-icon><Files /></el-icon>
                    </div>
                    <div class="metric-info">
                      <span class="metric-value">{{ parsedData.length }}</span>
                      <span class="metric-label">调岗数据总条数</span>
                    </div>
                  </div>

                  <div class="metric-card" :class="validationErrors.length > 0 ? 'danger' : 'success'">
                    <div class="metric-icon-box" :class="validationErrors.length > 0 ? 'danger' : 'success'">
                      <el-icon><Warning v-if="validationErrors.length > 0" /><CircleCheckFilled v-else /></el-icon>
                    </div>
                    <div class="metric-info">
                      <span class="metric-value">{{ validationErrors.length }}</span>
                      <span class="metric-label">{{ validationErrors.length > 0 ? '项格式与合法性异常' : '无任何字段报错' }}</span>
                    </div>
                  </div>

                  <div class="metric-card success">
                    <div class="metric-icon-box success">
                      <el-icon><Select /></el-icon>
                    </div>
                    <div class="metric-info">
                      <span class="metric-value">{{ parsedData.length - validationErrors.length }}</span>
                      <span class="metric-label">预估完美可执行记录</span>
                    </div>
                  </div>
                </div>

                <!-- 异常明细展示 -->
                <div v-if="validationErrors.length > 0" class="error-section">
                  <h4 class="section-title error-text" style="color: var(--danger-color); font-size: 14px; font-weight: 700; margin-bottom: 10px;">
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
                <div class="preview-section" style="margin-top: 16px;">
                  <h4 class="section-title" style="font-size: 14px; font-weight: 700; margin-bottom: 10px;">
                    <el-icon><View /></el-icon> 数据预览 (仅显示前 15 条)
                  </h4>
                  <el-table :data="parsedData.slice(0, 15)" style="width: 100%" height="260px">
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
                <div class="action-bar" style="margin-top: 20px; display: flex; justify-content: flex-end;">
                  <el-button type="primary" size="large" class="btn-primary-glow" @click="goToWizard">
                    下一步：进入批量调岗向导 ➔
                  </el-button>
                </div>
              </div>
            </div>

            <!-- Tab 3: 分步操作控制台 -->
            <div v-show="activeTab === 'wizard'" class="stage-pane">
              <div style="display: flex; justify-content: space-between; align-items: center;" class="stage-header-bar">
                <h3 class="stage-title" style="margin: 0;">
                  <el-icon class="stage-title-icon"><Cpu /></el-icon> 分步调岗向导工作台
                </h3>
                <el-button type="success" size="default" class="btn-success-glow" @click="downloadFullSqlScript" icon="Download">
                  📥 一键下载全流程 .sql 脚本
                </el-button>
              </div>

              <!-- 4 步骤极简 Node 流 -->
              <div class="wizard-stepper-bar">
                <div 
                  v-for="(stepItem, index) in ['1. 导入临时表', '2. 数据映射', '3. 对照备份', '4. 更新生效']" 
                  :key="index"
                  class="step-node"
                  :class="{ 
                    'is-active': wizardStep === index,
                    'is-completed': wizardStep > index
                  }"
                  @click="wizardStep > index && (wizardStep = index)"
                >
                  <div class="step-node-icon">
                    <el-icon v-if="wizardStep > index"><Check /></el-icon>
                    <span v-else>{{ index + 1 }}</span>
                  </div>
                  <span class="step-node-text">{{ stepItem }}</span>
                  <div v-if="index < 3" class="step-node-line"></div>
                </div>
              </div>

              <!-- 步骤一：导入临时表 -->
              <div v-show="wizardStep === 0" class="step-container">
                <div class="step-info">
                  <h4 style="margin: 0 0 6px 0; font-size: 15px;">步骤 1：清空并导入调岗数据至临时表 (Bl_Hr_Temp_Ff_Tab)</h4>
                  <p class="description-text" style="margin: 0; font-size: 13px; color: var(--text-secondary);">
                    此步骤将清空临时表 `Bl_Hr_Temp_Ff_Tab` 的历史数据，并将导入 {{ parsedData.length }} 条记录作为调岗基础。
                  </p>
                </div>

                <div class="step-body" style="margin-top: 16px;">
                  <!-- 直连模式 -->
                  <div v-if="dbConfig.directMode" class="direct-action">
                    <div class="info-alert" style="background: rgba(99, 102, 241, 0.05); padding: 12px; border-radius: 10px; margin-bottom: 16px;">
                      <p style="margin: 0; font-size: 13px; color: var(--text-regular);">
                        <strong>直连状态：</strong> 已开启数据库直连。点击下方按钮，系统将自动在数据库中执行清空并批量插入操作。
                      </p>
                    </div>
                    <el-button type="primary" size="large" class="btn-primary-glow" @click="executeStep1Direct" :loading="step1Loading">
                      一键在库中清空并导入临时表
                    </el-button>
                  </div>

                  <!-- SQL 导出模式 -->
                  <div v-else class="sql-action">
                    <div class="info-alert" style="background: rgba(99, 102, 241, 0.05); padding: 12px; border-radius: 10px; margin-bottom: 12px;">
                      <p style="margin: 0; font-size: 13px; color: var(--text-regular);">
                        <strong>SQL模式：</strong> 复制以下 PL/SQL 代码，在 PL/SQL Developer 的 SQL 窗口中一键运行：
                      </p>
                    </div>
                    <div class="sql-code-box">
                      <pre><code>{{ step1Sql }}</code></pre>
                      <el-button type="success" size="small" class="copy-btn btn-success-glow" @click="copyText(step1Sql)">
                        一键复制 SQL
                      </el-button>
                    </div>
                  </div>
                </div>

                <div class="step-footer" style="margin-top: 24px; display: flex; justify-content: flex-end;">
                  <el-button type="primary" @click="nextStep" :disabled="dbConfig.directMode && !step1Done">
                    已完成，进入下一步 ➔
                  </el-button>
                </div>
              </div>

              <!-- 步骤二：数据映射（导入正式表） -->
              <div v-show="wizardStep === 1" class="step-container">
                <div class="step-info">
                  <h4 style="margin: 0 0 6px 0; font-size: 15px;">步骤 2：生成并导入正式调岗记录 (Bl_Hr_Per_Change_Tab)</h4>
                  <p class="description-text" style="margin: 0; font-size: 13px; color: var(--text-secondary);">
                    此步骤将临时表中的数据进行格式转换，生成调岗表所需的完整记录。为新记录自增分配唯一的 ID 主键。
                  </p>
                </div>

                <div class="step-body" style="margin-top: 16px;">
                  <!-- 自增 ID 交互 -->
                  <div class="id-calc-box" style="background: rgba(0,0,0,0.06); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px;">
                    <el-form label-width="150px" style="max-width: 500px">
                      <el-form-item label="当前正式表最大 ID">
                        <el-input-number v-model="maxIdInput" :min="0" style="width: 200px" :disabled="dbConfig.directMode && dbConnected" />
                        <el-button v-if="dbConfig.directMode && dbConnected" type="info" size="small" style="margin-left: 10px" @click="fetchMaxId" :loading="fetchingMaxId">
                          重新获取
                        </el-button>
                        <div class="help-text" style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                          新写入数据的 ID 将从此最大值 + 1 开始依次递增累加。
                        </div>
                      </el-form-item>
                    </el-form>
                  </div>

                  <!-- 直连模式 -->
                  <div v-if="dbConfig.directMode" class="direct-action" style="margin-top: 16px">
                    <div class="info-alert" style="background: rgba(99, 102, 241, 0.05); padding: 12px; border-radius: 10px; margin-bottom: 16px;">
                      <p style="margin: 0; font-size: 13px;">
                        <strong>直连状态：</strong> 点击下方按钮，系统将自动基于最新的最大 ID，在数据库中完成向正式表的写入。
                      </p>
                    </div>
                    <el-button type="primary" size="large" class="btn-primary-glow" @click="executeStep2Direct" :loading="step2Loading" :disabled="maxIdInput === 0">
                      一键在库中自动执行调岗表写入
                    </el-button>
                  </div>

                  <!-- SQL 导出模式 -->
                  <div v-else class="sql-action" style="margin-top: 16px">
                    <div class="info-alert" style="background: rgba(99, 102, 241, 0.05); padding: 12px; border-radius: 10px; margin-bottom: 12px;">
                      <p style="margin: 0; font-size: 13px;">
                        <strong>SQL模式：</strong> 基于最大 ID {{ maxIdInput }} 生成的批量插入 SQL，复制后在 PL/SQL Developer 中运行：
                      </p>
                    </div>
                    <div class="sql-code-box">
                      <pre><code>{{ step2Sql }}</code></pre>
                      <el-button type="success" size="small" class="copy-btn btn-success-glow" @click="copyText(step2Sql)">
                        一键复制 SQL
                      </el-button>
                    </div>
                  </div>
                </div>

                <div class="step-footer" style="margin-top: 24px; display: flex; justify-content: space-between;">
                  <el-button @click="prevStep">上一步</el-button>
                  <el-button type="primary" @click="nextStep" :disabled="dbConfig.directMode && !step2Done">
                    已完成，进入下一步 ➔
                  </el-button>
                </div>
              </div>

              <!-- 步骤三：数据备份存档 -->
              <div v-show="wizardStep === 2" class="step-container">
                <div class="step-info">
                  <h4 style="margin: 0 0 6px 0; font-size: 15px;">步骤 3：调岗前基础数据对照备份</h4>
                  <p class="description-text" style="margin: 0; font-size: 13px; color: var(--text-secondary);">
                    在最终生效更新前，我们需要备份受本次调岗影响的 {{ parsedData.length }} 名员工当前的真实人事信息以防万一。
                  </p>
                </div>

                <div class="step-body" style="margin-top: 16px;">
                  <!-- 直连模式 -->
                  <div v-if="dbConfig.directMode" class="direct-action">
                    <div class="info-alert" style="background: rgba(99, 102, 241, 0.05); padding: 12px; border-radius: 10px; margin-bottom: 16px;">
                      <p style="margin: 0; font-size: 13px;">
                        <strong>直连状态：</strong> 系统将根据本次调岗数据执行备份查询，并支持直接将结果导出为 Excel 存档。
                      </p>
                    </div>
                    <el-button type="success" size="large" class="btn-success-glow" @click="executeStep3Direct" :loading="step3Loading">
                      <el-icon style="margin-right: 8px"><Download /></el-icon> 执行备份并导出 Excel 存档
                    </el-button>
                  </div>

                  <!-- SQL 导出模式 -->
                  <div v-else class="sql-action">
                    <div class="info-alert" style="background: rgba(99, 102, 241, 0.05); padding: 12px; border-radius: 10px; margin-bottom: 12px;">
                      <p style="margin: 0; font-size: 13px;">
                        <strong>SQL模式：</strong> 自动生成的备份 SQL，复制并在 PL/SQL Developer 中查询并导出 Excel 存档：
                      </p>
                    </div>
                    <div class="sql-code-box">
                      <pre><code>{{ step3Sql }}</code></pre>
                      <el-button type="success" size="small" class="copy-btn btn-success-glow" @click="copyText(step3Sql)">
                        一键复制 SQL
                      </el-button>
                    </div>
                  </div>

                  <!-- 级联 Diff 对照看板 -->
                  <div v-if="dbConfig.directMode && diffData.length > 0" class="diff-board-card">
                    <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                      <el-icon class="primary-text" :size="16" style="color: var(--accent-color);"><View /></el-icon>
                      <span style="font-weight: 700; font-size: 14px; color: var(--text-primary);">调岗级联 Diff 对照看板 (最终生效前核对)</span>
                    </div>
                    <div class="diff-table-container">
                      <div class="diff-row-header">
                        <div>工号</div>
                        <div>姓名</div>
                        <div>工作部门变更</div>
                        <div>工作岗位变更</div>
                        <div>其它核心级联变更 (域 / 工资表)</div>
                      </div>
                      <div v-for="row in diffData" :key="row['员工编号']" class="diff-row">
                        <div>{{ row['员工编号'] }}</div>
                        <div>{{ row['员工姓名'] }}</div>
                        <div>
                          <span class="diff-cell-old">{{ row['工作所在部门描述'] || row['工作所在部门id'] || '无' }}</span>
                          <span class="diff-arrow-icon">➔</span>
                          <span class="diff-cell-new">{{ row['调后工作所在部门描述'] || row['调后工作所在部门id'] || '未变' }}</span>
                        </div>
                        <div>
                          <span class="diff-cell-old">{{ row['岗位编码'] || '无' }}</span>
                          <span class="diff-arrow-icon">➔</span>
                          <span class="diff-cell-new">{{ row['调后岗位编码'] || '未变' }}</span>
                        </div>
                        <div>
                          <small style="opacity: 0.85;">
                            域: <span class="diff-cell-old">{{ row['工作所在域'] }}</span> ➔ <span class="diff-cell-new">{{ row['调后工作所在域'] }}</span>
                            |
                            工资表: <span class="diff-cell-old">{{ row['调前工资表id'] }}</span> ➔ <span class="diff-cell-new">{{ row['调后工资表id'] }}</span>
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="step-footer" style="margin-top: 24px; display: flex; justify-content: space-between;">
                  <el-button @click="prevStep">上一步</el-button>
                  <el-button type="primary" @click="nextStep" :disabled="dbConfig.directMode && !step3Done">
                    备份完毕，进入下一步 ➔
                  </el-button>
                </div>
              </div>

              <!-- 步骤四：执行更新存储过程 -->
              <div v-show="wizardStep === 3" class="step-container">
                <div class="step-info">
                  <h4 style="margin: 0 0 6px 0; font-size: 15px;">步骤 4：执行调岗更新存储过程</h4>
                  <p class="description-text" style="margin: 0; font-size: 13px; color: var(--text-secondary);">
                    调岗生效的最后一步。执行后将正式根据已录入的调岗数据，更新员工的真实岗位、部门及绩效工资表。
                  </p>
                </div>

                <div class="step-body" style="margin-top: 16px;">
                  <div class="danger-warning" style="background: rgba(244, 63, 94, 0.05); border: 1px solid rgba(244, 63, 94, 0.2); border-radius: 12px; padding: 16px;">
                    <div class="warning-header" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                      <el-icon class="warning-icon" style="color: var(--danger-color); font-size: 18px;"><WarningFilled /></el-icon>
                      <h4 style="margin: 0; font-size: 14px; color: var(--danger-color);">高危操作安全声明</h4>
                    </div>
                    <p class="warning-desc" style="margin: 0; font-size: 12.5px; color: var(--text-regular);">
                      该操作将直接更新数据库中的员工真实数据。请务必确认前面步骤的数据已被正确写入且完成备份！
                    </p>
                  </div>

                  <!-- 直连模式 -->
                  <div v-if="dbConfig.directMode" class="direct-action" style="margin-top: 16px">
                    <div class="info-alert" style="background: rgba(99, 102, 241, 0.05); padding: 12px; border-radius: 10px; margin-bottom: 16px;">
                      <p style="margin: 0; font-size: 13px;">
                        <strong>直连状态：</strong> 点击下方按钮将直接向数据库提交并执行更新存储过程（有二次确认弹窗）。
                      </p>
                    </div>
                    <el-button type="danger" size="large" class="btn-danger-glow" @click="executeStep4Direct" :loading="step4Loading">
                      确认执行调岗更新存储过程
                    </el-button>
                  </div>

                  <!-- SQL 导出模式 -->
                  <div v-else class="sql-action" style="margin-top: 16px">
                    <div class="info-alert" style="background: rgba(99, 102, 241, 0.05); padding: 12px; border-radius: 10px; margin-bottom: 12px;">
                      <p style="margin: 0; font-size: 13px;">
                        <strong>SQL模式：</strong> 复制以下 PL/SQL 代码，在 PL/SQL Developer 执行以生效本次调岗：
                      </p>
                    </div>
                    <div class="sql-code-box">
                      <pre><code>{{ step4Sql }}</code></pre>
                      <el-button type="success" size="small" class="copy-btn btn-success-glow" @click="copyText(step4Sql)">
                        一键复制 SQL
                      </el-button>
                    </div>
                  </div>
                </div>

                <div class="step-footer" style="margin-top: 24px; display: flex; justify-content: space-between;">
                  <el-button @click="prevStep">上一步</el-button>
                  <el-button type="primary" @click="resetWizard" :disabled="!step4Done">
                    完成调岗流程
                  </el-button>
                </div>
              </div>
            </div>

            <!-- Tab 4: 操作审计日志 -->
            <div v-show="activeTab === 'audit'" class="stage-pane">
              <h3 class="stage-title">
                <el-icon class="stage-title-icon"><Document /></el-icon> 批量调岗操作审计日志
              </h3>

              <!-- 过滤工具栏 -->
              <div class="filter-bar" style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.06); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-color);">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <span style="font-size: 13px; color: var(--text-secondary);">环境过滤:</span>
                  <el-select v-model="auditFilterProfile" placeholder="全部环境" clearable style="width: 150px;">
                    <el-option
                      v-for="item in dbProfiles"
                      :key="item.id"
                      :label="item.name"
                      :value="item.name"
                    />
                  </el-select>
                  
                  <span style="font-size: 13px; color: var(--text-secondary); margin-left: 12px;">状态过滤:</span>
                  <el-select v-model="auditFilterStatus" placeholder="全部状态" clearable style="width: 120px;">
                    <el-option label="成功" value="Success" />
                    <el-option label="失败" value="Failed" />
                  </el-select>
                </div>

                <div style="display: flex; gap: 12px;">
                  <el-button type="primary" class="btn-primary-glow" @click="exportAuditLogs">
                    <el-icon style="margin-right: 6px;"><Download /></el-icon> 导出审计 Excel
                  </el-button>
                  <el-button type="danger" @click="clearAuditLogs" :disabled="auditLogs.length === 0">
                    <el-icon style="margin-right: 6px;"><Delete /></el-icon> 清空日志
                  </el-button>
                </div>
              </div>

              <!-- 审计表格 -->
              <el-table :data="filteredAuditLogs" style="width: 100%; margin-top: 12px;" height="450px">
                <el-table-column prop="time" label="操作时间" width="180" />
                <el-table-column prop="hrUser" label="HR工号" width="120" />
                <el-table-column prop="profileName" label="连接环境" width="150" />
                <el-table-column prop="action" label="执行动作" width="180" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <span
                      class="audit-status-tag"
                      :style="{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: scope.row.status === 'Success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                        color: scope.row.status === 'Success' ? '#34d399' : '#fda4af',
                        border: `1px solid ${scope.row.status === 'Success' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`
                      }"
                    >
                      {{ scope.row.status === 'Success' ? '成功' : '失败' }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="details" label="详细信息" min-width="250" show-overflow-tooltip />
              </el-table>
            </div>

          </section>
        </div>
      </div>
    </div>

    <!-- 4. 异步批处理日志终端 (Terminal Console Overlay) -->
    <div v-if="consoleVisible" class="terminal-console-overlay">
      <div class="terminal-console-box">
        <div class="terminal-header">
          <div class="terminal-dots">
            <span class="terminal-dot dot-red"></span>
            <span class="terminal-dot dot-yellow"></span>
            <span class="terminal-dot dot-green"></span>
          </div>
          <div class="terminal-title">HR WORKSTATION BATCH CONSOLE</div>
          <div></div>
        </div>
        <div class="terminal-body">
          <!-- 实时日志输出面板 -->
          <div ref="terminalLogRef" class="terminal-log-output">
            <div v-for="log in consoleLogs" :key="log.id" class="log-row">
              <span class="log-time">[{{ log.time }}]</span>
              <span :class="'log-' + log.type">{{ log.text }}</span>
            </div>
          </div>
          
          <!-- 进度展示区 -->
          <div class="terminal-progress-area">
            <div style="display: flex; align-items: center; gap: 16px;">
              <el-progress 
                type="circle" 
                :percentage="progressPercent" 
                :status="processFailed ? 'exception' : (progressPercent === 100 ? 'success' : '')"
                :width="44"
              />
              <div>
                <div class="terminal-status-text">{{ consoleStatusText }}</div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                  线程 ID: OCI_DIRECT_CLIENT_POOL_0
                </div>
              </div>
            </div>
            
            <div style="display: flex; gap: 12px; align-items: center;">
              <span class="progress-percent" style="font-size: 18px; font-weight: 800; font-family: monospace; color: var(--accent-color);">{{ progressPercent }}%</span>
              <el-button 
                v-if="progressPercent === 100 || processFailed" 
                type="primary" 
                size="small" 
                @click="closeTerminal"
              >
                关闭终端
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. 系统在线更新模态框 -->
    <UpdateModal 
      v-model="updateModalVisible" 
      :current-version="appVersion" 
      @update-found="handleUpdateFound" 
    />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import { invoke } from '@tauri-apps/api/core'
import UpdateModal from './components/UpdateModal.vue'

// --- 在线更新状态与方法 ---
const updateModalVisible = ref(false)
const appVersion = ref('1.0.19')
const hasNewUpdate = ref(false)

const openUpdateModal = () => {
  updateModalVisible.value = true
}

const handleUpdateFound = (hasUpdate: boolean) => {
  hasNewUpdate.value = hasUpdate
}

// --- 轻量 Web API 代理层 ---
const getApiUrl = (path: string) => {
  if (typeof window !== 'undefined') {
    const isTauri = window.location.hostname === 'tauri.localhost' || window.location.protocol.startsWith('tauri')
    const isDev = window.location.port === '5173' || window.location.port === '5174'
    if (isDev || isTauri) {
      return `http://localhost:3000${path}`
    }
  }
  return path
}

const showBackendError = async () => {
  try {
    const logContent = await invoke<string>('get_node_log')
    ElMessageBox.alert(
      `<div style="text-align: left; font-family: monospace;">
        <p style="color: #ef4444; font-weight: bold; margin-bottom: 8px; font-size: 14px;">🔴 连接本地后台代理服务失败 (Failed to fetch)</p>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">以下为系统在系统临时目录下抓取到的后台 Node.js 启动日志 (node_server.log)：</p>
        <pre style="background: #0f172a; color: #f8fafc; padding: 12px; border-radius: 6px; max-height: 250px; overflow: auto; white-space: pre-wrap; font-size: 11px;">${logContent}</pre>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 10px;">提示：如果在日志中看到 DPI-1047 (Oracle Client Library 丢失)，请确保安装了 Oracle Instant Client 并配置环境变量。</p>
      </div>`,
      '系统后台报错抓取 Diagnostics',
      { dangerouslyUseHTMLString: true, confirmButtonText: '确定', customClass: 'backend-log-modal' }
    )
  } catch (err) {
    ElMessageBox.alert('无法获取后台日志信息。请确保本地 node 后台服务已成功拉起。', '系统提示')
  }
}

const api = {
  async testConnection(config: any) {
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
      let msg = e.message || String(e)
      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        msg = `${msg} (连接本地代理服务失败。请确保系统已全局安装 Node.js；若已安装，请在 Windows 地址栏输入 %TEMP% 并回车，查看 node_server.log 确认服务报错或 Oracle 驱动依赖。)`
      }
      return { success: false, message: msg }
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
      let msg = e.message || String(e)
      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        msg = `${msg} (连接本地代理服务失败。请确保系统已全局安装 Node.js；若已安装，请在 Windows 地址栏输入 %TEMP% 并回车，查看 node_server.log 确认服务报错或 Oracle 驱动依赖。)`
      }
      return { success: false, message: msg }
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
      let msg = e.message || String(e)
      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        msg = `${msg} (连接本地代理服务失败。请确保系统已全局安装 Node.js；若已安装，请在 Windows 地址栏输入 %TEMP% 并回车，查看 node_server.log 确认服务报错或 Oracle 驱动依赖。)`
      }
      return { success: false, message: msg }
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
      let msg = e.message || String(e)
      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        msg = `${msg} (连接本地代理服务失败。请确保系统已全局安装 Node.js；若已安装，请在 Windows 地址栏输入 %TEMP% 并回车，查看 node_server.log 确认服务报错或 Oracle 驱动依赖。)`
      }
      return { success: false, message: msg }
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

// 多环境 Profile 配置管理
interface DbProfile {
  id: string
  name: string
  host: string
  port: string
  user: string
  password?: string
  connectType: 'serviceName' | 'sid'
  serviceName: string
  sid: string
  hrUser: string
  directMode: boolean
}

const defaultProfiles: DbProfile[] = [
  {
    id: 'default-prod',
    name: 'PROD 生产环境 (SQL 导出模式)',
    host: '10.10.10.1',
    port: '1521',
    user: 'HR_PROD',
    password: '',
    connectType: 'serviceName',
    serviceName: 'ORCL_PROD',
    sid: '',
    hrUser: '31430614',
    directMode: false
  },
  {
    id: 'default-test',
    name: 'TEST 测试环境 (SQL 导出模式)',
    host: '127.0.0.1',
    port: '1521',
    user: 'SYSTEM',
    password: '',
    connectType: 'sid',
    serviceName: '',
    sid: 'helowin',
    hrUser: '31430614',
    directMode: false
  }
]

const dbProfiles = ref<DbProfile[]>([])
const currentProfileId = ref<string>('default-prod')

const dbConfig = ref<DbProfile>({ ...defaultProfiles[0] })

const currentProfileObj = computed(() => {
  return dbProfiles.value.find(p => p.id === currentProfileId.value)
})

const currentProfileName = computed(() => {
  return currentProfileObj.value ? currentProfileObj.value.name : '未选择环境'
})

const currentProfileEnvClass = computed(() => {
  const name = currentProfileName.value.toUpperCase()
  if (name.includes('PROD') || name.includes('生产')) return 'env-prod'
  if (name.includes('TEST') || name.includes('测试')) return 'env-test'
  return 'env-dev'
})

const loadProfilesFromStorage = () => {
  try {
    const saved = localStorage.getItem('dbProfiles')
    if (saved) {
      dbProfiles.value = JSON.parse(saved)
    } else {
      dbProfiles.value = defaultProfiles
      saveProfilesToStorage()
    }
  } catch (e) {
    dbProfiles.value = defaultProfiles
  }
}

const saveProfilesToStorage = () => {
  localStorage.setItem('dbProfiles', JSON.stringify(dbProfiles.value))
}

const handleProfileChange = (id: string) => {
  const selected = dbProfiles.value.find(p => p.id === id)
  if (selected) {
    dbConfig.value = { ...selected }
    dbConnected.value = false
  }
}

const saveDbConfig = () => {
  const index = dbProfiles.value.findIndex(p => p.id === currentProfileId.value)
  if (index !== -1) {
    dbProfiles.value[index] = { ...dbConfig.value }
    saveProfilesToStorage()
    ElMessage.success(`配置已成功保存到 [${dbConfig.value.name}]！`)
  }
}

const promptAddProfile = () => {
  ElMessageBox.prompt('请输入新环境配置的名称 (例如: 预发测试环境):', '新增连接环境', {
    confirmButtonText: '创建',
    cancelButtonText: '取消',
    inputPattern: /\S+/,
    inputErrorMessage: '名称不能为空'
  }).then(({ value }) => {
    const newId = 'profile-' + Date.now()
    const newProfile: DbProfile = {
      ...dbConfig.value,
      id: newId,
      name: value
    }
    dbProfiles.value.push(newProfile)
    currentProfileId.value = newId
    dbConfig.value = { ...newProfile }
    saveProfilesToStorage()
    ElMessage.success(`已创建新环境配置: ${value}`)
  }).catch(() => {})
}

const deleteCurrentProfile = () => {
  if (dbProfiles.value.length <= 1) {
    ElMessage.warning('必须保留至少一个连接环境！')
    return
  }
  const profile = dbProfiles.value.find(p => p.id === currentProfileId.value)
  const name = profile ? profile.name : ''
  ElMessageBox.confirm(`您确定要删除环境配置 [${name}] 吗？`, '删除环境确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = dbProfiles.value.findIndex(p => p.id === currentProfileId.value)
    if (index !== -1) {
      dbProfiles.value.splice(index, 1)
      const nextProfile = dbProfiles.value[0]
      currentProfileId.value = nextProfile.id
      saveProfilesToStorage()
      ElMessage.success(`已删除环境配置: ${name}`)
      handleProfileChange(nextProfile.id)
    }
  }).catch(() => {})
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
const validDeptsMap = ref<Map<string, string>>(new Map())
const validPostsMap = ref<Map<string, string>>(new Map())

interface ValidationError {
  rowNum: number
  empNo: string
  field: string
  val: string
  reason: string
}
const validationErrors = ref<ValidationError[]>([])

const wizardStep = ref(0)
const maxIdInput = ref(0)
const fetchingMaxId = ref(false)

const step1Done = ref(false)
const step1Loading = ref(false)
const step2Done = ref(false)
const step2Loading = ref(false)
const step3Done = ref(false)
const step3Loading = ref(false)
const step4Done = ref(false)
const step4Loading = ref(false)

const diffData = ref<any[]>([])

const auditLogs = ref<any[]>([])
const auditFilterProfile = ref('')
const auditFilterStatus = ref('')

const filteredAuditLogs = computed(() => {
  return auditLogs.value.filter(log => {
    const matchProfile = !auditFilterProfile.value || log.profileName === auditFilterProfile.value
    const matchStatus = !auditFilterStatus.value || log.status === auditFilterStatus.value
    return matchProfile && matchStatus
  })
})

const addAuditLog = (action: string, status: 'Success' | 'Failed', details: string) => {
  const profile = dbProfiles.value.find(p => p.id === currentProfileId.value)
  const profileName = profile ? profile.name : '未知环境'
  const logEntry = {
    id: Date.now().toString(),
    time: new Date().toLocaleString('zh-CN'),
    hrUser: dbConfig.value.hrUser || 'SYSTEM',
    profileName,
    action,
    status,
    details
  }
  auditLogs.value.unshift(logEntry)
  try {
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs.value))
  } catch (e) {}
}

const clearAuditLogs = () => {
  auditLogs.value = []
  localStorage.removeItem('auditLogs')
  ElMessage.success('操作审计日志已成功清空。')
}

const exportAuditLogs = () => {
  if (auditLogs.value.length === 0) {
    ElMessage.warning('暂无审计日志可导出')
    return
  }
  const worksheet = XLSX.utils.json_to_sheet(auditLogs.value)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '操作审计日志')
  XLSX.writeFile(workbook, `批量调岗审计日志_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// 终端控制台
interface ConsoleLog {
  id: string
  time: string
  type: 'info' | 'success' | 'error'
  text: string
}
const consoleVisible = ref(false)
const consoleLogs = ref<ConsoleLog[]>([])
const progressPercent = ref(0)
const consoleStatusText = ref('')
const processFailed = ref(false)
const terminalLogRef = ref<HTMLDivElement | null>(null)

const addConsoleLog = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
  consoleLogs.value.push({
    id: Math.random().toString(),
    time: new Date().toLocaleTimeString(),
    type,
    text
  })
  nextTick(() => {
    if (terminalLogRef.value) {
      terminalLogRef.value.scrollTop = terminalLogRef.value.scrollHeight
    }
  })
}

const closeTerminal = () => {
  consoleVisible.value = false
}

// 业务测试与数据流
const testDbConnection = async () => {
  testingConnection.value = true
  try {
    const res = await api.testConnection(dbConfig.value)
    if (res.success) {
      dbConnected.value = true
      saveDbConfig()
      ElMessage.success('Oracle 数据库物理连接测试成功！配置已自动保存。')
      addAuditLog('数据库连接测试', 'Success', `成功连通 Oracle (${dbConfig.value.host}:${dbConfig.value.port})`)
      fetchDictionaries()
    } else {
      dbConnected.value = false
      ElMessage.error(`连接失败: ${res.message}`)
      addAuditLog('数据库连接测试', 'Failed', `连接失败: ${res.message}`)
      showBackendError()
    }
  } finally {
    testingConnection.value = false
  }
}

const fetchDictionaries = async () => {
  if (!dbConnected.value) return
  try {
    const deptRes = await api.dbQuery(dbConfig.value, 'SELECT ORG_ID, ORG_DESC FROM BL_HR_ORG_TAB WHERE ENABLED = 1')
    if (deptRes.success && deptRes.data) {
      const map = new Map<string, string>()
      deptRes.data.forEach((r: any) => map.set(String(r.ORG_ID), r.ORG_DESC))
      validDeptsMap.value = map
    }

    const postRes = await api.dbQuery(dbConfig.value, 'SELECT POST_CODE, POST_NAME FROM BL_HR_POST_TAB WHERE ENABLED = 1')
    if (postRes.success && postRes.data) {
      const map = new Map<string, string>()
      postRes.data.forEach((r: any) => map.set(String(r.POST_CODE), r.POST_NAME))
      validPostsMap.value = map
    }
  } catch (e) {
    console.warn('获取字典表失败', e)
  }
}

const fetchMaxId = async () => {
  if (!dbConfig.value.directMode || !dbConnected.value) return
  fetchingMaxId.value = true
  try {
    const res = await api.dbQuery(dbConfig.value, 'SELECT NVL(MAX(ID), 0) AS MAX_ID FROM BL_HR_PER_CHANGE_TAB')
    if (res.success && res.data && res.data[0]) {
      maxIdInput.value = Number(res.data[0].MAX_ID)
      ElMessage.success(`自动从生产库获取到当前最大 ID: ${maxIdInput.value}`)
    }
  } finally {
    fetchingMaxId.value = false
  }
}

const handleModeChange = () => {
  saveDbConfig()
}

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    parseExcel(target.files[0])
  }
}

const handleFileDrop = (e: DragEvent) => {
  isDragOver.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    parseExcel(e.dataTransfer.files[0])
  }
}

const parseExcel = (file: File) => {
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = (e: ProgressEvent<FileReader>) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' })

      parsedData.value = jsonData.map(row => ({
        员工编号: String(row['员工编号'] || '').trim(),
        调后域: String(row['调后域'] || '').trim(),
        调后部门ID: String(row['调后部门ID'] || '').trim(),
        调后工资发放域: String(row['调后工资发放域'] || '').trim(),
        调后工资发放部门ID: String(row['调后工资发放部门ID'] || '').trim(),
        调后岗位编码: String(row['调后岗位编码'] || '').trim(),
        调后板块: String(row['调后板块'] || '').trim(),
        调岗日期: String(row['调岗日期'] || '').trim(),
        原因: String(row['原因'] || row['调岗原因'] || '').trim(),
        调后工资表ID: String(row['调后工资表ID'] || '').trim(),
        文员绩效考核部门ID: String(row['文员绩效考核部门ID'] || '').trim(),
        人力专员: String(row['人力专员'] || dbConfig.value.hrUser || '').trim()
      }))

      validateParsedData()
      ElMessage.success(`成功解析 Excel，共 ${parsedData.value.length} 条记录。`)
      addAuditLog('数据导入解析', 'Success', `导入 Excel 文件 [${file.name}]，解析条数: ${parsedData.value.length}`)
    } catch (err: any) {
      ElMessage.error(`Excel 文件解析失败: ${err.message}`)
      addAuditLog('数据导入解析', 'Failed', `解析文件错误: ${err.message}`)
    }
  }
  reader.readAsArrayBuffer(file)
}

const validateParsedData = () => {
  const errors: ValidationError[] = []
  parsedData.value.forEach((row, index) => {
    const rowNum = index + 2
    if (!row.员工编号) {
      errors.push({ rowNum, empNo: '空', field: '员工编号', val: '', reason: '员工编号不能为空' })
    }
    if (!row.调后部门ID) {
      errors.push({ rowNum, empNo: row.员工编号, field: '调后部门ID', val: '', reason: '调后部门ID不能为空' })
    } else if (validDeptsMap.value.size > 0 && !validDeptsMap.value.has(row.调后部门ID)) {
      errors.push({ rowNum, empNo: row.员工编号, field: '调后部门ID', val: row.调后部门ID, reason: '部门ID在BL_HR_ORG_TAB字典中不存在' })
    }
    if (!row.调后岗位编码) {
      errors.push({ rowNum, empNo: row.员工编号, field: '调后岗位编码', val: '', reason: '调后岗位编码不能为空' })
    } else if (validPostsMap.value.size > 0 && !validPostsMap.value.has(row.调后岗位编码)) {
      errors.push({ rowNum, empNo: row.员工编号, field: '调后岗位编码', val: row.调后岗位编码, reason: '岗位编码在BL_HR_POST_TAB字典中不存在' })
    }
  })
  validationErrors.value = errors
}

const goToWizardPage = () => {
  if (parsedData.value.length === 0) return
  activeTab.value = 'wizard'
  wizardStep.value = 0
  if (dbConfig.value.directMode && dbConnected.value) {
    fetchMaxId()
  }
}

const goToWizard = () => {
  goToWizardPage()
}

const prevStep = () => {
  if (wizardStep.value > 0) wizardStep.value--
}

const nextStep = () => {
  if (wizardStep.value < 3) wizardStep.value++
}

const resetWizard = () => {
  wizardStep.value = 0
  step1Done.value = false
  step2Done.value = false
  step3Done.value = false
  step4Done.value = false
  parsedData.value = []
  validationErrors.value = []
  activeTab.value = 'import'
  ElMessage.success('批量调岗流程顺利完成，已重置向导！')
}

// SQL 文本计算属性 (基于原厂真正的临时表 Bl_Hr_Temp_Ff_Tab 与 Col1~Col13 列结构)
const step1Sql = computed(() => {
  if (parsedData.value.length === 0) return '-- 暂无调岗数据'
  let sql = '-- 步骤 1：清空并全量导入临时表 Bl_Hr_Temp_Ff_Tab\nDELETE FROM Bl_Hr_Temp_Ff_Tab;\n\n'
  parsedData.value.forEach(row => {
    sql += `INSERT INTO Bl_Hr_Temp_Ff_Tab (Col1, Col2, Col3, Col4, Col5, Col6, Col7, Col8, Col9, Col10, Col11, Col13) VALUES ('${row.员工编号}', '${row.调后域}', '${row.调后部门ID}', '${row.调后工资发放域}', '${row.调后工资发放部门ID}', '${row.调后岗位编码}', '${row.调后板块}', '${row.调岗日期}', '${row.原因}', '${row.调后工资表ID}', '${row.文员绩效考核部门ID}', '${row.人力专员}');\n`
  })
  sql += '\nCOMMIT;'
  return sql
})

const step2Sql = computed(() => {
  if (parsedData.value.length === 0) return '-- 暂无调岗数据'
  let startId = maxIdInput.value
  let sql = `-- 步骤 2：基于员工主表动态关联生成 Bl_Hr_Per_Change_Tab 批量变更 SQL (起始 ID: ${startId})\n`
  parsedData.value.forEach(row => {
    startId++
    const empNo = row.员工编号
    const postCode = row.调后岗位编码
    const changeDate = row.调岗日期
    const hrUser = row.人力专员 || 'SYSTEM'
    const reason = row.原因 || '2026年集团任职资格认证调整'
    const deptId = row.调后部门ID
    const contract = row.调后域
    const wageContract = row.调后工资发放域 || contract
    const wageDept = row.调后工资发放部门ID || deptId
    const unit = row.调后板块 || '120'
    const pwId = row.调后工资表ID || ''
    const kpiDeptId = row.文员绩效考核部门ID || deptId

    sql += `Insert Into Bl_Hr_Per_Change_Tab (id, p_id, f_contract, f_dept_id, f_post_code, t_contract, t_dept_id, t_post_code, change_date, remark, enter_user, enter_date, change_reason, flag, f_unit, f_emptype, f_operatortype, f_pw_id, f_wage_contract, f_wage_dept, t_unit, t_emptype, t_operatortype, t_wage_contract, t_wage_dept, mail_flag, emp_no, f_jobtype, f_selltype, t_jobtype, t_selltype, change_type, the_phone, the_telephone, f_post_type, f_feevest, t_post_type, t_feevest, t_pw_id, state, f_kpi_dept_id, t_kpi_dept_id, if_real_shortage, hr_confirm_user, hr_update_flag) ` +
      `Select ${startId}, T1.p_Id, T1.Contract, T1.Dept_Id, T1.Post_Code, '${contract}', '${deptId}', Nvl('${postCode}', T1.Post_Code), To_Date('${changeDate}', 'yyyy-mm-dd'), '', '${hrUser}', Sysdate, '${reason}', '1', T1.Unit, T1.Emptype, T1.Operatortype, T1.Pw_Id, Nvl(T1.Wage_Contract, T1.Contract), Nvl(T1.Wage_Dept, T1.Dept_Id), '${unit}', T1.Emptype, T1.Operatortype, '${wageContract}', '${wageDept}', '0', '${empNo}', T1.Jobtype, T1.Selltype, T1.Jobtype, T1.Selltype, '2', '', T1.Mobilephone, Bl_Post_Api.Get_Post_Type(T1.Post_Code), T1.Feevest, Bl_Post_Api.Get_Post_Type(Nvl('${postCode}', T1.Post_Code)), Bl_Workshop_Api.Get_Feevest(Nvl(To_Number('${deptId}'), T1.Dept_Id)), Nvl('${pwId}', T1.Pw_Id), '1', T1.Kpi_Dept_Id, '${kpiDeptId}', '1', '${hrUser}', '0' From Bl_Hr_Personnel_Tab T1 Where T1.Emp_No = '${empNo}';\n`
  })
  sql += '\nCOMMIT;'
  return sql
})

const step3Sql = computed(() => {
  if (parsedData.value.length === 0) return '-- 暂无调岗数据'
  const empNos = parsedData.value.map(r => `'${r.员工编号}'`).join(',')
  return `-- 步骤 3：调岗前完整对照与历史备份查询\nSELECT T1.Emp_No AS 员工工号, T1.p_Id AS 人员ID, T1.Contract AS 当前域, T1.Dept_Id AS 当前部门ID, T1.Post_Code AS 当前岗位编码, T1.Wage_Contract AS 当前发薪域, T1.Wage_Dept AS 当前发薪部门, T1.Pw_Id AS 当前工资表ID FROM Bl_Hr_Personnel_Tab T1 WHERE T1.Emp_No IN (${empNos});`
})

const step4Sql = computed(() => {
  return `-- 步骤 4：调用官方底层 Api 存储过程包自动完成划转生效\nBEGIN\n  Bl_Hr_Per_Change_Api.Auto_To_Update_Hrm__(0, null, 1);\nEND;\n/`
})

const fullCombinedSql = computed(() => {
  return `-- ========================================================\n` +
    `-- 批量调岗全流程 Oracle 标准执行脚本 (.sql)\n` +
    `-- 数据量: ${parsedData.value.length} 条记录\n` +
    `-- 生成时间: ${new Date().toLocaleString()}\n` +
    `-- ========================================================\n\n` +
    `${step1Sql.value}\n\n` +
    `-- --------------------------------------------------------\n\n` +
    `${step2Sql.value}\n\n` +
    `-- --------------------------------------------------------\n\n` +
    `${step3Sql.value}\n\n` +
    `-- --------------------------------------------------------\n\n` +
    `${step4Sql.value}\n`
})

const downloadFullSqlScript = () => {
  if (parsedData.value.length === 0) {
    ElMessage.warning('暂无数据，请先导入并校验 Excel 调岗数据！')
    return
  }
  const blob = new Blob([fullCombinedSql.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `批量调岗全流程脚本_${new Date().toISOString().slice(0, 10)}.sql`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('全流程 SQL 脚本已成功一键导出下载！')
  addAuditLog('导出全流程SQL脚本', 'Success', `成功导出 ${parsedData.value.length} 条数据的完整 .sql 文件`)
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('SQL 代码已一键复制到剪贴板！')
  } catch (err) {
    ElMessage.error('复制失败，请手动选择代码复制')
  }
}

// 4 步骤直连底层逻辑
const executeStep1Direct = async () => {
  if (!dbConnected.value) {
    ElMessage.warning('请先成功连接数据库！')
    return
  }
  step1Loading.value = true
  consoleVisible.value = true
  consoleLogs.value = []
  progressPercent.value = 0
  processFailed.value = false
  consoleStatusText.value = '正在清空并全量写入临时表...'

  addConsoleLog('开始执行 [步骤 1：清空并导入临时表]...')
  addConsoleLog(`即将导入 ${parsedData.value.length} 条记录至 Oracle 临时表`)

  try {
    const delRes = await api.dbQuery(dbConfig.value, 'DELETE FROM Bl_Hr_Temp_Ff_Tab')
    if (!delRes.success) throw new Error(delRes.message)
    addConsoleLog('已清空历史临时表数据 (DELETE FROM Bl_Hr_Temp_Ff_Tab)', 'success')
    progressPercent.value = 30

    const sqls: string[] = []
    parsedData.value.forEach(row => {
      sqls.push(`INSERT INTO Bl_Hr_Temp_Ff_Tab (Col1, Col2, Col3, Col4, Col5, Col6, Col7, Col8, Col9, Col10, Col11, Col13) VALUES ('${row.员工编号}', '${row.调后域}', '${row.调后部门ID}', '${row.调后工资发放域}', '${row.调后工资发放部门ID}', '${row.调后岗位编码}', '${row.调后板块}', '${row.调岗日期}', '${row.原因}', '${row.调后工资表ID}', '${row.文员绩效考核部门ID}', '${row.人力专员}')`)
    })

    const batchRes = await api.dbExecuteBatch(dbConfig.value, sqls)
    if (!batchRes.success) throw new Error(batchRes.message)

    progressPercent.value = 100
    consoleStatusText.value = '步骤 1 导入成功！'
    addConsoleLog(`成功批处理写入 ${parsedData.value.length} 条数据至临时表。`, 'success')
    step1Done.value = true
    addAuditLog('直连执行-步骤1导入临时表', 'Success', `写入 ${parsedData.value.length} 条`)
  } catch (err: any) {
    processFailed.value = true
    consoleStatusText.value = '步骤 1 执行失败'
    addConsoleLog(`错误: ${err.message}`, 'error')
    addAuditLog('直连执行-步骤1导入临时表', 'Failed', err.message)
  } finally {
    step1Loading.value = false
  }
}

const executeStep2Direct = async () => {
  if (!dbConnected.value) {
    ElMessage.warning('请先成功连接数据库！')
    return
  }
  step2Loading.value = true
  consoleVisible.value = true
  consoleLogs.value = []
  progressPercent.value = 0
  processFailed.value = false
  consoleStatusText.value = '正在向正式调岗表批量写入...'

  addConsoleLog('开始执行 [步骤 2：生成并导入正式调岗表]...')
  let startId = maxIdInput.value

  try {
    const sqls: string[] = []
    parsedData.value.forEach(row => {
      startId++
      sqls.push(`INSERT INTO BL_HR_PER_CHANGE_TAB (ID, PERSON_ID, TO_DOMAIN_ID, TO_WORK_ORG_ID, TO_PAY_DOMAIN_ID, TO_PAY_ORG_ID, TO_POST_CODE, TO_SEGMENT_ID, CHANGE_DATE, REASON, TO_PAYROLL_ID, TO_KH_ORG_ID, HR_USER, STATUS) VALUES (${startId}, '${row.员工编号}', '${row.调后域}', '${row.调后部门ID}', '${row.调后工资发放域}', '${row.调后工资发放部门ID}', '${row.调后岗位编码}', '${row.调后板块}', TO_DATE('${row.调岗日期}', 'YYYY-MM-DD'), '${row.原因}', '${row.调后工资表ID}', '${row.文员绩效考核部门ID}', '${row.人力专员}', '0')`)
    })

    const batchRes = await api.dbExecuteBatch(dbConfig.value, sqls)
    if (!batchRes.success) throw new Error(batchRes.message)

    progressPercent.value = 100
    consoleStatusText.value = '步骤 2 写入成功！'
    addConsoleLog(`成功基于基准最大 ID 写入 ${parsedData.value.length} 条数据至正式调岗表。`, 'success')
    step2Done.value = true
    addAuditLog('直连执行-步骤2写入正式表', 'Success', `写入 ${parsedData.value.length} 条，结束ID: ${startId}`)
  } catch (err: any) {
    processFailed.value = true
    consoleStatusText.value = '步骤 2 执行失败'
    addConsoleLog(`错误: ${err.message}`, 'error')
    addAuditLog('直连执行-步骤2写入正式表', 'Failed', err.message)
  } finally {
    step2Loading.value = false
  }
}

const executeStep3Direct = async () => {
  if (!dbConnected.value) {
    ElMessage.warning('请先成功连接数据库！')
    return
  }
  step3Loading.value = true
  try {
    const empIds = parsedData.value.map(r => `'${r.员工编号}'`).join(',')
    const sql = `SELECT A.PERSON_ID AS 员工编号, A.PERSON_NAME AS 员工姓名, A.WORK_ORG_ID AS 工作所在部门id, B.ORG_DESC AS 工作所在部门描述, A.POST_CODE AS 岗位编码, C.POST_NAME AS 岗位描述, A.DOMAIN_ID AS 工作所在域, A.PAYROLL_ID AS 调前工资表id FROM BL_HR_PERSON_TAB A LEFT JOIN BL_HR_ORG_TAB B ON A.WORK_ORG_ID = B.ORG_ID LEFT JOIN BL_HR_POST_TAB C ON A.POST_CODE = C.POST_CODE WHERE A.PERSON_ID IN (${empIds})`
    
    const res = await api.dbQuery(dbConfig.value, sql)
    if (!res.success) throw new Error(res.message)

    const rawBackup = res.data || []
    const mappedDiff = rawBackup.map((item: any) => {
      const target = parsedData.value.find(p => p.员工编号 === item.员工编号)
      return {
        ...item,
        调后工作所在部门id: target?.调后部门ID || '',
        调后工作所在部门描述: validDeptsMap.value.get(target?.调后部门ID || '') || target?.调后部门ID || '',
        调后岗位编码: target?.调后岗位编码 || '',
        调后岗位描述: validPostsMap.value.get(target?.调后岗位编码 || '') || target?.调后岗位编码 || '',
        调后工作所在域: target?.调后域 || '',
        调后工资表id: target?.调后工资表ID || ''
      }
    })

    diffData.value = mappedDiff
    await api.exportBackupExcel(mappedDiff)

    step3Done.value = true
    ElMessage.success('备份导出与级联 Diff 看板生成成功！')
    addAuditLog('直连执行-步骤3备份存档', 'Success', `查询并备份 ${mappedDiff.length} 人信息`)
  } catch (err: any) {
    ElMessage.error(`步骤 3 导出备份失败: ${err.message}`)
    addAuditLog('直连执行-步骤3备份存档', 'Failed', err.message)
  } finally {
    step3Loading.value = false
  }
}

const executeStep4Direct = () => {
  if (!dbConnected.value) {
    ElMessage.warning('请先成功连接数据库！')
    return
  }
  ElMessageBox.confirm('高危警示：您即将在数据库中提交并执行调岗存储过程！此操作将正式更新生产环境员工数据，是否确定继续？', '二次安全确认', {
    confirmButtonText: '确认执行生效',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    step4Loading.value = true
    consoleVisible.value = true
    consoleLogs.value = []
    progressPercent.value = 0
    processFailed.value = false
    consoleStatusText.value = '正在调用 Oracle 调岗存储过程...'

    addConsoleLog('开始调用 [BL_HR_BATCH_PERSON_CHANGE_PROC]...')
    addConsoleLog(`传入参数 HR_USER: ${dbConfig.value.hrUser}`)

    try {
      const res = await api.dbExecuteProcedure(dbConfig.value, 'BL_HR_BATCH_PERSON_CHANGE_PROC')
      if (!res.success) throw new Error(res.message)

      progressPercent.value = 100
      consoleStatusText.value = '存储过程执行成功！'
      addConsoleLog('存储过程 BL_HR_BATCH_PERSON_CHANGE_PROC 运行成功，所有变更已自动 COMMIT！', 'success')
      step4Done.value = true
      addAuditLog('直连执行-步骤4生效存储过程', 'Success', `成功调用存储过程，HR: ${dbConfig.value.hrUser}`)
    } catch (err: any) {
      processFailed.value = true
      consoleStatusText.value = '存储过程运行失败'
      addConsoleLog(`存储过程报错: ${err.message}`, 'error')
      addAuditLog('直连执行-步骤4生效存储过程', 'Failed', err.message)
    } finally {
      step4Loading.value = false
    }
  }).catch(() => {})
}

// 生命钩子
onMounted(async () => {
  // 0. 获取系统真实版本
  try {
    const ver = await invoke<string>('get_app_version')
    if (ver) appVersion.value = ver
  } catch (e) {
    console.log('Running web or fallback mode version:', appVersion.value)
  }

  // 1. 初始化主题
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
  if (savedTheme) {
    themeMode.value = savedTheme
  } else {
    themeMode.value = 'dark'
  }
  document.documentElement.setAttribute('data-theme', themeMode.value)

  // 2. 加载多环境连接配置
  loadProfilesFromStorage()
  handleProfileChange(currentProfileId.value)

  // 3. 加载历史审计日志
  try {
    const savedLogs = localStorage.getItem('auditLogs')
    if (savedLogs) {
      auditLogs.value = JSON.parse(savedLogs)
    }
  } catch (e) {}
})
</script>

<style>
/* 继承全局 style.css 的极致设计 */
</style>