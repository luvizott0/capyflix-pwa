<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-backdrop fade-in" @click.self="emit('close')">
      <div class="nas-modal">
        <!-- Cabeçalho do Modal -->
        <div class="modal-header">
          <div class="header-title-box">
            <HardDrive :size="20" class="icon-accent" />
            <h2 class="title mono">GERENCIADOR DE ARMAZENAMENTO NAS</h2>
          </div>
          <button type="button" class="close-btn" @click="emit('close')" title="Fechar">
            <X :size="20" />
          </button>
        </div>

        <!-- Barra de Quota de 300 GB -->
        <div v-if="storage" class="storage-card">
          <div class="quota-meta">
            <div class="quota-title">
              <span class="mono">ARMAZENAMENTO CAPYFLIX</span>
              <span
                class="badge mono"
                :class="{
                  'badge-danger': storage.is_exceeded,
                  'badge-warning': storage.is_near_limit && !storage.is_exceeded,
                  'badge-success': !storage.is_near_limit && !storage.is_exceeded
                }"
              >
                {{ storage.is_exceeded ? 'LIMITE ATINGIDO' : storage.is_near_limit ? 'QUOTA ALTA (95%)' : 'ESPAÇO SEGURO' }}
              </span>
            </div>
            <div class="quota-values rajdhani">
              <span class="used-val">{{ storage.total_formatted }}</span>
              <span class="divider">/</span>
              <span class="total-val">300 GB</span>
              <span class="percent mono">({{ storage.percent_used }}%)</span>
            </div>
          </div>

          <div class="quota-progress-track">
            <div
              class="quota-progress-fill"
              :class="{
                'fill-danger': storage.is_exceeded,
                'fill-warning': storage.is_near_limit && !storage.is_exceeded
              }"
              :style="{ width: `${Math.min(100, storage.percent_used)}%` }"
            ></div>
          </div>

          <div class="quota-footer mono">
            <span>📁 {{ storage.file_count }} arquivos catalogados</span>
            <span class="free-text">Livre: {{ storage.free_formatted }}</span>
          </div>
        </div>

        <div v-else class="loading-box mono">
          <div class="spinner"></div>
          <span>Consultando disco NAS...</span>
        </div>

        <!-- Abas de Navegação -->
        <div class="tabs-nav mono">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'downloads' }"
            @click="activeTab = 'downloads'"
          >
            <Download :size="16" />
            <span>DOWNLOADS ATIVOS ({{ activeDownloads.length }})</span>
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'files' }"
            @click="activeTab = 'files'"
          >
            <Folder :size="16" />
            <span>ARQUIVOS NO DISCO ({{ storage?.files?.length || 0 }})</span>
          </button>
        </div>

        <!-- Conteúdo da Aba: Downloads Ativos -->
        <div v-if="activeTab === 'downloads'" class="tab-content">
          <div v-if="activeDownloads.length === 0" class="empty-state mono">
            <CheckCircle :size="24" class="empty-icon" />
            <p>Nenhum download em andamento no momento.</p>
            <span class="empty-sub">Você pode clicar em "Solicitar Download" em qualquer filme ou série.</span>
          </div>

          <div v-else class="downloads-list">
            <div v-for="dl in activeDownloads" :key="dl.id" class="download-item-card">
              <div class="dl-info">
                <div class="dl-title-row">
                  <span class="dl-title">{{ dl.title }}</span>
                  <span
                    class="dl-status-badge mono"
                    :class="{
                      'status-downloading': dl.status === 'downloading',
                      'status-completed': dl.status === 'completed',
                      'status-failed': dl.status === 'failed',
                      'status-queued': dl.status === 'queued' || dl.status === 'pending_source'
                    }"
                  >
                    {{ formatDownloadStatus(dl.status) }}
                  </span>
                </div>
                <div class="dl-meta mono">
                  <span>{{ dl.file_name }}</span>
                  <span v-if="dl.status === 'downloading'">{{ dl.progress }}%</span>
                </div>
              </div>

              <!-- Barra de Progresso do Download -->
              <div v-if="dl.status === 'downloading' || dl.status === 'completed'" class="dl-progress-bar">
                <div
                  class="dl-progress-fill"
                  :style="{ width: `${dl.progress}%` }"
                ></div>
              </div>

              <div v-if="dl.error" class="dl-error mono">
                Erro: {{ dl.error }}
              </div>

              <div class="dl-actions">
                <button
                  type="button"
                  class="btn-cancel-dl mono"
                  @click="cancelDownload(dl.id, dl.status)"
                  :title="dl.status === 'completed' ? 'Remover da lista de downloads' : 'Cancelar e descartar arquivo parcial'"
                >
                  <Trash2 :size="14" />
                  <span>{{ dl.status === 'completed' ? 'Limpar da lista' : 'Cancelar' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Conteúdo da Aba: Arquivos no Disco -->
        <div v-else-if="activeTab === 'files'" class="tab-content">
          <div v-if="!storage || storage.files.length === 0" class="empty-state mono">
            <p>Nenhum arquivo encontrado na pasta de mídia do NAS.</p>
          </div>

          <div v-else class="files-list">
            <div v-for="file in storage.files" :key="file.relative_path" class="file-item-card">
              <div class="file-icon-box">
                <Film v-if="file.category === 'movie'" :size="18" />
                <Tv v-else :size="18" />
              </div>

              <div class="file-details">
                <span class="file-name">{{ file.name }}</span>
                <div class="file-meta mono">
                  <span class="file-size">{{ file.size_formatted }}</span>
                  <span class="meta-dot">•</span>
                  <span class="file-path">{{ file.relative_path }}</span>
                </div>
              </div>

              <button
                type="button"
                class="btn-delete-file"
                @click="confirmDeleteFile(file.relative_path, file.name)"
                title="Excluir do NAS para liberar espaço"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>

        <!-- Rodapé do Modal -->
        <div class="modal-footer">
          <button type="button" class="btn-refresh mono" @click="refreshData(false)">
            <RefreshCw :size="14" :class="{ spinning: isRefreshing }" />
            <span>Atualizar Status</span>
          </button>
          <button type="button" class="btn-close mono" @click="emit('close')">
            Fechar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import {
  HardDrive,
  X,
  Download,
  Folder,
  Trash2,
  Film,
  Tv,
  CheckCircle,
  RefreshCw
} from 'lucide-vue-next'
import { capyFlixApi, type StorageStatus, type DownloadTask } from '@/api/capyflix'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'download-completed', dl: DownloadTask): void
}>()

