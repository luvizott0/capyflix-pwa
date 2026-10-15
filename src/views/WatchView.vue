<template>
  <div v-if="media" class="watch-view container fade-in">
    <!-- Barra Superior de Navegação / Voltar -->
    <div class="watch-top-nav">
      <button type="button" class="back-link-btn" @click="router.back()">
        <ArrowLeft :size="18" />
        <span>Voltar</span>
      </button>
      <div class="media-title-sub mono">{{ media.title }}</div>
    </div>

    <!-- Player de Vídeo Híbrido (Nativo HTML5 ou Embed Protegido) -->
    <div class="player-wrapper">
      <!-- Barra de Ações do Player (Onde ficava a fonte) -->
      <div class="player-actions-toolbar">
        <div class="actions-left">
          <!-- Botão Solicitar Download -->
          <button
            type="button"
            class="nas-download-btn mono"
            :class="{ 'is-local': isCurrentlyLocal, 'is-downloading': isDownloadingToNas }"
            @click="triggerNasDownload"
            :title="isCurrentlyLocal ? 'Mídia salva localmente no NAS' : 'Solicitar download para o NAS (Cota 300GB)'"
          >
            <HardDrive :size="15" />
            <span>{{ isCurrentlyLocal ? 'SALVO NO NAS' : isDownloadingToNas ? 'BAIXANDO...' : 'SOLICITAR DOWNLOAD' }}</span>
          </button>

          <!-- Botão Salvar Série (Apenas Ícone) -->
          <button
            type="button"
            class="fav-icon-btn"
            :class="{ active: isFavorite }"
            @click="mediaStore.toggleFavorite(media.id)"
            :title="isFavorite ? 'Remover dos Favoritos' : 'Salvar na Minha Lista'"
          >
            <Bookmark :size="17" :fill="isFavorite ? 'currentColor' : 'none'" />
          </button>
        </div>

        <div class="actions-right">
          <button
            type="button"
            class="storage-quota-badge mono"
            title="Verificar Quota do NAS (300 GB)"
            @click="showStorageModal = true"
          >
            <HardDrive :size="13" />
            <span>NAS 300GB</span>
          </button>
        </div>
      </div>

      <!-- Player Nativo (Local / CDN Direta) -->
      <VideoPlayer
        v-if="selectedSource?.isDirectVideo"
        :key="selectedSource.url"
        :src="selectedSource.url"
        :cover-url="media.backdrop || media.poster"
        :initial-time="savedInitialTime"
        @timeupdate="handleTimeUpdate"
        @ended="handleEpisodeEnded"
        @pause="handlePause"
      />

      <!-- Banner elegante quando a mídia ainda precisa ser baixada para o NAS -->
      <div v-else class="download-needed-card">
        <div class="download-prompt-content">
          <div class="prompt-icon-box">
            <HardDrive :size="36" class="prompt-icon" />
          </div>
          <h3 class="mono prompt-title">Mídia Pronta para o NAS</h3>
          <p class="prompt-desc">
            Para garantir uma reprodução limpa, em alta velocidade e sem anúncios invasivos, você pode baixar este título diretamente para o seu NAS (cota de 300 GB).
          </p>
          <div class="prompt-actions">
            <button
              type="button"
              class="btn-start-dl mono"
              :disabled="isDownloadingToNas"
              @click="triggerNasDownload"
            >
              <Download :size="16" />
              <span>{{ isDownloadingToNas ? 'Iniciando download...' : 'Solicitar Download (Cota 300GB)' }}</span>
            </button>
            <button
              type="button"
              class="btn-open-storage mono"
              @click="showStorageModal = true"
            >
              <HardDrive :size="14" />
              <span>Verificar Quota NAS</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Informações do Título -->
    <div class="media-details-card">
      <div class="details-top">
        <div class="title-block">
          <h1 class="media-title">{{ media.title }}</h1>
          <h2 v-if="media.originalTitle" class="media-original-title">{{ media.originalTitle }}</h2>
        </div>
      </div>

      <div class="meta-row">
        <span v-if="media.rating" class="badge-rating mono">
          ★ {{ media.rating.toFixed(1) }}
        </span>
        <span v-if="media.year" class="meta-text mono">{{ media.year }}</span>
        <span class="meta-dot">•</span>
        <span class="meta-text">{{ formatType(media.type) }}</span>
        <span v-for="genre in media.genres" :key="genre" class="badge-tag">{{ genre }}</span>
      </div>

      <p class="synopsis-text">{{ media.synopsis }}</p>
    </div>

    <!-- Abas de Temporada (se houver mais de 1 temporada) -->
    <div v-if="media.seasons.length > 1" class="seasons-tabs">
      <button
        v-for="(season, sIdx) in media.seasons"
        :key="sIdx"
        type="button"
        class="season-tab-btn mono"
        :class="{ active: activeSeasonIndex === sIdx }"
        @click="switchSeason(sIdx)"
      >
        {{ season.name }}
      </button>
    </div>

    <!-- Grade de Episódios no estilo CapyShowTime (quando houver temporadas catalogadas) -->
    <div v-if="media.seasons && media.seasons.length > 0 && currentSeasonEpisodes.length > 0" class="episodes-section">
      <div class="episodes-header">
        <h3 class="section-title mono">
          {{ media.seasons[activeSeasonIndex]?.name || 'Episódios' }}
        </h3>
        <span class="ep-count mono">{{ currentSeasonEpisodes.length }} episódios</span>
      </div>

      <div class="episodes-list">
        <div
          v-for="(ep, eIdx) in currentSeasonEpisodes"
          :key="ep.id"
          class="episode-card"
          :class="{
            'is-playing': activeSeasonIndex === playingSeasonIndex && activeEpisodeIndex === eIdx,
            'watched': isEpisodeCompleted(activeSeasonIndex, eIdx)
          }"
          @click="selectEpisode(eIdx)"
        >
          <!-- Thumbnail / Badge de Número -->
          <div class="episode-media">
            <img
              :src="ep.stillUrl || media.backdrop || media.poster"
              :alt="ep.name"
              class="episode-thumbnail"
              loading="lazy"
            />
            <div class="episode-code mono">
              E{{ formatNum(ep.number) }}
            </div>
            <div
              v-if="activeSeasonIndex === playingSeasonIndex && activeEpisodeIndex === eIdx"
              class="playing-overlay"
            >
              <Play :size="16" fill="currentColor" />
            </div>
          </div>

          <!-- Conteúdo do Episódio -->
          <div class="episode-content">
            <div class="episode-header-info">
              <h4 class="episode-title">{{ ep.name }}</h4>
              <div class="episode-status-row">
                <span v-if="isEpisodeCompleted(activeSeasonIndex, eIdx)" class="status-tag watched mono">
                  ✓ Assistido
                </span>
                <span v-else-if="getEpisodePercent(activeSeasonIndex, eIdx) > 0" class="status-tag progress mono">
                  {{ getEpisodePercent(activeSeasonIndex, eIdx) }}%
                </span>
                <span v-else class="status-tag mono">
                  Pronto
                </span>
              </div>
            </div>

            <!-- Barra de Progresso do Episódio -->
            <div class="episode-progress-bar">
              <div
                class="episode-progress-fill"
                :style="{ width: `${getEpisodePercent(activeSeasonIndex, eIdx)}%` }"
              ></div>
            </div>
          </div>

          <!-- Botão de Check-in Estilo TV Time -->
          <button
            type="button"
            class="check-btn"
            :class="{ active: isEpisodeCompleted(activeSeasonIndex, eIdx) }"
            :title="isEpisodeCompleted(activeSeasonIndex, eIdx) ? 'Assistido' : 'Marcar como visto'"
            @click.stop="toggleWatched(activeSeasonIndex, eIdx)"
          >
            <Check :size="16" stroke-width="3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Seção de Comentários e Debate do Episódio -->
    <EpisodeCommentsSection :episode-id="syncedEpisodeId" />

    <!-- Modais de Armazenamento NAS e Debrid -->
    <NasStorageModal
      :is-open="showStorageModal"
      @close="showStorageModal = false"
      @download-completed="onDownloadCompleted"
    />
    <DebridConfigModal :is-open="showDebridModal" @close="showDebridModal = false" @saved="onDebridSaved" />
  </div>

  <div v-else class="not-found-view container">
    <p class="mono">Título não encontrado no catálogo do CapyFlix.</p>
    <router-link to="/" class="btn-primary" style="margin-top: 16px;">
      Voltar ao Início
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Bookmark, Check, Play, HardDrive, Zap, Download } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import VideoPlayer from '@/components/VideoPlayer.vue'
import EpisodeCommentsSection from '@/components/EpisodeCommentsSection.vue'
import NasStorageModal from '@/components/NasStorageModal.vue'
import DebridConfigModal from '@/components/DebridConfigModal.vue'
import { capyShowTimeApi } from '@/api/capyshowtime'
import { capyFlixApi } from '@/api/capyflix'
import { resolveStreamSources, type StreamSourceOption } from '@/utils/streamResolver'

