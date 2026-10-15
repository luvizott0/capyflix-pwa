<template>
  <component
    :is="media.isAvailable === false ? 'div' : 'router-link'"
    :to="media.isAvailable === false ? undefined : `/watch/${media.slug}`"
    class="series-card"
    :class="{ 'is-compact': compact, 'is-unavailable': media.isAvailable === false }"
    :title="media.isAvailable === false ? `${media.title} (Não disponível para streaming)` : media.title"
    @click="handleClick"
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
      <div v-if="!compact && (media.isAvailable === false || media.isDubbed || media.isSubbed || media.isNew)" class="badges-overlay">
        <span v-if="media.isAvailable === false" class="badge-mini badge-unavailable mono">INDISPONÍVEL</span>
        <span v-else-if="media.isNew" class="badge-mini badge-new mono">NOVO</span>
        <span v-if="media.isDubbed" class="badge-mini badge-dub mono">DUB</span>
        <span v-else-if="media.isSubbed" class="badge-mini badge-leg mono">LEG</span>
      </div>

      <!-- Rating Badge no estilo CapyShowTime (topo direito) -->
      <div v-if="media.rating" class="rating-badge mono" :class="{ 'rating-mini': compact }">
        ★ {{ Number(media.rating).toFixed(1) }}
      </div>

      <!-- Barra de progresso se houver histórico -->
      <div v-if="progressPercent > 0" class="progress-bar-bg">
        <div class="progress-bar-fill" :style="{ width: `${progressPercent}%` }"></div>
      </div>

      <!-- Overlay de amigos assistindo / avaliando (se houver) -->
      <div v-if="friends && friends.length > 0" class="friends-avatars-overlay">
        <div class="avatar-stack">
          <img
            v-for="friend in friends.slice(0, 3)"
            :key="friend.id"
            :src="friend.avatar_url || '/capy-icon.svg'"
            :alt="friend.name"
            class="friend-avatar-thumb"
            :title="friend.name"
          />
        </div>
        <span v-if="friendBadge" class="friend-badge-text mono">{{ friendBadge }}</span>
      </div>
    </div>

    <!-- Informações de título e ano (ocultas no modo compacto onde fica apenas a capa) -->
    <div v-if="!compact" class="series-info">
      <h3 class="series-title">{{ media.title }}</h3>
      <div v-if="customSubtitle" class="custom-subtitle mono">{{ customSubtitle }}</div>
      <div v-else class="series-meta">
        <span v-if="media.year" class="meta-item">{{ media.year }}</span>
        <span v-if="media.year" class="meta-dot">•</span>
        <span class="meta-item">{{ formatType(media.type) }}</span>
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MediaItem } from '@/types/media'
import { useMediaStore } from '@/stores/media'

const props = withDefaults(
  defineProps<{
    media: MediaItem
    compact?: boolean
    friendBadge?: string
    friends?: Array<{ id: number; name: string; username: string; avatar_url?: string }>
    customSubtitle?: string
  }>(),
  {
    compact: false
  }
)

const emit = defineEmits<{
  (e: 'unavailable-click', media: MediaItem): void
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

function handleClick() {
  if (props.media.isAvailable === false) {
    emit('unavailable-click', props.media)
  }
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
  border-radius: var(--radius-sm);
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

.badge-unavailable {
  background: rgba(239, 68, 68, 0.85);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.series-card.is-unavailable {
  opacity: 0.85;
}

.series-card.is-unavailable:hover .poster-img {
  filter: brightness(0.9);
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

.custom-subtitle {
  font-size: 0.7rem;
  color: var(--color-accent);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-dot {
  font-size: 0.6rem;
}

/* Overlay de amigos sobre a capa */
.friends-avatars-overlay {
  position: absolute;
  bottom: 6px;
  left: 6px;
  right: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(18, 16, 14, 0.85);
  backdrop-filter: blur(4px);
  padding: 3px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 4;
}

.avatar-stack {
  display: flex;
  align-items: center;
}

.friend-avatar-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--bg-card);
  object-fit: cover;
  margin-left: -5px;
}

.friend-avatar-thumb:first-child {
  margin-left: 0;
}

.friend-badge-text {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