const activeTab = ref<'downloads' | 'files'>('downloads')
const storage = ref<StorageStatus | null>(null)
const activeDownloads = ref<DownloadTask[]>([])
const isRefreshing = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function startPollingIfNeeded() {
  stopPolling()
  if (!props.isOpen) return

  const hasActiveDownloads = activeDownloads.value.some(
    d => d.status === 'downloading' || d.status === 'queued' || d.status === 'pending_source'
  )

  // Polling ONLY when there are active/queued downloads and the modal is open
  if (hasActiveDownloads) {
    pollTimer = setInterval(() => {
      refreshData(false)
    }, 3000)
  }
}

async function refreshData(showSpinner = true) {
  if (showSpinner) isRefreshing.value = true
  try {
    const [storageData, downloadsData] = await Promise.all([
      capyFlixApi.getStorageStatus(),
      capyFlixApi.getDownloads()
    ])
    
    // Notifica se algum download terminou
    const previous = activeDownloads.value
    for (const d of downloadsData) {
      if (d.status === 'completed') {
        const prevItem = previous.find(p => p.id === d.id)
        if (prevItem && prevItem.status === 'downloading') {
          emit('download-completed', d)
        }
      }
    }

    storage.value = storageData
    activeDownloads.value = downloadsData
    startPollingIfNeeded()
  } catch (err) {
    console.warn('Falha ao atualizar dados de armazenamento do NAS:', err)
  } finally {
    if (showSpinner) isRefreshing.value = false
  }
}

async function cancelDownload(id: string, status?: string) {
  if (status === 'completed') {
    // Apenas remove da lista de recentes sem apagar o arquivo do disco
    await capyFlixApi.cancelDownload(id)
    await refreshData(true)
    return
  }

  if (!confirm('Deseja cancelar esta tarefa de download? O arquivo parcial será descartado.')) return
  await capyFlixApi.cancelDownload(id)
  await refreshData(true)
}

async function confirmDeleteFile(path: string, fileName: string) {
  if (!confirm(`Tem certeza que deseja excluir "${fileName}" do NAS para liberar espaço?`)) return
  try {
    await capyFlixApi.deleteStorageFile(path)
    await refreshData(true)
  } catch (err) {
    alert('Não foi possível excluir o arquivo.')
  }
}

