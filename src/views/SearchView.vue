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

      <!-- Barra de Filtros Rápidos / Gêneros -->
      <div class="genres-scroll-bar">
        <button
          type="button"
          class="genre-pill"
          :class="{ active: selectedType === 'all' }"
          @click="selectedType = 'all'"
        >
          Todos
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
    </header>

    <main class="page-body">
      <div class="results-header">
        <h2 class="section-title mono">
          {{ searchQuery.trim() ? 'Resultados da Busca' : 'Catálogo Disponível' }}
        </h2>
        <span class="results-count mono">{{ filteredResults.length }} títulos</span>
      </div>

      <!-- Grade de Títulos -->
      <div v-if="filteredResults.length > 0" class="series-grid">
        <MediaCard
          v-for="item in filteredResults"
          :key="item.id"
          :media="item"
        />
      </div>

      <!-- Empty State no estilo CapyShowTime -->
      <div v-else class="empty-state fade-in">
        <div class="empty-icon-box">
          <Film :size="40" class="empty-icon" />
        </div>
        <h3 class="empty-title">Nenhum título encontrado</h3>
        <p class="empty-desc">
          Não encontramos resultados para "{{ searchQuery }}". Tente buscar por outros termos ou trocar de categoria.
        </p>
        <button type="button" class="btn-secondary" @click="resetSearch">
          Limpar Busca
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, X, Film } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import MediaCard from '@/components/MediaCard.vue'

const mediaStore = useMediaStore()
const searchQuery = ref('')
const selectedType = ref('all')

const filteredResults = computed(() => {
  let list = searchQuery.value.trim()
    ? mediaStore.search(searchQuery.value)
    : mediaStore.catalog

  if (selectedType.value === 'anime') {
    list = list.filter(item => item.type === 'anime')
  } else if (selectedType.value === 'movie') {
    list = list.filter(item => item.type === 'movie')
  } else if (selectedType.value === 'cartoon') {
    list = list.filter(item => item.type === 'cartoon')
  } else if (selectedType.value === 'dub') {
    list = list.filter(item => item.isDubbed)
  }

  return list
})

function resetSearch() {
  searchQuery.value = ''
  selectedType.value = 'all'
}
</script>

<style scoped>
.search-page {
  padding-top: 16px;
  padding-bottom: 80px;
}

.page-header {
  margin-bottom: 24px;
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

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}

.results-count {
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
