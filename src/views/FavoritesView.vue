<template>
  <div class="favorites-page container fade-in">
    <header class="page-header">
      <div class="header-top">
        <div>
          <h1 class="header-title mono">Minha Lista</h1>
          <p class="header-subtitle">Seus títulos salvos para assistir</p>
        </div>
        <span v-if="mediaStore.favoriteMedia.length > 0" class="count-badge mono">
          {{ mediaStore.favoriteMedia.length }} títulos
        </span>
      </div>
    </header>

    <main class="page-body">
      <div v-if="mediaStore.favoriteMedia.length > 0" class="series-grid">
        <MediaCard
          v-for="item in mediaStore.favoriteMedia"
          :key="item.id"
          :media="item"
        />
      </div>

      <div v-else class="empty-state fade-in">
        <div class="empty-icon-box">
          <Bookmark :size="40" class="empty-icon" />
        </div>
        <h3 class="empty-title">Sua lista está vazia</h3>
        <p class="empty-desc">
          Toque no botão de favoritar em qualquer anime ou filme para salvá-lo aqui e assistir quando quiser.
        </p>
        <router-link to="/" class="btn-primary">
          <span>Explorar Catálogo</span>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { Bookmark } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import MediaCard from '@/components/MediaCard.vue'

const mediaStore = useMediaStore()
</script>

<style scoped>
.favorites-page {
  padding-top: 16px;
  padding-bottom: 80px;
}

.page-header {
  margin-bottom: 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-title {
  font-size: 1.25rem;
  color: var(--text-main);
  margin-bottom: 4px;
}

.header-subtitle {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.count-badge {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.series-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 14px;
}

@media (min-width: 640px) {
  .series-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon-box {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px auto;
  color: var(--text-dim);
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  max-width: 360px;
  margin: 0 auto 20px auto;
  line-height: 1.45;
}
</style>
