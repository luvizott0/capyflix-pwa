<template>
  <div class="collection-page container fade-in">
    <!-- Barra Superior de Navegação / Voltar -->
    <div class="collection-top-nav">
      <button type="button" class="back-link-btn" @click="router.back()">
        <ArrowLeft :size="18" />
        <span>Voltar</span>
      </button>
    </div>

    <header class="page-header">
      <div class="header-content">
        <h1 class="header-title mono">{{ collectionMeta.title }}</h1>
        <p class="header-subtitle">{{ collectionMeta.subtitle }}</p>
      </div>
    </header>

    <main class="page-body">
      <!-- Cabeçalho de Resultados + Seletor de Visualização (Igual à tela de Busca) -->
      <div class="results-header">
        <span class="results-count mono">{{ collectionItems.length }} títulos disponíveis</span>

        <!-- Botão de alternância da forma de visualização -->
        <div class="view-mode-toggle">
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ active: viewMode === 'normal' }"
            title="Visualização Padrão (com detalhes)"
            @click="setViewMode('normal')"
          >
            <LayoutGrid :size="16" />
            <span class="mode-label">Padrão</span>
          </button>

          <button
            type="button"
            class="view-toggle-btn"
            :class="{ active: viewMode === 'compact' }"
            title="Visualização Compacta (apenas capas, 4 por linha)"
            @click="setViewMode('compact')"
          >
            <Grid :size="16" />
            <span class="mode-label">4 por linha</span>
          </button>
        </div>
      </div>

      <!-- Grade de Títulos (Padrão ou Compacta 4 por linha) -->
      <div
        v-if="collectionItems.length > 0"
        class="series-grid"
        :class="{ 'compact-grid': viewMode === 'compact' }"
      >
        <MediaCard
          v-for="(item, idx) in collectionItems"
          :key="item.id || item.media?.id || idx"
          :media="item.media || item"
          :friends="item.friends"
          :friend-badge="item.friendBadge"
          :custom-subtitle="item.customSubtitle"
          :compact="viewMode === 'compact'"
          @unavailable-click="openUnavailableModal"
        />
      </div>

      <!-- Estado vazio -->
      <div v-else class="empty-state fade-in">
        <div class="empty-icon-box">
          <Film :size="40" class="empty-icon" />
        </div>
        <h3 class="empty-title">Nenhum título encontrado</h3>
        <p class="empty-desc">Esta lista ainda não possui títulos disponíveis no momento.</p>
        <router-link to="/" class="btn-primary" style="margin-top: 16px;">
          Voltar ao Início
        </router-link>
      </div>
    </main>

    <!-- Modal de título não disponível no acervo -->
    <UnavailableMediaModal
      :is-open="isUnavailableModalOpen"
      :media="unavailableSelectedMedia"
      @close="closeUnavailableModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, LayoutGrid, Grid, Film } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { capyShowTimeApi, type FriendWatchingItem, type FriendTopRatedItem } from '@/api/capyshowtime'
import type { MediaItem } from '@/types/media'
import MediaCard from '@/components/MediaCard.vue'
import UnavailableMediaModal from '@/components/UnavailableMediaModal.vue'

const route = useRoute()
const router = useRouter()
const mediaStore = useMediaStore()

const isUnavailableModalOpen = ref(false)
const unavailableSelectedMedia = ref<MediaItem | null>(null)

function openUnavailableModal(media: MediaItem) {
  unavailableSelectedMedia.value = media
  isUnavailableModalOpen.value = true
}

function closeUnavailableModal() {
  isUnavailableModalOpen.value = false
  unavailableSelectedMedia.value = null
}

const viewMode = ref<'normal' | 'compact'>(
  (localStorage.getItem('capyflix_view_mode') as 'normal' | 'compact') || 'normal'
)

function setViewMode(mode: 'normal' | 'compact') {
  viewMode.value = mode
  localStorage.setItem('capyflix_view_mode', mode)
}

const collectionId = computed(() => (route.params.id as string) || 'all')

const friendsWatching = ref<FriendWatchingItem[]>([])
const friendsTopRated = ref<FriendTopRatedItem[]>([])

async function loadData() {
  if (collectionId.value === 'friends-watching') {
    try {
      const data = await capyShowTimeApi.getFriendsWatching()
      if (Array.isArray(data)) friendsWatching.value = data
    } catch (err) {
      console.warn('Falha ao carregar amigos assistindo:', err)
    }
  } else if (collectionId.value === 'friends-top-rated') {
    try {
      const data = await capyShowTimeApi.getFriendsTopRated()
      if (Array.isArray(data)) friendsTopRated.value = data
    } catch (err) {
      console.warn('Falha ao carregar amigos top-rated:', err)
    }
  }
}

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  loadData()
})

