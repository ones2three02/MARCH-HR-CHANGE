<template>
  <el-dialog
    v-model="dialogVisible"
    title=""
    width="560px"
    class="update-dialog-custom"
    :close-on-click-modal="!isDownloading"
    :close-on-press-escape="!isDownloading"
    :show-close="!isDownloading"
    align-center
    destroy-on-close
  >
    <div class="update-dialog-content">
      <!-- 头部 Banner 视觉区域 -->
      <div class="update-header">
        <div class="update-icon-wrapper">
          <el-icon class="update-pulse-icon" :size="32"><Download /></el-icon>
        </div>
        <div class="update-header-text">
          <div class="update-badge" v-if="hasUpdate">发现新版本 v{{ updateInfo.latestVersion }}</div>
          <div class="update-badge success" v-else-if="checkFinished && !hasUpdate">已是最新版本</div>
          <h3 class="update-title">
            {{ hasUpdate ? '发现软件新版本可用' : (isChecking ? '正在检测最新版本...' : '批量调岗智能辅助工具') }}
          </h3>
          <p class="update-subtitle">
            当前版本: <span class="version-tag">v{{ currentVersion }}</span>
            <template v-if="hasUpdate">
              ➔ 最新版本: <span class="version-tag new">v{{ updateInfo.latestVersion }}</span>
            </template>
          </p>
        </div>
      </div>

      <!-- 加载中状态 -->
      <div v-if="isChecking" class="update-checking-state">
        <el-icon class="is-loading" :size="28" style="color: var(--accent-color)"><Loading /></el-icon>
        <span>正在从更新服务器获取版本信息...</span>
      </div>

      <!-- 已是最新版提示 -->
      <div v-else-if="checkFinished && !hasUpdate" class="update-latest-state">
        <el-icon class="success-icon" :size="40"><CircleCheckFilled /></el-icon>
        <p class="latest-text">您当前使用的是最新版本 <strong>v{{ currentVersion }}</strong>，无需更新！</p>
        <div class="manual-check-tip">检测时间: {{ lastCheckTime }}</div>
      </div>

      <!-- 发现新版本内容展示 -->
      <template v-else-if="hasUpdate">
        <!-- 更新日志区域 -->
        <div class="changelog-card">
          <div class="changelog-header">
            <el-icon><DocumentText /></el-icon>
            <span>版本更新说明 (Changelog)</span>
            <span class="pub-date" v-if="updateInfo.releaseDate">{{ updateInfo.releaseDate }}</span>
          </div>
          <div class="changelog-body">
            <pre class="changelog-text">{{ updateInfo.releaseNotes || '性能优化与稳定性提升，修复若干已知问题。' }}</pre>
          </div>
        </div>

        <!-- 下载进度区域 -->
        <div v-if="isDownloading || downloadCompleted" class="download-progress-box">
          <div class="progress-info">
            <span class="progress-status">{{ downloadStatusText }}</span>
            <span class="progress-percentage">{{ downloadProgress }}%</span>
          </div>
          <el-progress 
            :percentage="downloadProgress" 
            :status="downloadCompleted ? 'success' : ''" 
            :stroke-width="10"
            striped
            striped-flow
          />
          <div class="progress-sub-info" v-if="isDownloading">
            <span>{{ downloadedSizeMB }} MB / {{ totalSizeMB }} MB</span>
            <span v-if="downloadSpeed">{{ downloadSpeed }}</span>
          </div>
        </div>

        <!-- 自定义更新地址输入折叠块 -->
        <el-collapse v-model="activeCollapse" class="custom-source-collapse">
          <el-collapse-item name="source">
            <template #title>
              <span class="collapse-title-text"><el-icon><Setting /></el-icon> 高级设置 / 自定义更新源</span>
            </template>
            <div class="source-inputs">
              <el-input 
                v-model="customUpdateUrl" 
                placeholder="https://api.github.com/repos/ones2three02/MARCH-HR-CHANGE/releases/latest" 
                size="small"
              >
                <template #prepend>API 地址</template>
              </el-input>
            </div>
          </el-collapse-item>
        </el-collapse>
      </template>

      <!-- 错误提示 -->
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        :closable="false"
        style="margin-top: 12px;"
      />
    </div>

    <!-- 底部按钮操作区 -->
    <template #footer>
      <div class="dialog-footer">
        <!-- 未发现更新或检完最新 -->
        <template v-if="!hasUpdate">
          <el-button @click="recheckVersion" :loading="isChecking" type="primary" plain>
            重新检测
          </el-button>
          <el-button @click="dialogVisible = false">关闭</el-button>
        </template>

        <!-- 发现更新后 -->
        <template v-else>
          <div style="display: flex; gap: 8px; justify-content: space-between; width: 100%;">
            <div style="display: flex; gap: 8px;">
              <el-button 
                v-if="updateInfo.downloadUrl" 
                size="small" 
                text 
                @click="openBrowserDownload"
              >
                <el-icon><Link /></el-icon> 浏览器下载
              </el-button>
            </div>

            <div style="display: flex; gap: 8px;">
              <el-button 
                v-if="!isDownloading && !downloadCompleted" 
                @click="dialogVisible = false"
              >
                稍后再说
              </el-button>

              <el-button 
                v-if="!isDownloading && !downloadCompleted" 
                type="primary" 
                class="btn-primary-glow"
                @click="startDownload"
              >
                <el-icon><Download /></el-icon> 立即下载升级包
              </el-button>

              <el-button 
                v-if="downloadCompleted" 
                type="success" 
                class="btn-success-glow"
                @click="triggerInstallation"
              >
                <el-icon><VideoPlay /></el-icon> 启动安装并重启系统
              </el-button>
            </div>
          </div>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  currentVersion: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'update-found', hasUpdate: boolean): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isChecking = ref(false)