function formatDownloadStatus(status: string): string {
  switch (status) {
    case 'downloading':
      return 'BAIXANDO...'
    case 'completed':
      return 'CONCLUÍDO'
    case 'failed':
      return 'FALHOU'
    case 'queued':
      return 'NA FILA'
    case 'pending_source':
      return 'AGUARDANDO FONTE'
    default:
      return status.toUpperCase()
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      refreshData(true)
    } else {
      stopPolling()
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 8, 7, 0.88);
  backdrop-filter: blur(8px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
}

.nas-modal {
  width: 100%;
  max-width: 680px;
  max-height: 85vh;
  margin: auto;
  background: var(--bg-surface, #1e1b18);
  border: 1px solid var(--border-color, rgba(245, 197, 24, 0.2));
  border-radius: var(--radius-md, 8px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

.modal-header {
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-accent {
  color: var(--color-accent, #f5c518);
}

.title {
  font-size: 1rem;
  letter-spacing: 0.05em;
  color: var(--text-main, #ffffff);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted, #999);
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #ffffff;
}

.storage-card {
  margin: 16px 20px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm, 6px);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quota-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.quota-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--text-muted, #aaa);
}

.quota-values {
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.used-val {
  color: var(--color-accent, #f5c518);
}

.divider,
.total-val {
  color: var(--text-muted, #777);
}

.percent {
  font-size: 0.85rem;
  color: var(--text-muted, #aaa);
  margin-left: 4px;
}

.quota-progress-track {
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
}

.quota-progress-fill {
  height: 100%;
  background: var(--color-accent, #f5c518);
  border-radius: 5px;
  transition: width 0.3s ease;
}

.fill-warning {
  background: #f59e0b;
}

.fill-danger {
  background: #ef4444;
}

.quota-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted, #888);
}

.free-text {
  color: #10b981;
}

.badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.65rem;
  border-radius: 4px;
  width: fit-content;
}

.badge-success {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.tabs-nav {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 20px;
  gap: 12px;
}

.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted, #888);
  padding: 10px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #ffffff;
}

.tab-btn.active {
  color: var(--color-accent, #f5c518);
  border-bottom-color: var(--color-accent, #f5c518);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  min-height: 240px;
  max-height: 400px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--text-muted, #777);
  gap: 8px;
  font-size: 0.85rem;
}

.empty-icon {
  color: #10b981;
  margin-bottom: 4px;
}

.empty-sub {
  font-size: 0.75rem;
  color: var(--text-muted, #555);
}

.downloads-list,
.files-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.download-item-card,
.file-item-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-sm, 6px);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item-card {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.file-icon-box {
  color: var(--color-accent, #f5c518);
  padding: 8px;
  background: rgba(245, 197, 24, 0.1);
  border-radius: 4px;
}

.file-details {
  flex: 1;
  margin-left: 12px;
  overflow: hidden;
}

.file-name {
  font-size: 0.88rem;
  font-weight: 500;
  color: #ffffff;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 0.72rem;
  color: var(--text-muted, #777);
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 2px;
}

.file-path {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
}

.btn-delete-file {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-file:hover {
  background: rgba(239, 68, 68, 0.2);
}

.dl-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dl-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: #ffffff;
}

.dl-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted, #888);
}

.dl-status-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-downloading {
  background: rgba(245, 197, 24, 0.15);
  color: var(--color-accent, #f5c518);
}

.status-completed {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.status-failed {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.status-queued {
  background: rgba(255, 255, 255, 0.1);
  color: #aaa;
}

.dl-progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.dl-progress-fill {
  height: 100%;
  background: var(--color-accent, #f5c518);
  border-radius: 3px;
  transition: width 0.3s;
}

.dl-error {
  font-size: 0.72rem;
  color: #ef4444;
}

.dl-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-cancel-dl {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted, #888);
  padding: 4px 8px;
  font-size: 0.7rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel-dl:hover {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.modal-footer {
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-refresh {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted, #aaa);
  padding: 6px 12px;
  font-size: 0.75rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.btn-refresh:hover {
  color: #ffffff;
  border-color: var(--color-accent, #f5c518);
}

.spinning {
  animation: spin 0.8s linear infinite;
}

.btn-close {
  background: var(--color-accent, #f5c518);
  color: #12100e;
  border: none;
  font-weight: 700;
  padding: 8px 16px;
  font-size: 0.8rem;
  border-radius: 4px;
  cursor: pointer;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
