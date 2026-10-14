<template>
  <router-link :to="`/watch/${media.slug}`" class="media-card">
    <div class="poster-wrapper">
      <img
        :src="optimizedPoster"
        :alt="media.title"
        class="poster-img"
        loading="lazy"
        @error="handleImageError"
      />
      
      <!-- Badges no topo -->
      <div class="badge-overlay">
        <span v-if="media.isNew" class="badge-tag badge-new">NOVO</span>
        <span v-if="media.isDubbed" class="badge-tag badge-dub">DUB</span>
        <span v-if="media.isSubbed && !media.isDubbed" class="badge-tag badge-leg">LEG</span>
      </div>

      <!-- Barra de progresso se houver histórico -->
      <div v-if="progressPercent > 0" class="progress-track">
        <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
      </div>
    </div>

    <div class="card-info">
      <h3 class="card-title">{{ media.title }}</h3>
      <div class="card-meta">
        <span class="card-type mono">{{ formatType(media.type) }}</span>
        <span v-if="media.year" class="card-year mono">{{ media.year }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MediaItem } from '@/types/media'
import { useMediaStore } from '@/stores/media'

const props = defineProps<{
  media: MediaItem
}>()

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

// Verifica se há progresso no primeiro episódio ou temporada ativa
const progressPercent = computed(() => {
  const p = mediaStore.getEpisodeProgress(props.media.id, 0, 0)
  if (p && p.duration > 0) {
    return Math.min(100, Math.round((p.time / p.duration) * 100))
  }
  return 0
})

function formatType(type: string): string {
  switch (type) {
    case 'anime': return 'ANIME'
    case 'movie': return 'FILME'
    case 'cartoon': return 'DESENHO'
    default: return 'SÉRIE'
  }
}
</script>

<style scoped>
.media-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s, box-shadow 0.3s;
  cursor: pointer;
  width: 100%;
}

.media-card:hover {
  transform: translateY(-6px);
  border-color: var(--color-primary-light);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(166, 97, 48, 0.15);
}

.poster-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  background: #0a0908;
  overflow: hidden;
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.media-card:hover .poster-img {
  transform: scale(1.08);
}

.badge-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  z-index: 2;
}

.badge-new {
  background: #ff5500;
  color: #fff;
  font-weight: 800;
}

.progress-track {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(0, 0, 0, 0.7);
  z-index: 3;
}

.progress-fill {
  height: 100%;
  background: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent);
}

.card-info {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: linear-gradient(to top, rgba(18, 16, 14, 0.95), var(--bg-surface));
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--text-dim);
}

.card-type {
  color: var(--color-primary-light);
  font-weight: 700;
}
</style>
