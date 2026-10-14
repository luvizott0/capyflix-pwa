<template>
  <div class="home-view fade-in">
    <!-- Hero Banner Estilo CapyShowTime / Cinema -->
    <div v-if="heroItem" class="hero-wrapper">
      <div
        class="hero-banner"
        :style="{ backgroundImage: `url(${heroItem.backdrop || heroItem.poster})` }"
      >
        <div class="hero-overlay"></div>
        <div class="hero-content container">
          <div class="hero-meta-top">
            <span v-if="heroItem.rating" class="badge-rating mono">
              ★ {{ heroItem.rating.toFixed(1) }}
            </span>
            <span v-if="heroItem.year" class="meta-text mono">{{ heroItem.year }}</span>
            <span class="meta-dot">•</span>
            <span class="meta-text">{{ formatType(heroItem.type) }}</span>
            <span v-if="heroItem.isDubbed" class="badge-tag badge-dub">DUB</span>
          </div>

          <h1 class="hero-title">{{ heroItem.title }}</h1>
          <p class="hero-synopsis">{{ heroItem.synopsis }}</p>

          <div class="hero-actions">
            <router-link :to="`/watch/${heroItem.slug}`" class="btn-primary">
              <Play :size="16" fill="currentColor" />
              <span>Assistir Agora</span>
            </router-link>

            <button
              type="button"
              class="btn-secondary"
              @click="mediaStore.toggleFavorite(heroItem.id)"
            >
              <Bookmark :size="16" :fill="isHeroFav ? 'currentColor' : 'none'" />
              <span>{{ isHeroFav ? 'Salvo' : 'Favoritar' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Barra Rápida de Categorias no Estilo CapyShowTime -->
    <div class="container categories-bar-wrapper">
      <div class="genres-scroll-bar">
        <button
          type="button"
          class="genre-pill"
          :class="{ active: selectedCategory === 'all' }"
          @click="selectedCategory = 'all'"
        >
          Todos
        </button>
        <button
          type="button"
          class="genre-pill"
          :class="{ active: selectedCategory === 'anime' }"
          @click="selectedCategory = 'anime'"
        >
          Animes
        </button>
        <button
          type="button"
          class="genre-pill"
          :class="{ active: selectedCategory === 'movie' }"
          @click="selectedCategory = 'movie'"
        >
          Filmes
        </button>
        <button
          type="button"
          class="genre-pill"
          :class="{ active: selectedCategory === 'cartoon' }"
          @click="selectedCategory = 'cartoon'"
        >
          Desenhos
        </button>
        <button
          type="button"
          class="genre-pill"
          :class="{ active: selectedCategory === 'dub' }"
          @click="selectedCategory = 'dub'"
        >
          Dublados
        </button>
      </div>
    </div>

    <div class="container page-content">
      <!-- Continuar Assistindo (se houver histórico) -->
      <section v-if="mediaStore.continueWatching.length > 0 && selectedCategory === 'all'" class="continue-section">
        <div class="section-header">
          <h2 class="section-title mono">Continuar Assistindo</h2>
        </div>

        <div class="continue-grid">
          <div
            v-for="item in mediaStore.continueWatching"
            :key="item.media.id"
            class="continue-card"
          >
            <router-link
              :to="`/watch/${item.media.slug}?s=${item.progress.seasonIndex}&e=${item.progress.episodeIndex}`"
              class="continue-link"
            >
              <div class="continue-thumb-wrapper">
                <img
                  :src="item.media.backdrop || item.media.poster"
                  :alt="item.media.title"
                  class="continue-thumb"
                  loading="lazy"
                />
                <div class="play-overlay-mini">
                  <Play :size="16" fill="currentColor" />
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
                <span class="continue-ep mono">
                  S{{ formatNum(item.progress.seasonIndex + 1) }}E{{ formatNum(item.progress.episodeIndex + 1) }}
                </span>
              </div>
            </router-link>
          </div>
        </div>
      </section>

      <!-- Grade filtrada quando uma categoria específica for selecionada -->
      <section v-if="selectedCategory !== 'all'" class="filtered-category-section fade-in">
        <div class="section-header">
          <h2 class="section-title mono">{{ categoryTitle }}</h2>
          <span class="category-count mono">{{ filteredItems.length }} títulos</span>
        </div>

        <div class="category-grid">
          <MediaCard
            v-for="item in filteredItems"
            :key="item.id"
            :media="item"
          />
        </div>
      </section>

      <!-- Carrosséis quando "Todos" estiver selecionado -->
      <div v-else class="carousels-wrapper">
        <!-- 1. Em alta essa semana -->
        <MediaCarousel
          title="Em Alta Esta Semana"
          :items="displayTrending"
        />

        <!-- 2. O que os amigos estão assistindo -->
        <section v-if="displayFriendsWatching.length > 0" class="carousel-section">
          <div class="carousel-header">
            <h2 class="section-title mono">O Que os Amigos Estão Assistindo</h2>
            <span class="carousel-count mono">{{ displayFriendsWatching.length }} títulos</span>
          </div>

          <div class="carousel-wrapper">
            <div class="carousel-track">
              <div
                v-for="item in displayFriendsWatching"
                :key="item.media.id"
                class="carousel-item"
              >
                <MediaCard
                  :media="item.media"
                  :friends="item.friends"
                  :friend-badge="item.friendBadge"
                  :custom-subtitle="item.customSubtitle"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- 3. Séries preferidas dos amigos (melhores avaliadas por eles) -->
        <section v-if="displayFriendsTopRated.length > 0" class="carousel-section">
          <div class="carousel-header">
            <h2 class="section-title mono">Séries Preferidas dos Amigos</h2>
            <span class="carousel-count mono">{{ displayFriendsTopRated.length }} títulos</span>
          </div>

          <div class="carousel-wrapper">
            <div class="carousel-track">
              <div
                v-for="item in displayFriendsTopRated"
                :key="item.media.id"
                class="carousel-item"
              >
                <MediaCard
                  :media="item.media"
                  :friends="item.friends"
                  :friend-badge="item.friendBadge"
                  :custom-subtitle="item.customSubtitle"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Filmes do Acervo -->
        <MediaCarousel
          v-if="mediaStore.movies.length > 0"
          title="Filmes do Acervo"
          :items="mediaStore.movies"
        />

        <!-- Animes -->
        <MediaCarousel
          v-if="mediaStore.animes.length > 0"
          title="Animes"
          :items="mediaStore.animes"
        />

        <!-- Desenhos & Clássicos -->
        <MediaCarousel
          v-if="mediaStore.cartoons.length > 0"
          title="Desenhos & Clássicos"
          :items="mediaStore.cartoons"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Play, Bookmark } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { capyShowTimeApi, type FriendWatchingItem, type FriendTopRatedItem } from '@/api/capyshowtime'
import type { MediaItem } from '@/types/media'
import MediaCarousel from '@/components/MediaCarousel.vue'
import MediaCard from '@/components/MediaCard.vue'

const mediaStore = useMediaStore()
const selectedCategory = ref('all')

const friendsWatching = ref<FriendWatchingItem[]>([])
const friendsTopRated = ref<FriendTopRatedItem[]>([])

async function loadCommunityData() {
  try {
    const [watching, topRated] = await Promise.all([
      capyShowTimeApi.getFriendsWatching(),
      capyShowTimeApi.getFriendsTopRated()
    ])
    if (Array.isArray(watching)) friendsWatching.value = watching
    if (Array.isArray(topRated)) friendsTopRated.value = topRated
  } catch (err) {
    console.warn('[CapyFlix] Falha ao carregar atividade dos amigos:', err)
  }
}

onMounted(() => {
  loadCommunityData()
})

const heroItem = computed(() => {
  return mediaStore.featuredMedia[0] || mediaStore.catalog[0]
})

const isHeroFav = computed(() => {
  return heroItem.value ? mediaStore.isFavorite(heroItem.value.id) : false
})

function findCatalogItem(tmdbId?: number, title?: string): MediaItem | undefined {
  if (tmdbId) {
    const match = mediaStore.catalog.find(m => m.tmdbId === tmdbId)
    if (match) return match
  }
  if (title) {
    const cleanTitle = title.toLowerCase().trim()
    const match = mediaStore.catalog.find(m =>
      m.title.toLowerCase().includes(cleanTitle) ||
      cleanTitle.includes(m.title.toLowerCase())
    )
    if (match) return match
  }
  return undefined
}

// 1. Em alta essa semana
const displayTrending = computed(() => {
  return mediaStore.catalog.filter(m => m.isFeatured || m.isNew || (m.rating && m.rating >= 8.4))
})

// 2. O que os amigos estão assistindo
const displayFriendsWatching = computed(() => {
  if (friendsWatching.value.length > 0) {
    return friendsWatching.value.map(item => {
      const catalogItem = findCatalogItem(item.tmdb_id, item.title)
      const baseMedia = catalogItem || ({
        id: `cst-watch-${item.series_id}`,
        slug: catalogItem ? catalogItem.slug : (mediaStore.catalog[0]?.slug || 'a-lenda-de-korra'),
        title: item.title,
        poster: item.poster_url || '/capy-icon.svg',
        backdrop: item.backdrop_url || '',
        type: 'anime',
        genres: ['CapyShowTime'],
        rating: item.vote_average || 8.2,
        seasons: []
      } as MediaItem)

      const firstFriend = item.friends[0]?.name.split(' ')[0] || 'Amigo'
      const badgeText = item.friends.length === 1 ? `${firstFriend} assistiu` : `${item.friends.length} amigos assistindo`
      const sub = item.latest_episode
        ? `S${formatNum(item.latest_episode.season)}E${formatNum(item.latest_episode.episode)} • ${item.last_watched_at}`
        : item.last_watched_at

      return {
        media: baseMedia,
        friends: item.friends,
        friendBadge: badgeText,
        customSubtitle: sub
      }
    })
  }

  // Fallback enquanto não houver histórico registrado pelos amigos
  return mediaStore.catalog.slice(0, 6).map((item, idx) => ({
    media: item,
    friends: [],
    friendBadge: 'Popular na Casa',
    customSubtitle: 'Recomendado pelos moradores'
  }))
})

// 3. Séries preferidas dos amigos
const displayFriendsTopRated = computed(() => {
  if (friendsTopRated.value.length > 0) {
    return friendsTopRated.value.map(item => {
      const catalogItem = findCatalogItem(item.tmdb_id, item.title)
      const baseMedia = catalogItem || ({
        id: `cst-top-${item.series_id}`,
        slug: catalogItem ? catalogItem.slug : (mediaStore.catalog[0]?.slug || 'a-lenda-de-korra'),
        title: item.title,
        poster: item.poster_url || '/capy-icon.svg',
        backdrop: item.backdrop_url || '',
        type: 'anime',
        genres: item.genres || ['Favorito'],
        rating: item.friends_rating,
        seasons: []
      } as MediaItem)

      return {
        media: baseMedia,
        friends: item.friends,
        friendBadge: `★ ${item.friends_rating} amigos`,
        customSubtitle: `Avaliado por ${item.ratings_count || item.friends.length || 1} amigo(s)`
      }
    })
  }

  // Fallback com as melhores avaliadas da casa
  const sorted = [...mediaStore.catalog].sort((a, b) => (b.rating || 0) - (a.rating || 0))
  return sorted.slice(0, 8).map(item => ({
    media: item,
    friends: [],
    friendBadge: `★ ${item.rating?.toFixed(1) || '8.8'} favorito`,
    customSubtitle: 'Melhores avaliações da casa'
  }))
})

const filteredItems = computed(() => {
  switch (selectedCategory.value) {
    case 'anime': return mediaStore.animes
    case 'movie': return mediaStore.movies
    case 'cartoon': return mediaStore.cartoons
    case 'dub': return mediaStore.catalog.filter(m => m.isDubbed)
    default: return mediaStore.catalog
  }
})

const categoryTitle = computed(() => {
  switch (selectedCategory.value) {
    case 'anime': return 'Animes'
    case 'movie': return 'Filmes'
    case 'cartoon': return 'Desenhos & Clássicos'
    case 'dub': return 'Títulos Dublados'
    default: return 'Catálogo Completo'
  }
})

function formatNum(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

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
.home-view {
  padding-bottom: 80px;
}

/* Hero Banner */
.hero-wrapper {
  position: relative;
  margin-bottom: 8px;
}

.hero-banner {
  position: relative;
  min-height: 380px;
  background-size: cover;
  background-position: center 25%;
  display: flex;
  align-items: flex-end;
  padding: 60px 0 36px 0;
}

@media (min-width: 640px) {
  .hero-banner {
    min-height: 420px;
    padding: 80px 0 44px 0;
  }
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(18, 16, 14, 0.3) 0%,
    rgba(18, 16, 14, 0.75) 60%,
    var(--bg-app) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 620px;
}

.hero-meta-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.meta-text {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.meta-dot {
  font-size: 0.6rem;
  color: var(--text-dim);
}

.hero-title {
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.15;
  margin-bottom: 10px;
}

.hero-synopsis {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Categorias */
.categories-bar-wrapper {
  margin-bottom: 16px;
}

.page-content {
  margin-top: 8px;
}

/* Continuar Assistindo */
.continue-section {
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}

.category-count {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.continue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.continue-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s;
}

.continue-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-primary-light);
}

.continue-link {
  display: block;
}

.continue-thumb-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: var(--bg-surface-elevated);
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
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background-color: rgba(18, 16, 14, 0.85);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  transition: transform 0.2s;
}

.continue-card:hover .play-overlay-mini {
  transform: translate(-50%, -50%) scale(1.1);
  background-color: var(--color-accent);
  color: #12100e;
}

.continue-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.6);
}

.continue-progress-fill {
  height: 100%;
  background-color: var(--color-accent);
}

.continue-info {
  padding: 8px 12px;
}

.continue-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.continue-ep {
  font-size: 0.72rem;
  color: var(--text-dim);
}

/* Grade de Categoria */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 14px;
}

@media (min-width: 640px) {
  .category-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
}
</style>
