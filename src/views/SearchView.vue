<template>
  <div class="search-view container fade-in">
    <!-- Barra de Busca Instantânea Retrô -->
    <div class="search-box-wrapper">
      <div class="search-input-container">
        <svg viewBox="0 0 24 24" class="search-icon"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Pesquisar por nome, gênero, clássicos..."
          class="search-input"
          autofocus
        />
        <button
          v-if="searchQuery"
          type="button"
          class="clear-btn"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <!-- Pílulas de Filtros Rápidos -->
      <div class="filter-pills">
        <button
          type="button"
          class="filter-pill mono"
          :class="{ active: selectedType === 'all' }"
          @click="selectedType = 'all'"
        >
          TODOS
        </button>
        <button
          type="button"
          class="filter-pill mono"
          :class="{ active: selectedType === 'anime' }"
          @click="selectedType = 'anime'"
        >
          ANIMES
        </button>
        <button
          type="button"
          class="filter-pill mono"
          :class="{ active: selectedType === 'movie' }"
          @click="selectedType = 'movie'"
        >
          FILMES
        </button>
        <button
          type="button"
          class="filter-pill mono"
          :class="{ active: selectedType === 'cartoon' }"
          @click="selectedType = 'cartoon'"
        >
          DESENHOS
        </button>
        <button
          type="button"
          class="filter-pill mono"
          :class="{ active: selectedType === 'dub' }"
          @click="selectedType = 'dub'"
        >
          DUBLADOS
        </button>
      </div>
    </div>

    <!-- Resultados -->
    <div class="results-section">
      <div class="results-header">
        <span class="results-count rajdhani">{{ filteredResults.length }} TÍTULOS ENCONTRADOS</span>
      </div>

      <div v-if="filteredResults.length > 0" class="results-grid">
        <MediaCard
          v-for="item in filteredResults"
          :key="item.id"
          :media="item"
        />
      </div>

      <div v-else class="empty-state">
        <img src="/capy-icon.svg" alt="Capivara" class="empty-capy-img" />
        <h3 class="empty-title mono">Nenhum título encontrado</h3>
        <p class="empty-desc">Tente buscar por termos mais genéricos ou trocar os filtros acima.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMediaStore } from '@/stores/media'
import MediaCard from '@/components/MediaCard.vue'

const mediaStore = useMediaStore()
const searchQuery = ref('')
const selectedType = ref('all')

const filteredResults = computed(() => {
  let list = mediaStore.search(searchQuery.value)

  if (selectedType.value === 'anime') {
    list = list.filter(i => i.type === 'anime')
  } else if (selectedType.value === 'movie') {
    list = list.filter(i => i.type === 'movie')
  } else if (selectedType.value === 'cartoon') {
    list = list.filter(i => i.type === 'cartoon')
  } else if (selectedType.value === 'dub') {
    list = list.filter(i => i.isDubbed)
  }

  return list
})
</script>

<style scoped>
.search-view {
  padding-top: 24px;
  padding-bottom: 80px;
}

.search-box-wrapper {
  margin-bottom: 28px;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 6px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input-container:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 16px rgba(245, 197, 24, 0.25);
}

.search-icon {
  width: 20px;
  height: 20px;
  color: var(--text-dim);
  margin-right: 12px;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 15px;
  outline: none;
  padding: 8px 0;
}

.clear-btn {
  color: var(--text-dim);
  font-size: 16px;
  padding: 4px;
  cursor: pointer;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: var(--color-accent);
}

.filter-pills {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 14px 4px 0 4px;
}

.filter-pill {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border-subtle);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.filter-pill.active,
.filter-pill:hover {
  background: var(--color-accent);
  color: #12100e;
  border-color: var(--color-accent);
}

.results-header {
  margin-bottom: 16px;
  padding: 0 4px;
}

.results-count {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-dim);
  letter-spacing: 1px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

@media (min-width: 640px) {
  .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
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
}
</style>