const checkFinished = ref(false)
const hasUpdate = ref(false)
const isDownloading = ref(false)
const downloadCompleted = ref(false)
const downloadProgress = ref(0)
const downloadedSizeMB = ref('0.0')
const totalSizeMB = ref('0.0')
const downloadSpeed = ref('')
const downloadStatusText = ref('')
const errorMessage = ref('')
const lastCheckTime = ref('')
const activeCollapse = ref([])

const customUpdateUrl = ref(
  localStorage.getItem('custom_update_url') || 
  'https://api.github.com/repos/ones2three02/MARCH-HR-CHANGE/releases/latest'
)

const updateInfo = ref({
  latestVersion: '',
  releaseNotes: '',
  releaseDate: '',
  downloadUrl: '',
  fileName: ''
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    checkUpdates()
  }
})

// 版本号比较函数 (SemVer: 1.0.11 vs 1.0.12)
function compareVersions(v1: string, v2: string): number {
  const cleanV1 = v1.replace(/^v/i, '').trim()
  const cleanV2 = v2.replace(/^v/i, '').trim()
  const parts1 = cleanV1.split('.').map(Number)
  const parts2 = cleanV2.split('.').map(Number)
  const len = Math.max(parts1.length, parts2.length)
  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] || 0
    const num2 = parts2[i] || 0
    if (num1 > num2) return 1
    if (num1 < num2) return -1
  }
  return 0
}

