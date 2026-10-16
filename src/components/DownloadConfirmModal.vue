<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-backdrop fade-in" @click.self="emit('close')">
      <div class="confirm-modal">
        <!-- Cabeçalho -->
        <div class="modal-header">
          <div class="header-title-box">
            <HardDrive :size="20" class="icon-accent" />
            <h2 class="title mono">CONFIRMAR DOWNLOAD PARA O NAS</h2>
          </div>
          <button type="button" class="close-btn" @click="emit('close')" title="Fechar">
            <X :size="20" />
          </button>
        </div>

        <div class="modal-body">
          <!-- Card de Apresentação da Mídia -->
          <div class="media-banner">
            <img
              v-if="mediaPoster"
              :src="mediaPoster"
              :alt="mediaTitle"
              class="banner-poster"
            />
            <div class="banner-info">
              <span class="banner-type mono">{{ isMovie ? 'FILME' : 'SÉRIE' }}</span>
              <h3 class="banner-title">{{ mediaTitle }}</h3>
              <div class="banner-meta mono">
                <span v-if="!isMovie">Temporada {{ seasonNumber }}</span>
                <span v-if="!isMovie && totalSeasonEpisodes > 0">• {{ totalSeasonEpisodes }} episódios</span>
                <span class="meta-dot">•</span>
                <span class="meta-nas">NAS Cota 300GB</span>
              </div>
            </div>
          </div>

          <!-- Status de Conexão: qBittorrent Local ou Debrid ou Aviso -->
          <div v-if="isQbittorrentAvailable" class="qbit-ok-badge mono">
            <CheckCircle :size="15" />
            <span>QBITTORRENT LOCAL CONECTADO (8085) • DOWNLOAD P2P NO NAS</span>
          </div>

          <div v-else-if="isDebridConfigured" class="debrid-ok-badge mono">
            <Zap :size="14" />
            <span>DEBRID CONECTADO • CDN DE ALTA VELOCIDADE (1GBPS)</span>
          </div>

          <div v-else-if="!hasDirectUrl" class="debrid-notice-box">
            <div class="notice-icon">
              <AlertTriangle :size="20" />
            </div>
            <div class="notice-text">
              <strong class="notice-title mono">AVISO SOBRE FONTES DE DOWNLOAD</strong>
              <p>
                Para baixar filmes ou séries da web diretamente no NAS sem travar como <em>"Aguardando Fonte"</em>, inicie o container <strong>qBittorrent local</strong> (porta 8085) ou conecte um serviço Debrid.
              </p>
              <button type="button" class="btn-connect-debrid mono" @click="emit('open-debrid')">
                <Zap :size="14" />
                <span>Configurar Debrid</span>
              </button>
            </div>
          </div>

          <!-- Banner de Preferência de Áudio/Legenda -->
          <div class="audio-pref-banner mono">
            <span class="pref-label">REGRA DE ÁUDIO CAPYFLIX:</span>
            <span v-if="isAnimation" class="pref-pill dub">
              🇧🇷 Animação Clássica: Preferência Dublado (PT-BR)
            </span>
            <span v-else class="pref-pill sub">
              🎬 Filme/Série: Preferência Áudio Original com Legendas PT-BR
            </span>
          </div>

          <!-- Mídia do Tipo FILME -->
          <div v-if="isMovie" class="single-movie-block">
            <div v-if="isMovieAlreadyDownloaded" class="status-callout callout-success mono">
              <CheckCircle :size="18" />
              <div>
                <strong>Este filme já está salvo no seu NAS!</strong>
                <p>Você pode reproduzi-lo imediatamente com alta fidelidade e sem anúncios.</p>
              </div>
            </div>

            <div v-else-if="isMovieDownloading" class="status-callout callout-warning mono">
              <Download :size="18" class="spin" />
              <div>
                <strong>Este filme já está sendo baixado ou na fila!</strong>
                <p>Acompanhe o progresso abrindo o Gerenciador de Armazenamento NAS.</p>
              </div>
            </div>

            <div v-else class="movie-confirm-prompt">
              <p class="mono">
                Deseja enfileirar o download do filme <strong>{{ mediaTitle }}</strong> para o NAS?
              </p>
              <span class="size-est mono">Tamanho estimado: ~1.5 GB a 2.5 GB</span>
            </div>
          </div>

          <!-- Mídia do Tipo SÉRIE / ANIME -->
          <div v-else class="series-episodes-block">
            <!-- Barra de Ações: Marcar Todos da Temporada -->
            <div class="season-control-bar">
              <label class="toggle-all-label mono">
                <input
                  type="checkbox"
                  :checked="isAllSeasonSelected"
                  :disabled="availableEpisodeCount === 0"
                  @change="toggleSelectAllSeason"
                />
                <span class="checkbox-custom"></span>
                <span class="label-text">
                  Baixar todos os episódios desta temporada ({{ seasonNumber }}ª Temp.)
                </span>
              </label>

              <span class="selected-summary mono">
                {{ selectedEpisodes.length }} de {{ totalSeasonEpisodes }} selecionado(s)
              </span>
            </div>

            <!-- Alerta caso todos já estejam baixados -->
            <div v-if="availableEpisodeCount === 0 && totalSeasonEpisodes > 0" class="all-done-banner mono">
              <CheckCircle :size="16" />
              <span>Todos os episódios desta temporada já estão salvos no NAS ou na fila de download!</span>
            </div>

            <!-- Grade / Lista de Seleção de Episódios -->
            <div class="episodes-scroll-list">
              <div
                v-for="ep in episodesList"
                :key="ep.number"
                class="ep-select-row"
                :class="{
                  'is-downloaded': isEpDownloaded(ep.number),
                  'is-queued': isEpQueued(ep.number),
                  'is-selected': selectedEpisodes.includes(ep.number)
                }"
              >
                <!-- Checkbox se elegível para download -->
                <label v-if="!isEpDownloaded(ep.number) && !isEpQueued(ep.number)" class="ep-check-label">
                  <input
                    type="checkbox"
                    :value="ep.number"
                    v-model="selectedEpisodes"
                  />
                  <span class="checkbox-custom"></span>
                </label>

                <!-- Ícone travado caso já baixado ou na fila (bloqueia duplicados) -->
                <div v-else class="ep-lock-icon" :title="isEpDownloaded(ep.number) ? 'Já baixado no NAS' : 'Já na fila'">
                  <Check v-if="isEpDownloaded(ep.number)" :size="16" class="text-green" />
                  <Download v-else :size="16" class="text-amber spin" />
                </div>

                <div class="ep-info">
                  <span class="ep-badge mono">E{{ formatNum(ep.number) }}</span>
                  <span class="ep-name">{{ ep.name || `Episódio ${ep.number}` }}</span>
                </div>

                <!-- Badges de Status -->
                <div class="ep-status-pill mono">
                  <span v-if="isEpDownloaded(ep.number)" class="pill-downloaded">
                    <HardDrive :size="11" /> NO NAS
                  </span>
                  <span v-else-if="isEpQueued(ep.number)" class="pill-queued">
                    <Download :size="11" /> NA FILA
                  </span>
                  <span v-else-if="selectedEpisodes.includes(ep.number)" class="pill-selected">
                    SELECIONADO
                  </span>
                  <span v-else class="pill-idle">
                    DISPONÍVEL
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Resumo de Espaço e Notificação de Quota -->
          <div class="footer-summary mono">
            <div class="summary-item">
              <span class="lbl">Itens a baixar:</span>
              <span class="val">{{ isMovie ? (canDownloadMovie ? '1 filme' : '0 itens') : `${selectedEpisodes.length} episódio(s)` }}</span>
            </div>
            <div class="summary-item">
              <span class="lbl">Espaço estimado:</span>
              <span class="val">{{ estimatedBytesFormatted }}</span>
            </div>
          </div>

          <div v-if="errorMessage" class="error-msg-box mono">
            <AlertTriangle :size="15" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Ações do Rodapé -->
          <div class="modal-actions">
            <button type="button" class="btn-cancel mono" @click="emit('close')">
              Cancelar
            </button>
            <button
              type="button"
              class="btn-confirm mono"
              :disabled="isSubmitting || !canProceed"
              @click="submitDownload"
            >
              <Download :size="16" v-if="!isSubmitting" />
              <div v-else class="spinner-sm"></div>
              <span>
                {{ isSubmitting ? 'Iniciando...' : `Confirmar Download (${downloadCountText})` }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { HardDrive, Download, X, Check, CheckCircle, Zap, AlertTriangle } from 'lucide-vue-next'
import { capyFlixApi, type MediaStatusResponse } from '@/api/capyflix'

export interface EpisodeItem {
  number: number
  name: string
  stillUrl?: string
}

const props = defineProps<{
  isOpen: boolean
  mediaTitle: string
  mediaType: string
  mediaPoster?: string
  seasonNumber: number
  currentEpisodeNumber: number
  episodesList: EpisodeItem[]
  tmdbId?: number
  imdbId?: string
  directUrl?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-debrid'): void
  (e: 'download-started', result: any): void
}>()

const selectedEpisodes = ref<number[]>([])
const isSubmitting = ref(false)
const errorMessage = ref('')
const mediaStatus = ref<MediaStatusResponse | null>(null)

const isMovie = computed(() => props.mediaType === 'movie')
const isAnimation = computed(() => props.mediaType === 'anime' || props.mediaType === 'cartoon')
const totalSeasonEpisodes = computed(() => props.episodesList.length)
const isDebridConfigured = computed(() => mediaStatus.value?.debrid_configured ?? false)
const isQbittorrentAvailable = computed(() => mediaStatus.value?.qbittorrent_available ?? false)
const hasDirectUrl = computed(() => Boolean(props.directUrl && props.directUrl.trim() !== ''))

// Consulta status no backend para saber o que já está no NAS ou na fila
async function refreshStatus() {
  if (!props.mediaTitle) return
  try {
    const res = await capyFlixApi.getMediaStatus({
      title: props.mediaTitle,
      media_type: props.mediaType,
      season: props.seasonNumber
    })
    mediaStatus.value = res
  } catch (err) {
    console.warn('Falha ao obter status de download:', err)
  }
}

// Verifica se episódio específico já foi baixado no disco
function isEpDownloaded(epNumber: number): boolean {
  if (!mediaStatus.value) return false
  return mediaStatus.value.downloaded_episodes.includes(epNumber)
}

// Verifica se episódio específico está na fila ou sendo baixado
function isEpQueued(epNumber: number): boolean {
  if (!mediaStatus.value) return false
  return mediaStatus.value.active_downloads.some(
    d => d.season === props.seasonNumber && d.episode === epNumber
  )
}

// Quantidade de episódios elegíveis para download
const availableEpisodeCount = computed(() => {
  return props.episodesList.filter(
    ep => !isEpDownloaded(ep.number) && !isEpQueued(ep.number)
  ).length
})

// Verifica se todos os elegíveis da temporada estão selecionados
const isAllSeasonSelected = computed(() => {
  const eligible = props.episodesList
    .map(ep => ep.number)
    .filter(num => !isEpDownloaded(num) && !isEpQueued(num))
  if (eligible.length === 0) return false
  return eligible.every(num => selectedEpisodes.value.includes(num))
})

// Toggle selecionar toda a temporada (apenas os ainda não baixados/enfileirados)
function toggleSelectAllSeason(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    const eligible = props.episodesList
      .map(ep => ep.number)
      .filter(num => !isEpDownloaded(num) && !isEpQueued(num))
    selectedEpisodes.value = Array.from(new Set([...selectedEpisodes.value, ...eligible]))
  } else {
    // Desmarcar todos, deixando no máximo o episódio atual se elegível
    if (!isEpDownloaded(props.currentEpisodeNumber) && !isEpQueued(props.currentEpisodeNumber)) {
      selectedEpisodes.value = [props.currentEpisodeNumber]
    } else {
      selectedEpisodes.value = []
    }
  }
}