const route = useRoute()
const router = useRouter()
const mediaStore = useMediaStore()

const slug = computed(() => route.params.slug as string)
const dynamicMedia = ref<MediaItem | null>(null)

const media = computed(() => {
  const local = mediaStore.getMediaBySlug(slug.value)
  if (local) return local
  return dynamicMedia.value
})

// Se o slug começar com showtime- ou se for passado via query, busca dados dinâmicos
async function loadDynamicShowtimeMedia() {
  if (mediaStore.getMediaBySlug(slug.value)) return

  // Tentar extrair tmdb_id do slug (ex: showtime-1399)
  const match = slug.value.match(/showtime-(\d+)/)
  const tmdbId = match ? parseInt(match[1], 10) : (Number(route.query.tmdb) || null)

  if (tmdbId) {
    try {
      const TMDB_API_KEY = '9460fe099c4cb1ca3026582f448e9d29'
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      if (res.ok) {
        const data = await res.json()
        const seasons = (data.seasons || []).filter((s: any) => s.season_number > 0).map((s: any) => ({
          name: s.name || `Temporada ${s.season_number}`,
          episodes: Array.from({ length: s.episode_count || 1 }).map((_, idx) => ({
            id: `showtime-${tmdbId}-s${s.season_number}-e${idx + 1}`,
            name: `Episódio ${idx + 1}`,
            number: idx + 1,
            streamUrl: '' // Toca via Embed Player / Multi-source
          }))
        }))

        dynamicMedia.value = {
          id: `showtime-${tmdbId}`,
          slug: slug.value,
          tmdbId,
          title: data.name || data.title,
          originalTitle: data.original_name || data.original_title,
          type: 'series',
          poster: data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : '/capy-icon.svg',
          backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '',
          synopsis: data.overview || 'Série acompanhada via CapyShowTime.',
          genres: (data.genres || []).map((g: any) => g.name.toUpperCase()),
          year: (data.first_air_date || data.release_date || '').substring(0, 4),
          rating: data.vote_average || 8.0,
          seasons: seasons.length > 0 ? seasons : [{
            name: 'Temporada 1',
            episodes: [{
              id: `showtime-${tmdbId}-s1-e1`,
              name: 'Episódio 1',
              number: 1,
              streamUrl: ''
            }]
          }]
        }
      }
    } catch (err) {
      console.warn('Falha ao carregar metadados dinâmicos TMDB:', err)
    }
  }
}

