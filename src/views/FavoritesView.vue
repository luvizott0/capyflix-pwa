<template>
  <div class="favorites-view container fade-in">
    <div class="page-header">
      <div class="header-left">
        <span class="retro-pip"></span>
        <h1 class="page-title mono">MEUS FAVORITOS</h1>
      </div>
      <span class="count-badge rajdhani">{{ mediaStore.favoriteMedia.length }} SALVOS</span>
    </div>

    <div v-if="mediaStore.favoriteMedia.length > 0" class="fav-grid">
      <MediaCard
        v-for="item in mediaStore.favoriteMedia"
        :key="item.id"
        :media="item"
      />
    </div>

    <div v-else class="empty-state">
      <img src="/capy-icon.svg" alt="Capivara" class="empty-capy-img" />
      <h3 class="empty-title mono">Nenhum favorito ainda</h3>
      <p class="empty-desc">Clique no botão de favoritar em qualquer anime ou filme para salvar sua lista aqui!</p>
      <router-link to="/" class="btn-primary" style="margin-top: 20px;">
        Explorar Catálogo
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMediaStore } from '@/stores/media'
import MediaCard from '@/components/MediaCard.vue'

const mediaStore = useMediaStore()
</script>

<style scoped>
.favorites-view {
  padding-top: 24px;
  padding-bottom: 80px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  background: var(--color-accent);
  box-shadow: 0 0 10px rgba(245, 197, 24, 0.5);
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
}

.count-badge {
  font-size: 12px;
  color: var(--text-dim);
  letter-spacing: 1px;
}

.fav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

@media (min-width: 640px) {
  .fav-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
  }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-capy-img {
  width: 72px;
  height: 72px;
  opacity: 0.6;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  color: var(--text-main);
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 13px;
  color: var(--text-muted);
  max-width: 400px;
  margin: 0 auto;
}
</style>
