<template>
  <div class="embed-player-container">
    <div v-if="isLoading" class="embed-loading-overlay">
      <div class="spinner"></div>
      <p class="mono">Conectando ao servidor de streaming web...</p>
    </div>

    <!-- Iframe com atributos sandbox de proteção contra redirecionamentos indesejados -->
    <iframe
      :key="src"
      :src="src"
      class="embed-iframe"
      frameborder="0"
      allowfullscreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
      @load="onIframeLoaded"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  src: string
}>()

const isLoading = ref(true)

function onIframeLoaded() {
  isLoading.value = false
}

watch(
  () => props.src,
  () => {
    isLoading.value = true
  }
)
</script>

<style scoped>
.embed-player-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000000;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.embed-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.embed-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(18, 16, 14, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  z-index: 5;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(245, 197, 24, 0.2);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