onMounted(() => {
  loadDynamicShowtimeMedia()
})

const activeSeasonIndex = ref(Number(route.query.s) || 0)
const activeEpisodeIndex = ref(Number(route.query.e) || 0)

const playingSeasonIndex = ref(activeSeasonIndex.value)
const playingEpisodeIndex = ref(activeEpisodeIndex.value)
const syncedEpisodeId = ref<number | null>(null)
let lastSyncedWatchKey = ''

const activeSourceId = ref<string>('')
const showStorageModal = ref(false)
const showDebridModal = ref(false)
const remoteDebridSources = ref<StreamSourceOption[]>([])
const isDownloadingToNas = ref(false)

const isCurrentlyLocal = computed(() => {
  return selectedSource.value?.type === 'local' || (currentEpisode.value?.streamUrl?.startsWith('/local-media/') ?? false)
})

async function fetchDebridStreams() {
  if (!media.value) return
  try {
    const res = await capyFlixApi.resolveRemoteStreams({
      tmdb_id: media.value.tmdbId,
      title: media.value.title,
      media_type: media.value.type,
      season: playingSeasonIndex.value + 1,
      episode: playingEpisodeIndex.value + 1
    })

    if (res.streams && res.streams.length > 0) {
      remoteDebridSources.value = res.streams.map((s: any, idx: number) => ({
        id: `debrid-${s.id || idx}`,
        name: s.name || 'Stream Direto HD',
        type: (s.is_local ? 'local' : 'cdn') as const,
        url: s.url,
        badge: s.badge || '1080P DIRECT',
        isDirectVideo: s.isDirectVideo ?? true
      }))
    } else {
      remoteDebridSources.value = []
    }
  } catch (err) {
    console.warn('Falha ao resolver streams Debrid:', err)
  }
}

