<template>
  <div v-if="isOpen && media" class="modal-backdrop fade-in" @click.self="close">
    <div class="modal-dialog">
      <div class="modal-header">
        <div class="modal-badge mono">
          <Sparkles :size="14" />
          <span>CapyShowTime</span>
        </div>
        <button type="button" class="close-btn" @click="close" aria-label="Fechar">
          <X :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <div class="modal-media-row">
          <img
            :src="media.poster || '/capy-icon.svg'"
            :alt="media.title"
            class="modal-poster"
            loading="lazy"
          />
          <div class="modal-media-info">
            <h3 class="modal-title">{{ media.title }}</h3>
            <div class="modal-meta">
              <span v-if="media.rating" class="modal-rating mono">★ {{ Number(media.rating).toFixed(1) }}</span>
              <span v-if="media.year" class="modal-year mono">{{ media.year }}</span>
              <span v-if="media.genres && media.genres.length > 0" class="modal-genre mono">
                {{ media.genres[0] }}
              </span>
            </div>

            <div class="status-alert">
              <Clock :size="16" class="status-icon" />
              <div class="status-text">
                <strong>Não disponível no CapyFlix</strong>
                <p>
                  Este título foi avaliado ou assistido pelos seus amigos no <b>CapyShowTime</b>, mas ainda não possui episódios/vídeos carregados no acervo do CapyFlix.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p v-if="media.synopsis" class="modal-synopsis">
          {{ media.synopsis }}
        </p>

        <div class="nas-tip">
          <FolderPlus :size="16" class="tip-icon" />
          <span>
            Para assistir no CapyFlix, basta colocar os arquivos na pasta <code>X:\séries\{{ media.title }}</code> ou <code>X:\filmes</code> no seu servidor.
          </span>
        </div>
      </div>

      <div class="modal-footer">
        <a
          v-if="media.tmdbId"
          :href="showtimeUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-showtime"
        >
          <ExternalLink :size="16" />
          <span>Ver no CapyShowTime</span>
        </a>
        <button type="button" class="btn-dismiss" @click="close">
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X, ExternalLink, Sparkles, Clock, FolderPlus } from 'lucide-vue-next'
import type { MediaItem } from '@/types/media'

const props = defineProps<{
  isOpen: boolean
  media: MediaItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function close() {
  emit('close')
}

const showtimeUrl = computed(() => {
  if (!props.media?.tmdbId) return '#'
  const host = window.location.hostname
  const port = '5174'
  return `http://${host}:${port}/series/${props.media.tmdbId}`
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-dialog {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border);
}

.modal-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-accent);
  background: rgba(245, 197, 24, 0.1);
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(245, 197, 24, 0.25);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  color: var(--text-main);
  background: var(--bg-surface-elevated);
}

.modal-body {
  padding: 18px;
  overflow-y: auto;
  max-height: calc(85vh - 130px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-media-row {
  display: flex;
  gap: 16px;
}

.modal-poster {
  width: 90px;
  height: 135px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  flex-shrink: 0;
  background: var(--bg-surface-elevated);
}

.modal-media-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-width: 0;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
  line-height: 1.3;
}

.modal-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-dim);
}

.modal-rating {
  color: var(--color-accent);
  font-weight: 700;
}

.modal-genre {
  background: var(--bg-surface-elevated);
  padding: 2px 6px;
  border-radius: 4px;
}

.status-alert {
  display: flex;
  gap: 10px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 10px;
  border-radius: var(--radius-sm);
  margin-top: 6px;
}

.status-icon {
  color: #ef4444;
  flex-shrink: 0;
  margin-top: 2px;
}

.status-text strong {
  display: block;
  font-size: 0.8rem;
  color: #ef4444;
  margin-bottom: 2px;
}

.status-text p {
  font-size: 0.76rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
}

.modal-synopsis {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nas-tip {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--bg-surface-elevated);
  border: 1px dashed var(--color-border);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.76rem;
  color: var(--text-dim);
  line-height: 1.4;
}

.tip-icon {
  color: var(--color-accent);
  flex-shrink: 0;
  margin-top: 2px;
}

.nas-tip code {
  color: var(--color-accent);
  background: rgba(0, 0, 0, 0.3);
  padding: 1px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--color-border);
  background: var(--bg-surface-elevated);
}

.btn-showtime {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--color-accent);
  color: #12100e;
  font-weight: 700;
  font-size: 0.82rem;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition: opacity 0.2s;
}

.btn-showtime:hover {
  opacity: 0.9;
}

.btn-dismiss {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.82rem;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-dismiss:hover {
  color: var(--text-main);
  border-color: var(--text-dim);
}
</style>
