<template>
  <router-link
    :to="`/watch/${media.slug}`"
    class="series-card"
    :class="{ 'is-compact': compact }"
    :title="media.title"
  >
    <div class="poster-container">
      <img
        :src="optimizedPoster"
        :alt="media.title"
        class="poster-img"
        loading="lazy"
        @error="handleImageError"
      />

      <!-- Badges discretas no topo esquerdo (apenas no modo normal) -->
      <div v-if="!compact && (media.isDubbed || media.isSubbed || media.isNew)" class="badges-overlay">
        <span v-if="media.isNew" class="badge-mini badge-new mono">NOVO</span>
        <span v-if="media.isDubbed" class="badge-mini badge-dub mono">DUB</span>
        <span v-else-if="media.isSubbed" class="badge-mini badge-leg mono">LEG</span>
      </div>

      <!-- Rating Badge no estilo CapyShowTime (topo direito) -->
      <div v-if="media.rating" class="rating-badge mono" :class="{ 'rating-mini': compact }">
        ★ {{ media.rating.toFixed(1) }}
      </div>

      <!-- Barra de progresso se houver histórico -->
      <div v-if="progressPercent > 0" class="progress-bar-bg">
        <div class="progress-bar-fill" :style="{ width: `${progressPercent}%` }"></div>
      </div>
    </div>

    <!-- Informações de título e ano (ocultas no modo compacto onde fica apenas a capa) -->
    <div v-if="!compact" class="series-info">
      <h3 class="series-title">{{ media.title }}</h3>
      <div class="series-meta">
        <span v-if="media.year" class="meta-item">{{ media.year }}</span>
        <span v-if="media.year" class="meta-dot">•</span>
        <span class="meta-item">{{ formatType(media.type) }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MediaItem } from '@/types/media'
import { useMediaStore } from '@/stores/media'

const props = withDefaults(
  defineProps<{
    media: MediaItem
    compact?: boolean
  }>(),
  {
    compact: false
  }
)

const mediaStore = useMediaStore()
const fallbackActive = ref(false)

const optimizedPoster = computed(() => {
  if (fallbackActive.value || !props.media.poster) {
    return '/capy-icon.svg'
  }
  return props.media.poster
})

function handleImageError() {
  fallbackActive.value = true
}

const progressPercent = computed(() => {
  const p = mediaStore.getEpisodeProgress(props.media.id, 0, 0)
  if (p && p.duration > 0) {
    return Math.min(100, Math.round((p.time / p.duration) * 100))
  }
  return 0
})

function formatType(type: string): string {
  switch (type) {
    case 'anime': return 'Anime'
    case 'movie': return 'Filme'
    case 'cartoon': return 'Desenho'
    default: return 'Série'
  }
}
</script>

<style scoped>
.series-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.2s ease;
  width: 100%;
}

.series-card:hover {
  transform: translateY(-4px);
}

.series-card.is-compact:hover {
  transform: translateY(-3px) scale(1.02);
}

.poster-container {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
}

.is-compact .poster-container {
  border-radius: var(--radius-sm);
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.series-card:hover .poster-img {
  transform: scale(1.03);
}

.badges-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
  z-index: 2;
}

.badge-mini {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.03em;
}

.badge-new {
  background-color: var(--color-accent);
  color: #12100e;
}

.badge-dub {
  background: rgba(0, 0, 0, 0.75);
  color: var(--color-accent);
  border: 1px solid rgba(245, 197, 24, 0.3);
  backdrop-filter: blur(4px);
}

.badge-leg {
  background: rgba(0, 0, 0, 0.75);
  color: var(--text-muted);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
}

.rating-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  backdrop-filter: blur(4px);
  z-index: 2;
}

.rating-badge.rating-mini {
  top: 4px;
  right: 4px;
  font-size: 0.62rem;
  padding: 1px 4px;
  border-radius: 3px;
}

.progress-bar-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.6);
  z-index: 3;
}

.progress-bar-fill {
  height: 100%;
  background-color: var(--color-accent);
}

.series-info {
  margin-top: 8px;
}

.series-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}

.series-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-dim);
  margin-top: 2px;
}

.meta-dot {
  font-size: 0.6rem;
}
</style>