function onDownloadCompleted() {
  fetchDebridStreams()
}

async function triggerNasDownload() {
  if (isCurrentlyLocal.value) {
    showStorageModal.value = true
    return
  }

  isDownloadingToNas.value = true
  try {
    const title = media.value?.title || 'Midia'
    const mediaType = media.value?.type || 'movie'
    const season = playingSeasonIndex.value + 1
    const episode = playingEpisodeIndex.value + 1
    const url = selectedSource.value?.url || ''

    await capyFlixApi.startDownload({
      title,
      media_type: mediaType,
      season,
      episode,
      url
    })

    showStorageModal.value = true
  } catch (err: any) {
    alert(err.response?.data?.message || 'Falha ao iniciar download no NAS.')
  } finally {
    isDownloadingToNas.value = false
  }
}

function onDebridSaved() {
  fetchDebridStreams()
}

watch(
  () => [media.value?.tmdbId, playingSeasonIndex.value, playingEpisodeIndex.value],
  () => {
    fetchDebridStreams()
  },
  { immediate: true }
)

const isFavorite = computed(() => {
  return media.value ? mediaStore.isFavorite(media.value.id) : false
})

const currentSeasonEpisodes = computed(() => {
  if (!media.value || !media.value.seasons[activeSeasonIndex.value]) return []
  return media.value.seasons[activeSeasonIndex.value].episodes
})

const currentEpisode = computed(() => {
  if (!media.value) return null
  const season = media.value.seasons[playingSeasonIndex.value]
  if (!season) return null
  return season.episodes[playingEpisodeIndex.value] || null
})

const availableSources = computed<StreamSourceOption[]>(() => {
  if (!media.value) return []
  const base = resolveStreamSources({
    tmdbId: media.value.tmdbId,
    mediaType: media.value.type,
    season: playingSeasonIndex.value + 1,
    episode: playingEpisodeIndex.value + 1,
    localStreamUrl: currentEpisode.value?.streamUrl
  })

  // 1. Local NAS direto tem prioridade máxima (vindo do catálogo base ou detectado no NAS)
  const locals = [
    ...base.filter(s => s.type === 'local'),
    ...remoteDebridSources.value.filter(s => s.type === 'local')
  ]
  // 2. Streams debrid / CDN direto (sem iframes e sem anúncios)
  const debrids = remoteDebridSources.value.filter(s => s.type !== 'local')
  // 3. Fallbacks
  const fallbacks = base.filter(s => s.type !== 'local')

  return [...locals, ...debrids, ...fallbacks]
})

const selectedSource = computed<StreamSourceOption | null>(() => {
  if (availableSources.value.length === 0) return null
  const found = availableSources.value.find(s => s.id === activeSourceId.value)
  return found || availableSources.value[0] || null
})

watch(
  () => availableSources.value,
  (newSources) => {
    if (newSources.length > 0 && (!activeSourceId.value || !newSources.some(s => s.id === activeSourceId.value))) {
      activeSourceId.value = newSources[0].id
    }
  },
  { immediate: true }
)

const savedInitialTime = computed(() => {
  if (!media.value) return 0
  const p = mediaStore.getEpisodeProgress(media.value.id, playingSeasonIndex.value, playingEpisodeIndex.value)
  return p ? p.time : 0
})

watch(
  () => [playingSeasonIndex.value, playingEpisodeIndex.value, media.value?.tmdbId],
  () => {
    syncWithCapyShowTime(false)
  },
  { immediate: true }
)

