<template>
  <section v-if="items.length > 0" class="carousel-section">
    <div class="carousel-header">
      <h2 class="section-title mono">{{ title }}</h2>
      <span class="carousel-count mono">{{ items.length }} títulos</span>
    </div>

    <div class="carousel-wrapper">
      <button
        v-if="canScrollLeft"
        type="button"
        class="nav-btn prev"
        aria-label="Anterior"
        @click="scroll(-1)"
      >
        <ChevronLeft :size="18" />
      </button>

      <div ref="trackRef" class="carousel-track" @scroll="onTrackScroll">
        <div
          v-for="item in items"
          :key="item.id"
          class="carousel-item"
        >
          <slot :item="item">
            <MediaCard :media="item" />
          </slot>
        </div>
      </div>

      <button
        type="button"
        class="nav-btn next"
        aria-label="Próximo"
        @click="scroll(1)"
      >
        <ChevronRight :size="18" />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { MediaItem } from '@/types/media'
import MediaCard from './MediaCard.vue'

defineProps<{
  title: string
  items: MediaItem[]
}>()

const trackRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)

function onTrackScroll() {
  if (trackRef.value) {
    canScrollLeft.value = trackRef.value.scrollLeft > 20
  }
}

function scroll(direction: number) {
  if (!trackRef.value) return
  const itemWidth = 150 + 14
  const scrollAmount = itemWidth * 3 * direction
  trackRef.value.scrollBy({
    left: scrollAmount,
    behavior: 'smooth'
  })
}
</script>

<style scoped>
.carousel-section {
  margin: 24px 0;
  position: relative;
}

.carousel-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}

.carousel-count {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.carousel-wrapper {
  position: relative;
  width: 100%;
}

.carousel-track {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 4px 0 12px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.carousel-track::-webkit-scrollbar {
  display: none;
}

.carousel-item {
  flex: 0 0 135px;
  width: 135px;
}

@media (min-width: 640px) {
  .carousel-item {
    flex: 0 0 155px;
    width: 155px;
  }
}

.nav-btn {
  position: absolute;
  top: 45%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: rgba(22, 19, 17, 0.9);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
  opacity: 0;
}

.carousel-wrapper:hover .nav-btn {
  opacity: 1;
}

.nav-btn:hover {
  background: var(--color-accent);
  color: #12100e;
  border-color: var(--color-accent);
}

.nav-btn.prev {
  left: -8px;
}

.nav-btn.next {
  right: -8px;
}

@media (max-width: 768px) {
  .nav-btn {
    display: none !important;
  }
}
</style>
