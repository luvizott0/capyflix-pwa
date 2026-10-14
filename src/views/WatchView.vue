<template>
  <div v-if="media" class="watch-view container fade-in">
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
          :title="isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'"
        >
          <svg viewBox="0 0 24 24" class="fav-icon"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>
          <span class="fav-text mono">{{ isFavorite ? 'FAVORITADO' : 'FAVORITAR' }}</span>
        </button>
      </div>

      <div class="genres-row">
        <span v-for="genre in media.genres" :key="genre" class="genre-pill">{{ genre }}</span>
        <span v-if="media.year" class="genre-pill mono">{{ media.year }}</span>
        <span v-if="media.rating" class="genre-pill mono rating-pill">★ {{ media.rating.toFixed(1) }}</span>
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

    <!-- Grade de Episódios -->
    <div class="episodes-section">
      <div class="episodes-header">
        <h3 class="episodes-title mono">
          {{ media.seasons[activeSeasonIndex]?.name || 'Episódios' }}
        </h3>
        <span class="ep-count rajdhani">{{ currentSeasonEpisodes.length }} EPISÓDIOS</span>
      </div>

      <div class="episodes-grid">
        <div
          v-for="(ep, eIdx) in currentSeasonEpisodes"
          :key="ep.id"
          class="episode-card"
          :class="{
            'is-playing': activeSeasonIndex === playingSeasonIndex && activeEpisodeIndex === eIdx,
            'is-completed': isEpisodeCompleted(activeSeasonIndex, eIdx)
          }"
          @click="selectEpisode(eIdx)"
        >
          <div class="ep-num-box rajdhani">
            <span v-if="activeSeasonIndex === playingSeasonIndex && activeEpisodeIndex === eIdx" class="playing-pulse">▶</span>
            <span v-else>{{ String(ep.number).padStart(2, '0') }}</span>
          </div>

          <div class="ep-details">
            <h4 class="ep-name">{{ ep.name }}</h4>
            <div class="ep-status-row">
              <span v-if="isEpisodeCompleted(activeSeasonIndex, eIdx)" class="status-tag completed mono">
                ✓ 100% CONCLUÍDO
              </span>
              <span v-else-if="getEpisodePercent(activeSeasonIndex, eIdx) > 0" class="status-tag in-progress mono">
                {{ getEpisodePercent(activeSeasonIndex, eIdx) }}% ASSISTIDO
              </span>
              <span v-else class="status-tag mono">
                FULL HD
              </span>
            </div>
          </div>

          <!-- Barra de progresso individual do episódio -->
          <div class="ep-progress-bar">
            <div
              class="ep-progress-fill"
              :style="{ width: `${getEpisodePercent(activeSeasonIndex, eIdx)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Seção de Comentários e Debate do Episódio (Integrado à Capihouse & CapyShowTime) -->
    <EpisodeCommentsSection :episode-id="syncedEpisodeId" />
  </div>

  <div v-else class="not-found-view container">
    <p class="mono">Título não encontrado no catálogo do CapyFlix.</p>
    <router-link to="/" class="btn-primary" style="margin-top: 16px;">Voltar ao Início</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  return p && !p.completed ? p.time : 0
})

async function syncWithCapyShowTime(markAsWatched = false) {
  if (!media.value?.tmdbId) return
  const sNum = playingSeasonIndex.value + 1
  const eNum = playingEpisodeIndex.value + 1
  const key = `${media.value.tmdbId}_${sNum}_${eNum}_${markAsWatched}`

  if (markAsWatched && lastSyncedWatchKey === key) return

  const res = await capyShowTimeApi.syncWatch(media.value.tmdbId, sNum, eNum, markAsWatched)
  if (res && res.episode_id) {
    syncedEpisodeId.value = res.episode_id
    if (markAsWatched) {
      lastSyncedWatchKey = key
    }
  }
}

watch([playingSeasonIndex, playingEpisodeIndex, media], () => {
  syncWithCapyShowTime(false)
}, { immediate: true })

function switchSeason(sIdx: number) {
  activeSeasonIndex.value = sIdx
}

function selectEpisode(eIdx: number) {
  activeEpisodeIndex.value = eIdx
  playingSeasonIndex.value = activeSeasonIndex.value
  playingEpisodeIndex.value = eIdx

  router.replace({
    query: { s: activeSeasonIndex.value, e: eIdx }
  })
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

  // Sincroniza como assistido na CapyShowTime se passou de 90%
  if (data.duration > 0 && data.currentTime / data.duration >= 0.90) {
    syncWithCapyShowTime(true)
  }
}

function handleEpisodeEnded() {
  if (!media.value) return
  syncWithCapyShowTime(true)

  // Auto avançar para o próximo episódio se houver
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

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<style scoped>
.watch-view {
  padding-top: 16px;
  padding-bottom: 80px;
}

.player-wrapper {
  margin-bottom: 24px;
}

/* Cartão de Detalhes */
.media-details-card {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 24px;
}

.details-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.media-title {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
}

.media-original-title {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-primary-light);
  margin-top: 2px;
}

.fav-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.fav-toggle-btn .fav-icon {
  width: 16px;
  height: 16px;
}

.fav-toggle-btn.active {
  background: rgba(245, 197, 24, 0.15);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.fav-toggle-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.genres-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.genre-pill {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border-subtle);
  color: var(--text-muted);
}

.rating-pill {
  color: var(--color-accent);
  border-color: rgba(245, 197, 24, 0.3);
}

.synopsis-text {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
}

/* Abas de Temporada */
.seasons-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 20px;
}

.season-tab-btn {
  padding: 8px 18px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.season-tab-btn.active,
.season-tab-btn:hover {
  background: var(--color-accent);
  color: #12100e;
  border-color: var(--color-accent);
  box-shadow: 0 0 14px rgba(245, 197, 24, 0.3);
}

/* Grade de Episódios */
.episodes-section {
  margin-top: 10px;
}

.episodes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.episodes-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.ep-count {
  font-size: 12px;
  color: var(--text-dim);
  letter-spacing: 1px;
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.episode-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s ease;
}

.episode-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary-light);
  background: var(--bg-surface-elevated);
}

.episode-card.is-playing {
  border-color: var(--color-accent);
  background: rgba(245, 197, 24, 0.08);
}

.ep-num-box {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-accent);
  flex-shrink: 0;
}

.playing-pulse {
  color: var(--color-accent);
  font-size: 14px;
}

.ep-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
  flex: 1;
}

.ep-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ep-status-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-tag {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-dim);
  letter-spacing: 0.5px;
}

.status-tag.completed {
  color: var(--color-success);
}

.status-tag.in-progress {
  color: var(--color-accent);
}

.ep-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.4);
}

.ep-progress-fill {
  height: 100%;
  background: var(--color-accent);
}

.not-found-view {
  padding: 60px 0;
  text-align: center;
}
</style>