async function syncWithCapyShowTime(markAsWatched = false) {
  if (!media.value || !media.value.tmdbId) return
  const seasonNum = playingSeasonIndex.value + 1
  const epNum = playingEpisodeIndex.value + 1
  const watchKey = `${media.value.tmdbId}-${seasonNum}-${epNum}-${markAsWatched}`

  if (lastSyncedWatchKey === watchKey) return
  lastSyncedWatchKey = watchKey

  try {
    const res = await capyShowTimeApi.syncWatch({
      tmdb_id: media.value.tmdbId,
      season_number: seasonNum,
      episode_number: epNum,
      title: media.value.title,
      is_watched: markAsWatched
    })

    if (res.data?.episode?.id) {
      syncedEpisodeId.value = res.data.episode.id
    }
  } catch (err) {
    console.warn('Sincronização CapyShowTime ignorada (modo offline ou API indisponível):', err)
  }
}

function switchSeason(sIdx: number) {
  activeSeasonIndex.value = sIdx
  router.replace({
    query: { ...route.query, s: sIdx, e: 0 }
  })
}

function selectEpisode(eIdx: number) {
  activeEpisodeIndex.value = eIdx
  playingSeasonIndex.value = activeSeasonIndex.value
  playingEpisodeIndex.value = eIdx

  router.replace({
    query: { ...route.query, s: activeSeasonIndex.value, e: eIdx }
  })
}

function toggleWatched(sIdx: number, eIdx: number) {
  if (!media.value) return
  const isWatched = isEpisodeCompleted(sIdx, eIdx)
  if (isWatched) {
    mediaStore.saveEpisodeProgress(media.value.id, sIdx, eIdx, 0, 100, true)
  } else {
    mediaStore.saveEpisodeProgress(media.value.id, sIdx, eIdx, 100, 100, true)
    syncWithCapyShowTime(true)
  }
}

function handlePause() {
  mediaStore.flushProgressSync()
}

function handleTimeUpdate(data: { currentTime: number; duration: number }) {
  if (!media.value) return
  mediaStore.saveEpisodeProgress(
    media.value.id,
    playingSeasonIndex.value,
    playingEpisodeIndex.value,
    data.currentTime,
    data.duration
  )

  if (data.duration > 0 && data.currentTime / data.duration >= 0.90) {
    syncWithCapyShowTime(true)
  }
}

function handleEpisodeEnded() {
  if (!media.value) return
  mediaStore.flushProgressSync()
  syncWithCapyShowTime(true)

  const season = media.value.seasons[playingSeasonIndex.value]
  if (season && playingEpisodeIndex.value + 1 < season.episodes.length) {
    selectEpisode(playingEpisodeIndex.value + 1)
  } else if (playingSeasonIndex.value + 1 < media.value.seasons.length) {
    activeSeasonIndex.value = playingSeasonIndex.value + 1
    selectEpisode(0)
  }
}

function isEpisodeCompleted(sIdx: number, eIdx: number): boolean {
  if (!media.value) return false
  const p = mediaStore.getEpisodeProgress(media.value.id, sIdx, eIdx)
  return p ? p.completed : false
}

function getEpisodePercent(sIdx: number, eIdx: number): number {
  if (!media.value) return 0
  const p = mediaStore.getEpisodeProgress(media.value.id, sIdx, eIdx)
  if (!p || p.duration <= 0) return 0
  return Math.min(100, Math.round((p.time / p.duration) * 100))
}

function formatNum(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function formatType(type: string): string {
  switch (type) {
    case 'anime': return 'Anime'
    case 'movie': return 'Filme'
    case 'cartoon': return 'Desenho'
    default: return 'Série'
  }
}

function handleBeforeUnload() {
  mediaStore.flushProgressSync()
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    mediaStore.flushProgressSync()
  }
}

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  mediaStore.flushProgressSync()
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.watch-view {
  padding-top: 12px;
  padding-bottom: 80px;
}

.watch-top-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.back-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  transition: all 0.2s;
}

.back-link-btn:hover {
  color: var(--text-main);
  background-color: var(--bg-surface-hover);
}

