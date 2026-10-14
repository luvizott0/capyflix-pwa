<template>
  <div class="home-view fade-in">
    <!-- Hero Banner do Título em Destaque -->
    <div v-if="heroItem" class="hero-banner" :style="{ backgroundImage: `url(${heroItem.backdrop || heroItem.poster})` }">
      <div class="hero-overlay"></div>
      <div class="hero-content container">
        <div class="hero-badges">
          <span class="badge-tag badge-dub" v-if="heroItem.isDubbed">DUBLADO</span>
          <span class="badge-tag badge-leg" v-if="heroItem.isSubbed">LEGENDADO</span>
          <span class="badge-tag badge-hd">FULL HD 1080P</span>
        </div>

        <h1 class="hero-title">{{ heroItem.title }}</h1>
        <p class="hero-synopsis">{{ heroItem.synopsis }}</p>

        <div class="hero-actions">
          <router-link :to="`/watch/${heroItem.slug}`" class="btn-primary">
            <svg viewBox="0 0 24 24" class="btn-icon"><polygon points="6,4 20,12 6,20" fill="currentColor"/></svg>
            <span>Assistir Agora</span>
          </router-link>

          <button
            type="button"
            class="btn-secondary"
            @click="mediaStore.toggleFavorite(heroItem.id)"
          >
            <svg viewBox="0 0 24 24" class="btn-icon" :style="{ color: isHeroFav ? '#f5c518' : 'currentColor' }">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
            </svg>
            <span>{{ isHeroFav ? 'Salvo' : 'Favoritar' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Dica Retrô de Performance e Streaming (Sem Travamentos) -->
    <div class="container tip-section">
      <div class="performance-tip-box">
        <div class="tip-badge mono">⚡ DIRECT PLAY HOMELAB</div>
        <p class="tip-text">
          Transmissão otimizada sem transcodificação pesada. Os episódios rodam direto via <strong>Nginx HTTP Range</strong> para garantir zero travamentos na rede local ou no seu Tailscale!
        </p>
      </div>
    </div>

    <!-- Carrosséis de Mídia -->
    <div class="container carousels-container">
      <!-- Continuar Assistindo -->
      <section v-if="mediaStore.continueWatching.length > 0" class="continue-section">
        <div class="section-header">
          <span class="retro-pip"></span>
          <h2 class="section-title mono">CONTINUAR ASSISTINDO</h2>
        </div>

        <div class="continue-grid">
          <div
            v-for="item in mediaStore.continueWatching"
            :key="item.media.id"
            class="continue-card"
          >
            <router-link :to="`/watch/${item.media.slug}?s=${item.progress.seasonIndex}&e=${item.progress.episodeIndex}`" class="continue-link">
              <div class="continue-thumb-wrapper">
                <img :src="item.media.backdrop || item.media.poster" :alt="item.media.title" class="continue-thumb" />
                <div class="play-overlay-mini">
                  <svg viewBox="0 0 24 24" class="icon"><polygon points="6,4 20,12 6,20" fill="currentColor"/></svg>
                </div>
                <div class="continue-progress-bar">
                  <div
                    class="continue-progress-fill"
                    :style="{ width: `${Math.round((item.progress.time / item.progress.duration) * 100)}%` }"
                  ></div>
                </div>
              </div>
              <div class="continue-info">
                <h4 class="continue-title">{{ item.media.title }}</h4>
                <span class="continue-ep mono">Temp {{ item.progress.seasonIndex + 1 }} • Ep {{ item.progress.episodeIndex + 1 }}</span>
              </div>
            </router-link>
          </div>
        </div>
      </section>

      <!-- Destaques -->
      <MediaCarousel
        title="✨ Em Alta & Destaques"
        :items="mediaStore.featuredMedia"
      />

      <!-- Animes -->
      <MediaCarousel
        title="⛩️ Animes em Full HD"
        :items="mediaStore.animes"
      />

      <!-- Filmes -->
      <MediaCarousel
        title="🍿 Cinema & Filmes"
        :items="mediaStore.movies"
      />

      <!-- Desenhos -->
      <MediaCarousel
        title="📺 Clássicos & Desenhos"
        :items="mediaStore.cartoons"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMediaStore } from '@/stores/media'
import MediaCarousel from '@/components/MediaCarousel.vue'

const mediaStore = useMediaStore()

const heroItem = computed(() => {
  return mediaStore.featuredMedia[0] || mediaStore.catalog[0]
})

const isHeroFav = computed(() => {
  return heroItem.value ? mediaStore.isFavorite(heroItem.value.id) : false
})
</script>

<style scoped>
.home-view {
  padding-bottom: 80px;
}

/* Hero Banner */
.hero-banner {
  position: relative;
  min-height: 440px;
  background-size: cover;
  background-position: center 25%;
  display: flex;
  align-items: flex-end;
  padding: 80px 0 40px 0;
  border-bottom: 1px solid var(--color-border);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(18, 16, 14, 0.4) 0%,
    rgba(18, 16, 14, 0.85) 70%,
    var(--bg-app) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 700px;
}

.hero-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 12px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
}

.hero-synopsis {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 24px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* Caixa de Dica de Performance */
.tip-section {
  margin-top: 24px;
}

.performance-tip-box {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-accent);
  border-radius: var(--radius-md);
  padding: 14px 18px;
}

.tip-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.tip-text {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}

.tip-text strong {
  color: var(--text-main);
}

/* Continuar Assistindo */
.continue-section {
  margin: 32px 0 16px 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.retro-pip {
  width: 6px;
  height: 18px;
  border-radius: 3px;
  background: var(--color-accent);
  box-shadow: 0 0 10px rgba(245, 197, 24, 0.5);
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
}

.continue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.continue-card {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s;
}

.continue-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
}

.continue-thumb-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

.continue-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay-mini {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(18, 16, 14, 0.85);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
}

.play-overlay-mini .icon {
  width: 18px;
  height: 18px;
  margin-left: 2px;
}

.continue-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(0, 0, 0, 0.6);
}

.continue-progress-fill {
  height: 100%;
  background: var(--color-accent);
}

.continue-info {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.continue-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.continue-ep {
  font-size: 11px;
  color: var(--color-primary-light);
}

.carousels-container {
  margin-top: 10px;
}
</style>
