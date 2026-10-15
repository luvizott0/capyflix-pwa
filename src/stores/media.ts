import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Fuse from 'fuse.js'
import type { MediaItem, WatchProgress } from '@/types/media'
import { initialCatalog } from '@/data/initialCatalog'
import { capyShowTimeApi } from '@/api/capyshowtime'

export const useMediaStore = defineStore('media', () => {
  const catalog = ref<MediaItem[]>(initialCatalog)
  const favorites = ref<string[]>(JSON.parse(localStorage.getItem('capyflix_favorites') || '[]'))
  const progressMap = ref<Record<string, WatchProgress>>(
    JSON.parse(localStorage.getItem('capyflix_progress') || '{}')
  )

  // Carrega catálogo sincronizado dinâmico se existir em public/catalog.json
  async function loadCatalog() {
    try {
      const res = await fetch('/catalog.json', { cache: 'no-cache' })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          catalog.value = data
        }
      }
    } catch {
      // Fallback para o initialCatalog
    }
  }

  // Sincroniza progresso do banco de dados na inicialização
  async function syncProgressFromBackend() {
    try {
      const dbEntries = await capyShowTimeApi.getWatchProgress()
      if (Array.isArray(dbEntries) && dbEntries.length > 0) {
        let changed = false
        for (const item of dbEntries) {
          const key = getProgressKey(item.media_id, item.season_index, item.episode_index)
          const local = progressMap.value[key]
          const dbTime = new Date(item.last_watched_at).getTime()

          // Se não existir local ou se o banco for mais recente, atualiza local
          if (!local || dbTime > (local.updatedAt || 0)) {
            progressMap.value[key] = {
              mediaId: item.media_id,
              seasonIndex: item.season_index,
              episodeIndex: item.episode_index,
              time: item.time,
              duration: item.duration,
              completed: Boolean(item.completed),
              updatedAt: dbTime
            }
            changed = true
          }
        }
        if (changed) {
          localStorage.setItem('capyflix_progress', JSON.stringify(progressMap.value))
        }
      }
    } catch {
      // offline ou api indisponível
    }
  }

  loadCatalog()
  syncProgressFromBackend()

  // Salvar no localStorage sempre que alterar favoritos
  function toggleFavorite(mediaId: string) {
    if (favorites.value.includes(mediaId)) {
      favorites.value = favorites.value.filter(id => id !== mediaId)
    } else {
      favorites.value.push(mediaId)
    }
    localStorage.setItem('capyflix_favorites', JSON.stringify(favorites.value))
  }

  function isFavorite(mediaId: string): boolean {
    return favorites.value.includes(mediaId)
  }

  // Progresso do episódio
  function getProgressKey(mediaId: string, seasonIndex: number, episodeIndex: number): string {
    return `${mediaId}_s${seasonIndex}_e${episodeIndex}`
  }

  function getEpisodeProgress(mediaId: string, seasonIndex: number, episodeIndex: number): WatchProgress | null {
    const key = getProgressKey(mediaId, seasonIndex, episodeIndex)
    return progressMap.value[key] || null
  }

  let lastBackendSyncTime = 0
  let pendingSyncPayload: {
    media_id: string
    season_index: number
    episode_index: number
    time: number
    duration: number
    completed: boolean
  } | null = null
  let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null
  let lastLocalStorageSaveTime = 0

  /**
   * Força a sincronização imediata de qualquer progresso pendente para o backend
   * (ao pausar, ao trocar de episódio, ao terminar, ou ao sair da página)
   */
  function flushProgressSync() {
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer)
      syncDebounceTimer = null
    }

    try {
      localStorage.setItem('capyflix_progress', JSON.stringify(progressMap.value))
    } catch {
      // ignore quota
    }

    if (!pendingSyncPayload) return

    const payload = pendingSyncPayload
    pendingSyncPayload = null
    lastBackendSyncTime = Date.now()

    capyShowTimeApi.saveWatchProgress(payload)
  }

  function saveEpisodeProgress(
    mediaId: string,
    seasonIndex: number,
    episodeIndex: number,
    time: number,
    duration: number,
    forceImmediateSync = false
  ) {
    const key = getProgressKey(mediaId, seasonIndex, episodeIndex)
    const completed = duration > 0 && (time / duration >= 0.90 || time >= duration - 10)

    // Atualização imediata em memória (reativa e instantânea para a UI)
    progressMap.value[key] = {
      mediaId,
      seasonIndex,
      episodeIndex,
      time,
      duration,
      completed,
      updatedAt: Date.now()
    }

    const now = Date.now()

    // 1. Gravação no LocalStorage com throttle de 3s (evita sobrecarga de JSON.stringify a cada frame)
    if (forceImmediateSync || completed || now - lastLocalStorageSaveTime >= 3000) {
      lastLocalStorageSaveTime = now
      try {
        localStorage.setItem('capyflix_progress', JSON.stringify(progressMap.value))
      } catch {
        // ignore quota
      }
    }

    // 2. Registra o payload pendente para envio ao backend
    pendingSyncPayload = {
      media_id: mediaId,
      season_index: seasonIndex,
      episode_index: episodeIndex,
      time: Math.round(time),
      duration: Math.round(duration),
      completed
    }

    // 3. Se for conclusão ou pedido de sincronização imediata, dispara agora
    if (forceImmediateSync || completed) {
      flushProgressSync()
      return
    }

    // 4. Sincronização periódica com a API a cada 15 segundos de vídeo contínuo
    if (now - lastBackendSyncTime >= 15000) {
      flushProgressSync()
    } else if (!syncDebounceTimer) {
      const remainingTime = Math.max(1000, 15000 - (now - lastBackendSyncTime))
      syncDebounceTimer = setTimeout(() => {
        flushProgressSync()
      }, remainingTime)
    }
  }

  // Continuar Assistindo (ordena por mais recente)
  const continueWatching = computed(() => {
    const entries = Object.values(progressMap.value)
      .filter(p => !p.completed && p.time > 15) // assistiu mais de 15 segundos e ainda não concluiu
      .sort((a, b) => b.updatedAt - a.updatedAt)

    const result: { media: MediaItem; progress: WatchProgress }[] = []
    const seenMedia = new Set<string>()

    for (const p of entries) {
      if (seenMedia.has(p.mediaId)) continue
      const item = catalog.value.find(m => m.id === p.mediaId || m.slug === p.mediaId)
      if (item) {
        seenMedia.add(p.mediaId)
        result.push({ media: item, progress: p })
      }
    }

    return result
  })

  // Meus Favoritos
  const favoriteMedia = computed(() => {
    return catalog.value.filter(m => favorites.value.includes(m.id))
  })

  // Destaques / Em Alta
  const featuredMedia = computed(() => {
    return catalog.value.filter(m => m.isFeatured || m.isNew)
  })

  // Listas por tipo
  const animes = computed(() => catalog.value.filter(m => m.type === 'anime'))
  const movies = computed(() => catalog.value.filter(m => m.type === 'movie'))
  const cartoons = computed(() => catalog.value.filter(m => m.type === 'cartoon'))

  // Configuração Fuse.js para busca instantânea estilo Akira Nolan
  const fuse = computed(() => {
    return new Fuse(catalog.value, {
      keys: ['title', 'originalTitle', 'genres', 'synopsis'],
      threshold: 0.35,
      includeScore: true
    })
  })

  function search(query: string): MediaItem[] {
    if (!query || query.trim() === '') {
      return catalog.value
    }
    return fuse.value.search(query.trim()).map(res => res.item)
  }

  function getMediaBySlug(slug: string): MediaItem | undefined {
    return catalog.value.find(m => m.slug === slug || m.id === slug)
  }

  return {
    catalog,
    favorites,
    continueWatching,
    favoriteMedia,
    featuredMedia,
    animes,
    movies,
    cartoons,
    search,
    getMediaBySlug,
    toggleFavorite,
    isFavorite,
    getEpisodeProgress,
    saveEpisodeProgress,
    flushProgressSync
  }
})