// Estado para filmes
const isMovieAlreadyDownloaded = computed(() => {
  return isMovie.value && (mediaStatus.value?.is_downloaded ?? false)
})

const isMovieDownloading = computed(() => {
  return isMovie.value && (mediaStatus.value?.active_downloads.length ?? 0) > 0
})

const canDownloadMovie = computed(() => {
  return isMovie.value && !isMovieAlreadyDownloaded.value && !isMovieDownloading.value
})

const canProceed = computed(() => {
  if (isMovie.value) {
    return canDownloadMovie.value
  }
  return selectedEpisodes.value.length > 0
})

const downloadCountText = computed(() => {
  if (isMovie.value) {
    return '1 Filme'
  }
  return `${selectedEpisodes.value.length} Episódio${selectedEpisodes.value.length === 1 ? '' : 's'}`
})

const estimatedBytesFormatted = computed(() => {
  const count = isMovie.value ? 1 : selectedEpisodes.value.length
  if (count === 0) return '0 MB'
  const gb = (count * 1.5).toFixed(1)
  return `~${gb} GB`
})

function formatNum(n: number): string {
  return String(n).padStart(2, '0')
}

// Ao abrir o modal, inicializa a seleção com o episódio atual se ele não estiver baixado
watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      errorMessage.value = ''
      await refreshStatus()

      if (isMovie.value) {
        selectedEpisodes.value = [1]
      } else {
        const cur = props.currentEpisodeNumber || 1
        if (!isEpDownloaded(cur) && !isEpQueued(cur)) {
          selectedEpisodes.value = [cur]
        } else {
          // Se o episódio atual já estiver baixado/enfileirado, seleciona o próximo elegível
          const firstAvailable = props.episodesList.find(
            ep => !isEpDownloaded(ep.number) && !isEpQueued(ep.number)
          )
          selectedEpisodes.value = firstAvailable ? [firstAvailable.number] : []
        }
      }
    }
  },
  { immediate: true }
)

