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

    <!-- Player de Vídeo -->
    <div class="player-wrapper">
      <VideoPlayer
        v-if="currentEpisode"
        :src="currentEpisode.streamUrl"
        :cover-url="media.backdrop || media.poster"
        :initial-time="savedInitialTime"
        @timeupdate="handleTimeUpdate"
        @ended="handleEpisodeEnded"
      />
    </div>

    <!-- Informações do Título -->
    <div class="media-details-card">
      <div class="details-top">
        <div class="title-block">
          <h1 class="media-title">{{ media.title }}</h1>
          <h2 v-if="media.originalTitle" class="media-original-title">{{ media.originalTitle }}</h2>
        </div>

        <button
          type="button"
          class="fav-toggle-btn"
          :class="{ active: isFavorite }"
          @click="mediaStore.toggleFavorite(media.id)"
          :title="isFavorite ? 'Remover dos Favoritos' : 'Salvar na Minha Lista'"
        >
          <Bookmark :size="16" :fill="isFavorite ? 'currentColor' : 'none'" />
          <span class="mono">{{ isFavorite ? 'SALVO' : 'SALVAR' }}</span>
        </button>
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

    <!-- Grade de Episódios no estilo CapyShowTime -->
    <div class="episodes-section">
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
              :src="media.backdrop || media.poster"
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
  </div>

  <div v-else class="not-found-view container">
    <p class="mono">Título não encontrado no catálogo do CapyFlix.</p>
    <router-link to="/" class="btn-primary" style="margin-top: 16px;">
      Voltar ao Início
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Bookmark, Check, Play } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import VideoPlayer from '@/components/VideoPlayer.vue'
import EpisodeCommentsSection from '@/components/EpisodeCommentsSection.vue'
import { capyShowTimeApi } from '@/api/capyshowtime'

const route = useRoute()
const router = useRouter()
const mediaStore = useMediaStore()

const slug = computed(() => route.params.slug as string)
const media = computed(() => mediaStore.getMediaBySlug(slug.value))

const activeSeasonIndex = ref(Number(route.query.s) || 0)
const activeEpisodeIndex = ref(Number(route.query.e) || 0)

const playingSeasonIndex = ref(activeSeasonIndex.value)
const playingEpisodeIndex = ref(activeEpisodeIndex.value)
const syncedEpisodeId = ref<number | null>(null)
let lastSyncedWatchKey = ''

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
    mediaStore.saveEpisodeProgress(media.value.id, sIdx, eIdx, 0, 100)
  } else {
    mediaStore.saveEpisodeProgress(media.value.id, sIdx, eIdx, 100, 100)
    syncWithCapyShowTime(true)
  }
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

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
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

.fav-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.fav-toggle-btn.active {
  background-color: var(--color-accent-dim);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.fav-toggle-btn:hover {
  border-color: var(--color-accent);
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
