<template>
  <section v-if="items.length > 0" class="carousel-section">
    <div class="carousel-header">
      <div class="header-left">
        <span class="retro-pip"></span>
        <h2 class="carousel-title mono">{{ title }}</h2>
      </div>
      <span class="items-count rajdhani">{{ items.length }} DISPONÍVEIS</span>
    </div>

    <div class="carousel-wrapper">
      <button
        type="button"
        class="nav-btn prev"
        aria-label="Anterior"
        @click="scroll(-1)"
      >
        ‹
      </button>

      <div ref="trackRef" class="carousel-track">
        <div
          v-for="item in items"
          :key="item.id"
          class="carousel-item"
        >
          <MediaCard :media="item" />
        </div>
      </div>

      <button
        type="button"
        class="nav-btn next"
        aria-label="Próximo"
        @click="scroll(1)"
      >
        ›
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { MediaItem } from '@/types/media'
import MediaCard from './MediaCard.vue'

defineProps<{
  title: string
  items: MediaItem[]
}>()

const trackRef = ref<HTMLElement | null>(null)

function scroll(direction: number) {
  if (!trackRef.value) return
  const itemWidth = 180 + 16
  const scrollAmount = itemWidth * 3 * direction
  trackRef.value.scrollBy({
    left: scrollAmount,
    behavior: 'smooth'
  })
}
</script>

<style scoped>
.carousel-section {
  margin: 28px 0;
  position: relative;
}

.carousel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.retro-pip {
  width: 6px;
  height: 18px;
  border-radius: 3px;
  background: linear-gradient(to bottom, var(--color-accent), var(--color-primary));
  box-shadow: 0 0 10px rgba(245, 197, 24, 0.4);
}

.carousel-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.items-count {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-dim);
  letter-spacing: 1px;
}

.carousel-wrapper {
  position: relative;
  width: 100%;
}

/* Sombras graduadas nas pontas do carrossel */
.carousel-wrapper::before,
.carousel-wrapper::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30px;
  z-index: 4;
  pointer-events: none;
}

.carousel-wrapper::before {
  left: 0;
  background: linear-gradient(to right, var(--bg-app), transparent);
}

.carousel-wrapper::after {
  right: 0;
  background: linear-gradient(to left, var(--bg-app), transparent);
}

.carousel-track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 8px 4px 16px 4px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.carousel-track::-webkit-scrollbar {
  display: none;
}

.carousel-item {
  flex: 0 0 160px;
  width: 160px;
}

@media (min-width: 640px) {
  .carousel-item {
    flex: 0 0 180px;
    width: 180px;
  }
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-60%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(18, 16, 14, 0.9);
  border: 1px solid var(--color-border);
  color: var(--color-accent);
  font-size: 20px;
  font-weight: bold;
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
  box-shadow: 0 0 12px rgba(245, 197, 24, 0.4);
  transform: translateY(-60%) scale(1.1);
}

.nav-btn.prev {
  left: -12px;
}

.nav-btn.next {
  right: -12px;
}

@media (max-width: 768px) {
  .nav-btn {
    display: none !important;
  }
}
</style>