// Submete a requisição para a API de lote ou individual
async function submitDownload() {
  if (!canProceed.value || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    if (isMovie.value) {
      const res = await capyFlixApi.startDownload({
        title: props.mediaTitle,
        media_type: 'movie',
        season: 1,
        episode: 1,
        url: props.directUrl || ''
      })
      emit('download-started', res)
      emit('close')
    } else {
      const episodesToDownload = [...selectedEpisodes.value]
      const res = await capyFlixApi.batchDownload({
        title: props.mediaTitle,
        media_type: props.mediaType,
        season: props.seasonNumber,
        episodes: episodesToDownload,
        tmdb_id: props.tmdbId,
        imdb_id: props.imdbId,
        url: episodesToDownload.length === 1 && episodesToDownload[0] === props.currentEpisodeNumber ? props.directUrl : undefined
      })

      emit('download-started', res)
      emit('close')
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || err.message || 'Falha ao enfileirar download.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
}

.confirm-modal {
  background: #0f1218;
  border: 1px solid #283042;
  border-radius: 12px;
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #1f2635;
  background: #141822;
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-accent {
  color: #38bdf8;
}

.title {
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Banner de mídia */
.media-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: #161b26;
  border: 1px solid #242c3d;
  border-radius: 8px;
}

.banner-poster {
  width: 52px;
  height: 74px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #334155;
  flex-shrink: 0;
}

.banner-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.banner-type {
  font-size: 0.7rem;
  color: #38bdf8;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.banner-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.banner-meta {
  font-size: 0.8rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-dot {
  color: #475569;
}

.meta-nas {
  color: #00ff9d;
  font-weight: 600;
}

/* Aviso de Debrid */
.debrid-notice-box {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
}

.notice-icon {
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

.notice-text {
  font-size: 0.82rem;
  color: #cbd5e1;
  line-height: 1.45;
}

.notice-title {
  color: #f59e0b;
  display: block;
  font-size: 0.78rem;
  margin-bottom: 4px;
}

.btn-connect-debrid {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 12px;
  background: #f59e0b;
  color: #000;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-connect-debrid:hover {
  background: #fbbf24;
}

.debrid-ok-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: #00ff9d;
  background: rgba(0, 255, 157, 0.06);
  border: 1px solid rgba(0, 255, 157, 0.2);
  padding: 6px 10px;
  border-radius: 6px;
}

.qbit-ok-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 600;
}

.audio-pref-banner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: #141822;
  border: 1px dashed #283042;
  border-radius: 6px;
  font-size: 0.72rem;
}

.pref-label {
  color: #94a3b8;
  font-weight: 700;
  letter-spacing: 0.05em;
  font-size: 0.68rem;
}

.pref-pill {
  display: inline-block;
  font-weight: 600;
}

.pref-pill.dub {
  color: #34d399;
}

.pref-pill.sub {
  color: #60a5fa;
}

/* Callouts de status */
.status-callout {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 8px;
  font-size: 0.85rem;
}

.callout-success {
  background: rgba(0, 255, 157, 0.08);
  border: 1px solid rgba(0, 255, 157, 0.3);
  color: #00ff9d;
}

.callout-warning {
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

.movie-confirm-prompt {
  padding: 16px;
  background: #141923;
  border-radius: 8px;
  border: 1px solid #232b3a;
  text-align: center;
}

.size-est {
  display: block;
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 8px;
}

/* Séries: Barra de controle e episódios */
.season-control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #161b26;
  border: 1px solid #262f40;
  border-radius: 8px;
}

.toggle-all-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: #f1f5f9;
}

.toggle-all-label input[type="checkbox"] {
  accent-color: #38bdf8;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.selected-summary {
  font-size: 0.75rem;
  color: #38bdf8;
}

.all-done-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(0, 255, 157, 0.08);
  border: 1px solid rgba(0, 255, 157, 0.25);
  border-radius: 6px;
  font-size: 0.78rem;
  color: #00ff9d;
}