const collectionMeta = computed(() => {
  switch (collectionId.value) {
    case 'trending':
      return {
        title: 'Em Alta Esta Semana',
        subtitle: 'Os títulos mais assistidos, procurados e em destaque no CapyFlix'
      }
    case 'friends-watching':
      return {
        title: 'O Que os Amigos Estão Assistindo',
        subtitle: 'Atividade em tempo real dos moradores da CapiHouse via CapyShowTime'
      }
    case 'friends-top-rated':
      return {
        title: 'Séries Preferidas dos Amigos',
        subtitle: 'As séries e clássicos com as melhores avaliações da casa'
      }
    case 'movies':
      return {
        title: 'Filmes do Acervo',
        subtitle: 'Longas-metragens disponíveis para reprodução instantânea'
      }
    case 'animes':
      return {
        title: 'Animes',
        subtitle: 'Temporadas completas dubladas e legendadas em alta resolução'
      }
    case 'cartoons':
      return {
        title: 'Desenhos & Clássicos',
        subtitle: 'Nostalgia pura e grandes clássicos da animação'
      }
    default:
      return {
        title: 'Catálogo Completo',
        subtitle: 'Explore todos os títulos disponíveis no acervo'
      }
  }
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

function formatNum(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

const collectionItems = computed<any[]>(() => {
  switch (collectionId.value) {
    case 'trending':
      return mediaStore.catalog.filter(m => m.isFeatured || m.isNew || (m.rating && m.rating >= 8.3))

    case 'friends-watching':
      if (friendsWatching.value.length > 0) {
        return friendsWatching.value.map(item => {
          const catalogItem = findCatalogItem(item.tmdb_id, item.title)
          const baseMedia = catalogItem
            ? { ...catalogItem, isAvailable: true }
            : ({
                id: `cst-watch-${item.series_id}`,
                slug: `showtime-${item.tmdb_id || item.series_id}`,
                tmdbId: item.tmdb_id,
                title: item.title,
                poster: item.poster_url || '/capy-icon.svg',
                backdrop: item.backdrop_url || '',
                synopsis: item.overview || 'Título acompanhado pelos amigos no CapyShowTime.',
                type: 'series',
                genres: ['CapyShowTime'],
                rating: item.vote_average || 8.2,
                isAvailable: false,
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
      return mediaStore.catalog.map(item => ({
        media: item,
        friends: [],
        friendBadge: 'Popular na Casa',
        customSubtitle: 'Recomendado pelos moradores'
      }))

    case 'friends-top-rated':
      if (friendsTopRated.value.length > 0) {
        return friendsTopRated.value.map(item => {
          const catalogItem = findCatalogItem(item.tmdb_id, item.title)
          const baseMedia = catalogItem
            ? { ...catalogItem, isAvailable: true }
            : ({
                id: `cst-top-${item.series_id}`,
                slug: `showtime-${item.tmdb_id || item.series_id}`,
                tmdbId: item.tmdb_id,
                title: item.title,
                poster: item.poster_url || '/capy-icon.svg',
                backdrop: item.backdrop_url || '',
                synopsis: item.overview || 'Título avaliado e recomendado pelos amigos no CapyShowTime.',
                type: 'series',
                genres: item.genres || ['CapyShowTime', 'Favorito'],
                rating: item.friends_rating,
                isAvailable: false,
                seasons: []
              } as MediaItem)

          return {
            media: baseMedia,
            friends: item.friends,
            friendBadge: `★ ${Number(item.friends_rating).toFixed(1)} amigos`,
            customSubtitle: `Avaliado por ${item.ratings_count || item.friends.length || 1} amigo(s)`
          }
        })
      }
      return [...mediaStore.catalog]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .map(item => ({
          media: item,
          friends: [],
          friendBadge: `★ ${item.rating?.toFixed(1) || '8.8'} favorito`,
          customSubtitle: 'Melhores avaliações da casa'
        }))

    case 'movies':
      return mediaStore.movies

    case 'animes':
      return mediaStore.animes

    case 'cartoons':
      return mediaStore.cartoons

    default:
      return mediaStore.catalog
  }
})
</script>

<style scoped>
.collection-page {
  padding-top: 16px;
  padding-bottom: 80px;
}

.collection-top-nav {
  margin-bottom: 16px;
}

.back-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-link-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.page-header {
  margin-bottom: 24px;
}

.header-title {
  font-size: clamp(1.4rem, 3.5vw, 2rem);
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.2;
}

.header-subtitle {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.results-count {
  font-size: 0.8rem;
  color: var(--text-dim);
}

/* Seletor de Modo de Visualização */
.view-mode-toggle {
  display: inline-flex;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px;
  gap: 2px;
}

.view-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-toggle-btn:hover {
  color: var(--text-main);
}

.view-toggle-btn.active {
  background-color: var(--color-accent);
  color: #12100e;
}

.mode-label {
  display: none;
}

@media (min-width: 480px) {
  .mode-label {
    display: inline;
  }
}

/* Grade Padrão */
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

/* Grade Compacta: 4 itens por linha apenas com a capa */
.series-grid.compact-grid {
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 8px;
}

@media (min-width: 640px) {
  .series-grid.compact-grid {
    gap: 12px;
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
  max-width: 380px;
  margin: 0 auto;
}
</style>
