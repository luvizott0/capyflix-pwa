<template>
  <div class="search-page container fade-in">
    <header class="page-header">
      <div class="header-top">
        <h1 class="header-title mono">Buscar no Catálogo</h1>
      </div>

      <!-- Barra de Busca no estilo CapyShowTime -->
      <div class="search-bar">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar anime, filme ou clássico..."
          class="search-input"
          autofocus
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
          <X :size="16" />
        </button>
      </div>

      <!-- 1. Barra Rápida de Formatos / Tipos -->
      <div class="types-scroll-bar">
        <button
          type="button"
          class="genre-pill"
          :class="{ active: selectedType === 'all' }"
          @click="selectedType = 'all'"
        >
          Todos os Formatos
        </button>
        <button
          type="button"
          class="genre-pill"
          :class="{ active: selectedType === 'anime' }"
          @click="selectedType = 'anime'"
        >
          Animes
        </button>
        <button
          type="button"
          class="genre-pill"
          :class="{ active: selectedType === 'movie' }"
          @click="selectedType = 'movie'"
        >
          Filmes
        </button>
        <button
          type="button"
          class="genre-pill"
          :class="{ active: selectedType === 'cartoon' }"
          @click="selectedType = 'cartoon'"
        >
          Desenhos
        </button>
        <button
          type="button"
          class="genre-pill"
          :class="{ active: selectedType === 'dub' }"
          @click="selectedType = 'dub'"
        >
          Dublados
        </button>
      </div>

      <!-- 2. Filtro de Gêneros estilo CapyShowTime -->
      <div class="genres-section">
        <div class="genres-label-row">
          <span class="filter-label mono">Gêneros:</span>
          <button
            v-if="selectedGenre !== 'all'"
            type="button"
            class="clear-genre-btn mono"
            @click="selectedGenre = 'all'"
          >
            Limpar gênero
          </button>
        </div>
        <div class="genres-scroll-bar">
          <button
            type="button"
            class="genre-pill"
            :class="{ active: selectedGenre === 'all' }"
            @click="selectedGenre = 'all'"
          >
            Todos
          </button>
          <button
            v-for="genre in availableGenres"
            :key="genre.key"
            type="button"
            class="genre-pill"
            :class="{ active: selectedGenre === genre.key }"
            @click="selectedGenre = genre.key"
          >
            {{ genre.label }}
          </button>
        </div>
      </div>
    </header>

    <main class="page-body">
      <!-- Cabeçalho dos Resultados + Seletor de Visualização (Justify Between) -->
      <div class="results-header">
        <span class="results-count mono">{{ filteredResults.length }} títulos disponíveis</span>

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

      <!-- Grade de Títulos (Padrão ou Compacta 4x4) -->
      <div
        v-if="filteredResults.length > 0"
        class="series-grid"
        :class="{ 'compact-grid': viewMode === 'compact' }"
      >
        <MediaCard
          v-for="item in filteredResults"
          :key="item.id"
          :media="item"
          :compact="viewMode === 'compact'"
        />
      </div>

      <!-- Empty State no estilo CapyShowTime -->
      <div v-else class="empty-state fade-in">
        <div class="empty-icon-box">
          <Film :size="40" class="empty-icon" />
        </div>
        <h3 class="empty-title">Nenhum título encontrado</h3>
        <p class="empty-desc">
          Não encontramos resultados com esses filtros. Tente buscar por outros termos ou limpar a seleção.
        </p>
        <button type="button" class="btn-secondary" @click="resetSearch">
          Limpar Filtros
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, X, Film, LayoutGrid, Grid } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import type { MediaItem } from '@/types/media'
import MediaCard from '@/components/MediaCard.vue'

const mediaStore = useMediaStore()

const searchQuery = ref('')
const selectedType = ref('all')
const selectedGenre = ref('all')

// Modo de visualização: 'normal' ou 'compact' (4 por linha)
const savedViewMode = (localStorage.getItem('capyflix_search_view_mode') as 'normal' | 'compact') || 'normal'
const viewMode = ref<'normal' | 'compact'>(savedViewMode)