.episodes-scroll-list {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #1f2737;
  border-radius: 8px;
  background: #0d1017;
  display: flex;
  flex-direction: column;
}

.ep-select-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid #171d2b;
  transition: background 0.15s;
}

.ep-select-row:last-child {
  border-bottom: none;
}

.ep-select-row:hover:not(.is-downloaded):not(.is-queued) {
  background: #141923;
}

.ep-select-row.is-selected {
  background: rgba(56, 189, 248, 0.06);
}

.ep-check-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.ep-check-label input[type="checkbox"] {
  accent-color: #38bdf8;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.ep-lock-icon {
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-green {
  color: #00ff9d;
}

.text-amber {
  color: #f59e0b;
}

.ep-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.ep-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  padding: 2px 6px;
  border-radius: 4px;
}

.ep-name {
  font-size: 0.85rem;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ep-status-pill {
  font-size: 0.68rem;
  font-weight: 700;
}

.pill-downloaded {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #00ff9d;
  background: rgba(0, 255, 157, 0.1);
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 255, 157, 0.2);
}

.pill-queued {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.pill-selected {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 3px 8px;
  border-radius: 4px;
}

.pill-idle {
  color: #64748b;
  padding: 3px 8px;
}

/* Rodapé */
.footer-summary {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: #141822;
  border: 1px solid #202736;
  border-radius: 8px;
  font-size: 0.78rem;
}

.summary-item {
  display: flex;
  gap: 6px;
}

.summary-item .lbl {
  color: #94a3b8;
}

.summary-item .val {
  color: #f1f5f9;
  font-weight: 700;
}

.error-msg-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #1e293b;
  color: #fff;
}

.btn-confirm {
  background: #38bdf8;
  border: none;
  color: #0b1329;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-confirm:hover:not(:disabled) {
  background: #0ea5e9;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spin {
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