.media-title-sub {
  font-size: 0.85rem;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-wrapper {
  margin-bottom: 20px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.download-needed-card {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: radial-gradient(circle at center, rgba(30, 27, 24, 0.95), rgba(14, 12, 10, 0.98));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

.download-prompt-content {
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.prompt-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(245, 197, 24, 0.1);
  border: 1px solid rgba(245, 197, 24, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
}

.prompt-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: 0.05em;
}

.prompt-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.prompt-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 6px;
}

.btn-start-dl {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--color-accent);
  color: #12100e;
  border: none;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-start-dl:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-start-dl:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-open-storage {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-muted);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-open-storage:hover {
  color: var(--text-main);
  border-color: var(--color-accent);
}

.sources-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background-color: var(--bg-surface-elevated);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  scrollbar-width: none;
}

.sources-toolbar::-webkit-scrollbar {
  display: none;
}

.sources-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-dim);
  white-space: nowrap;
}

/* Barra Superior de Ações do Player */
.player-actions-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--bg-surface-elevated);
  border-bottom: 1px solid var(--color-border);
  gap: 10px;
}

.actions-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions-right {
  display: flex;
  align-items: center;
}

.nas-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  color: var(--color-accent);
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.nas-download-btn:hover {
  background-color: rgba(245, 197, 24, 0.12);
  border-color: var(--color-accent);
}

.nas-download-btn.is-local {
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.4);
  background-color: rgba(16, 185, 129, 0.1);
}

.nas-download-btn.is-downloading {
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.4);
  animation: pulse 1.5s infinite;
}

.fav-icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.fav-icon-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.fav-icon-btn.active {
  background-color: rgba(245, 197, 24, 0.15);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.storage-quota-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: var(--text-dim);
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.storage-quota-badge:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
  border-style: solid;
}

/* Cartão de Detalhes */
.media-details-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 18px;
  margin-bottom: 20px;
}

.details-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 10px;
}

.media-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.2;
}

.media-original-title {
  font-size: 0.82rem;
  font-weight: 400;
  color: var(--text-dim);
  margin-top: 2px;
}

.meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.meta-text {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.meta-dot {
  font-size: 0.6rem;
  color: var(--text-dim);
}

.synopsis-text {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.5;
}

/* Abas de Temporada */
.seasons-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 18px;
  scrollbar-width: none;
}

.seasons-tabs::-webkit-scrollbar {
  display: none;
}

.season-tab-btn {
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.season-tab-btn.active {
  background-color: var(--color-accent);
  color: #12100e;
  border-color: var(--color-accent);
  font-weight: 700;
}

/* Grade de Episódios */
.episodes-section {
  margin-top: 10px;
}

.episodes-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}

.ep-count {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.episodes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.episode-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.episode-card:hover {
  background-color: var(--bg-surface-elevated);
  border-color: var(--color-primary-light);
}

.episode-card.is-playing {
  border-color: var(--color-accent);
  background-color: var(--color-accent-dim);
}

.episode-card.watched {
  border-color: rgba(245, 197, 24, 0.25);
}

.episode-media {
  position: relative;
  width: 96px;
  height: 60px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
}

.episode-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.episode-code {
  position: absolute;
  bottom: 3px;
  left: 3px;
  background: rgba(0, 0, 0, 0.8);
  color: var(--color-accent);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 2px;
}

.playing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
}

.episode-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.episode-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.episode-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.episode-status-row {
  flex-shrink: 0;
}

.status-tag {
  font-size: 0.7rem;
  color: var(--text-dim);
}

.status-tag.watched {
  color: var(--color-accent);
  font-weight: 700;
}

.status-tag.progress {
  color: var(--color-primary-light);
  font-weight: 600;
}

.episode-progress-bar {
  width: 100%;
  height: 3px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 1px;
  overflow: hidden;
}

.episode-progress-fill {
  height: 100%;
  background-color: var(--color-accent);
}

/* TV Time Check Button */
.check-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  color: var(--text-dim);
  background-color: var(--bg-surface-elevated);
  transition: all 0.2s;
  flex-shrink: 0;
}

.check-btn:hover {
  transform: scale(1.08);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.check-btn.active {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: #12100e;
  box-shadow: 0 0 10px rgba(245, 197, 24, 0.3);
}

.not-found-view {
  padding: 60px 20px;
  text-align: center;
}
</style>