function setViewMode(mode: 'normal' | 'compact') {
  viewMode.value = mode
  localStorage.setItem('capyflix_search_view_mode', mode)
}

// Lista de Gêneros estilo CapyShowTime com aliases para suportar acervo Akira Nolan e TMDB
const availableGenres = [
  { key: 'acao', label: 'Ação', aliases: ['acao', 'ação', 'action'] },
  { key: 'aventura', label: 'Aventura', aliases: ['aventura', 'adventure'] },
  { key: 'animacao', label: 'Animação', aliases: ['animacao', 'animação', 'animation'] },
  { key: 'comedia', label: 'Comédia', aliases: ['comedia', 'comédia', 'comedy'] },
  { key: 'drama', label: 'Drama', aliases: ['drama', 'emocional'] },
  { key: 'fantasia', label: 'Fantasia', aliases: ['fantasia', 'fantasy'] },
  { key: 'ficcao', label: 'Ficção Científica', aliases: ['ficcao', 'ficção', 'sci-fi', 'scifi', 'science fiction'] },
  { key: 'misterio', label: 'Mistério', aliases: ['misterio', 'mistério', 'mystery'] },
  { key: 'romance', label: 'Romance', aliases: ['romance'] },
  { key: 'escolar', label: 'Escolar', aliases: ['escolar', 'school'] }
]

function matchesGenre(item: MediaItem, genreKey: string): boolean {
  if (!genreKey || genreKey === 'all') return true
  const genreDef = availableGenres.find(g => g.key === genreKey)
  if (!genreDef) return true

  const itemGenres = (item.genres || []).map(g =>
    g.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  )

  return genreDef.aliases.some(alias => {
    const cleanAlias = alias.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return itemGenres.some(g => g.includes(cleanAlias))
  })
}

const filteredResults = computed(() => {
  let list = searchQuery.value.trim()
    ? mediaStore.search(searchQuery.value)
    : mediaStore.catalog

  // Filtro por Formato / Tipo
  if (selectedType.value === 'anime') {
    list = list.filter(item => item.type === 'anime')
  } else if (selectedType.value === 'movie') {
    list = list.filter(item => item.type === 'movie')
  } else if (selectedType.value === 'cartoon') {
    list = list.filter(item => item.type === 'cartoon')
  } else if (selectedType.value === 'dub') {
    list = list.filter(item => item.isDubbed)
  }

  // Filtro por Gênero
  if (selectedGenre.value !== 'all') {
    list = list.filter(item => matchesGenre(item, selectedGenre.value))
  }

  return list
})

function resetSearch() {
  searchQuery.value = ''
  selectedType.value = 'all'
  selectedGenre.value = 'all'
}
</script>

<style scoped>
.search-page {
  padding-top: 16px;
  padding-bottom: 80px;
}

.page-header {
  margin-bottom: 20px;
}

.header-top {
  margin-bottom: 14px;
}

.header-title {
  font-size: 1.25rem;
  color: var(--text-main);
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  gap: 8px;
  margin-bottom: 12px;
}

.search-icon {
  color: var(--text-muted);
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  padding: 12px 0;
  color: var(--text-main);
  font-size: 0.95rem;
  outline: none;
}

.clear-btn {
  color: var(--text-muted);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  color: var(--text-main);
}

.types-scroll-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.types-scroll-bar::-webkit-scrollbar {
  display: none;
}

/* Seção de Gêneros */
.genres-section {
  margin-top: 6px;
}

.genres-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.filter-label {
  font-size: 0.72rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.clear-genre-btn {
  font-size: 0.72rem;
  color: var(--color-accent);
  background: none;
  cursor: pointer;
}

.clear-genre-btn:hover {
  text-decoration: underline;
}

/* Cabeçalho dos Resultados */
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
  border-radius: var(--radius-full);
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
  margin: 0 auto 20px auto;
  line-height: 1.45;
}
</style>