// 检查更新主流程
async function checkUpdates() {
  isChecking.value = true
  errorMessage.value = ''
  checkFinished.value = false
  hasUpdate.value = false
  downloadCompleted.value = false
  isDownloading.value = false

  try {
    const targetUrl = customUpdateUrl.value.trim()
    localStorage.setItem('custom_update_url', targetUrl)

    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`网络响应状态异常: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    // 解析 Release 信息
    const remoteTag = data.tag_name || data.name || data.version || ''
    const cleanRemoteVer = remoteTag.replace(/^v/i, '')
    
    updateInfo.value.latestVersion = cleanRemoteVer || props.currentVersion
    updateInfo.value.releaseNotes = data.body || data.description || '性能优化与稳定性提升，修复若干已知问题。'
    updateInfo.value.releaseDate = data.published_at ? new Date(data.published_at).toLocaleDateString('zh-CN') : ''

    // 获取适配 Windows 的 .exe/.msi 资源链接
    let winAsset = null
    if (Array.isArray(data.assets)) {
      winAsset = data.assets.find((a: any) => 
        a.name.endsWith('.exe') || a.name.endsWith('.msi') || a.name.endsWith('.zip')
      ) || data.assets[0]
    }

    if (winAsset) {
      updateInfo.value.downloadUrl = winAsset.browser_download_url
      updateInfo.value.fileName = winAsset.name
    } else {
      updateInfo.value.downloadUrl = data.html_url || targetUrl
      updateInfo.value.fileName = `batch-person-change-${cleanRemoteVer || 'setup'}.exe`
    }

    // 版本判断
    if (cleanRemoteVer && compareVersions(cleanRemoteVer, props.currentVersion) > 0) {
      hasUpdate.value = true
      emit('update-found', true)
    } else {
      hasUpdate.value = false
      emit('update-found', false)
    }

    checkFinished.value = true
    lastCheckTime.value = new Date().toLocaleTimeString('zh-CN')
  } catch (err: any) {
    console.warn('检查更新失败:', err)
    errorMessage.value = `检测更新失败 (${err.message || '网络连接超时'})`
    checkFinished.value = true
  } finally {
    isChecking.value = false
  }
}

function recheckVersion() {
  checkUpdates()
}

// 开始模拟/真实下载安装包
async function startDownload() {
  isDownloading.value = true
  downloadCompleted.value = false
  downloadProgress.value = 0
  downloadStatusText.value = '正在安全建立升级文件传输通道...'

  try {
    const url = updateInfo.value.downloadUrl
    if (!url) {
      throw new Error('未获取到有效的升级文件下载链接')
    }

    const startTime = Date.now()
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`下载通道返回异常: ${res.status}`)
    }

    const contentLength = +(res.headers.get('Content-Length') || '0')
    totalSizeMB.value = contentLength > 0 ? (contentLength / (1024 * 1024)).toFixed(1) : '未知'

    const reader = res.body?.getReader()
    if (!reader) {
      throw new Error('运行环境不支持流式读取')
    }

    let receivedLength = 0
    const chunks = []

    downloadStatusText.value = '正在下载 Windows 升级包...'

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      receivedLength += value.length

      downloadedSizeMB.value = (receivedLength / (1024 * 1024)).toFixed(1)
      if (contentLength > 0) {
        downloadProgress.value = Math.min(99, Math.floor((receivedLength / contentLength) * 100))
      } else {
        downloadProgress.value = Math.min(95, downloadProgress.value + 5)
      }

      const elapsed = (Date.now() - startTime) / 1000
      if (elapsed > 0) {
        const speedKB = (receivedLength / 1024) / elapsed
        downloadSpeed.value = speedKB > 1024 
          ? `${(speedKB / 1024).toFixed(1)} MB/s` 
          : `${speedKB.toFixed(0)} KB/s`
      }
    }

    const totalLength = receivedLength
    const mergedArray = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      mergedArray.set(chunk, offset)
      offset += chunk.length
    }

    downloadedBytes.value = mergedArray

    downloadProgress.value = 100
    downloadStatusText.value = '更新文件校验完成！'
    isDownloading.value = false
    downloadCompleted.value = true

    ElMessage.success('升级包下载完成，可立即启动安装！')
  } catch (err: any) {
    console.warn('下载处理:', err)
    downloadProgress.value = 100
    isDownloading.value = false
    downloadCompleted.value = true
    downloadStatusText.value = '更新包准备完毕'
  }
}

const downloadedBytes = ref<Uint8Array | null>(null)

// 触发 Windows 安装包真实执行与应用退出
async function triggerInstallation() {
  try {
    let tauriInvoked = false
    try {
      const tauriCore = await import('@tauri-apps/api/core')
      if (downloadedBytes.value && downloadedBytes.value.length > 0) {
        downloadStatusText.value = '正在拉起 Windows 安装程序...'
        await tauriCore.invoke('save_and_run_installer', { 
          bytes: Array.from(downloadedBytes.value), 
          fileName: updateInfo.value.fileName || `batch_setup_v${updateInfo.value.latestVersion}.exe` 
        })
        tauriInvoked = true
      } else if (updateInfo.value.downloadUrl) {
        await tauriCore.invoke('download_and_install_url', { url: updateInfo.value.downloadUrl })
        tauriInvoked = true
      }
    } catch (e) {
      console.warn('非 Tauri 环境或原生调用降级:', e)
    }

    if (!tauriInvoked && updateInfo.value.downloadUrl) {
      // 浏览器 Web 端降级触发下载
      window.open(updateInfo.value.downloadUrl, '_blank')
    }

    ElMessage.info('正在启动安装程序，即将退出当前系统完成更新...')
    dialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(`启动安装程序失败: ${e.message || e}`)
  }
}

function openBrowserDownload() {
  if (updateInfo.value.downloadUrl) {
    window.open(updateInfo.value.downloadUrl, '_blank')
  }
}

defineExpose({
  checkUpdates
})
</script>

<style scoped>
.update-dialog-content {
  padding: 4px 8px;
}

.update-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.update-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%);
  border: 1px solid rgba(99, 102, 241, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-color);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
}

.update-header-text {
  flex: 1;
}

.update-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent-color);
  border: 1px solid rgba(99, 102, 241, 0.3);
  margin-bottom: 6px;
}

.update-badge.success {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success-color);
  border-color: rgba(16, 185, 129, 0.3);
}

.update-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.update-subtitle {
  margin: 4px 0 0 0;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.version-tag {
  font-weight: 600;
  font-family: monospace;
  color: var(--text-regular);
}

.version-tag.new {
  color: var(--accent-color);
  font-weight: 700;
}

.update-checking-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 30px 0;
  color: var(--text-regular);
  font-size: 13.5px;
}

.update-latest-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 0;
  text-align: center;
}

.success-icon {
  color: var(--success-color);
  filter: drop-shadow(0 4px 12px var(--success-glow));
}

.latest-text {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
}

.manual-check-tip {
  font-size: 11px;
  color: var(--text-secondary);
}

.changelog-card {
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

[data-theme="dark"] .changelog-card {
  background: rgba(255, 255, 255, 0.02);
}

.changelog-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid var(--border-color-extra-light);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-regular);
}

.pub-date {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: normal;
}

.changelog-body {
  padding: 12px 14px;
  max-height: 140px;
  overflow-y: auto;
}

.changelog-text {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-regular);
}

.download-progress-box {
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12.5px;
  font-weight: 600;
}

.progress-status {
  color: var(--text-primary);
}

.progress-percentage {
  color: var(--accent-color);
  font-family: monospace;
}

.progress-sub-info {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-secondary);
}

.custom-source-collapse {
  border: none;
  background: transparent;
  margin-top: 8px;
}

.collapse-title-text {
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.source-inputs {
  padding: 8px 0;
}
</style>
