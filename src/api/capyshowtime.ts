import apiClient from './client'

export interface CommentUser {
  id: number
  name: string
  username: string
  avatar_url?: string
}

export interface EpisodeComment {
  id: number
  user: CommentUser
  content: string
  is_spoiler: boolean
  created_at: string
  updated_at?: string
  likes_count: number
  liked_by_me: boolean
}

export const capyShowTimeApi = {
  /**
   * Sincroniza o episódio assistido com o CapyShowTime
   */
  async syncWatch(tmdbId: number, seasonNumber: number, episodeNumber: number, isWatched: boolean = true) {
    try {
      const res = await apiClient.post('/capyshowtime/episodes/sync-watch', {
        tmdb_id: tmdbId,
        season_number: seasonNumber,
        episode_number: episodeNumber,
        is_watched: isWatched
      })
      return res.data
    } catch (err) {
      console.warn('[CapyFlix] Falha ao sincronizar com CapyShowTime:', err)
      return null
    }
  },

  /**
   * Busca todo o histórico de progresso de visualização do usuário no banco de dados
   */
  async getWatchProgress(): Promise<any[]> {
    try {
      const res = await apiClient.get('/capyshowtime/watch-progress')
      return Array.isArray(res.data) ? res.data : []
    } catch (err) {
      return []
    }
  },

  /**
   * Salva o progresso de visualização do vídeo/episódio no banco de dados
   */
  async saveWatchProgress(payload: {
    media_id: string
    season_index: number
    episode_index: number
    time: number
    duration: number
    completed?: boolean
  }) {
    try {
      const res = await apiClient.post('/capyshowtime/watch-progress', payload)
      return res.data
    } catch (err) {
      // offline ou api indisponível
      return null
    }
  },

  /**
   * Carrega os comentários do episódio
   */
  async getEpisodeComments(episodeId: number): Promise<EpisodeComment[]> {
    const res = await apiClient.get(`/capyshowtime/episodes/${episodeId}/comments`)
    return res.data
  },

  /**
   * Adiciona um novo comentário
   */
  async addEpisodeComment(episodeId: number, content: string, isSpoiler: boolean = false): Promise<EpisodeComment> {
    const res = await apiClient.post('/capyshowtime/episodes/comments', {
      episode_id: episodeId,
      content,
      is_spoiler: isSpoiler
    })
    return res.data
  },

  /**
   * Edita o próprio comentário
   */
  async updateComment(commentId: number, content: string, isSpoiler: boolean = false): Promise<EpisodeComment> {
    const res = await apiClient.put(`/capyshowtime/comments/${commentId}`, {
      content,
      is_spoiler: isSpoiler
    })
    return res.data
  },

  /**
   * Exclui o próprio comentário
   */
  async deleteComment(commentId: number): Promise<{ message: string }> {
    const res = await apiClient.delete(`/capyshowtime/comments/${commentId}`)
    return res.data
  },

  /**
   * Alterna curtida em um comentário
   */
  async toggleCommentLike(commentId: number): Promise<{ liked: boolean; likes_count: number }> {
    const res = await apiClient.post(`/capyshowtime/comments/${commentId}/like`)
    return res.data
  },

  /**
   * O que os amigos da CapiHouse estão assistindo atualmente
   */
  async getFriendsWatching(): Promise<FriendWatchingItem[]> {
    try {
      const res = await apiClient.get('/capyshowtime/friends-watching')
      return res.data
    } catch {
      try {
        const resPublic = await apiClient.get('/capyshowtime/public/friends-watching')
        return resPublic.data
      } catch {
        return []
      }
    }
  },

  /**
   * Séries preferidas e melhores avaliadas pelos amigos da CapiHouse
   */
  async getFriendsTopRated(): Promise<FriendTopRatedItem[]> {
    try {
      const res = await apiClient.get('/capyshowtime/friends-top-rated')
      return res.data
    } catch {
      try {
        const resPublic = await apiClient.get('/capyshowtime/public/friends-top-rated')
        return resPublic.data
      } catch {
        return []
      }
    }
  },

  /**
   * Séries em alta nesta semana
   */
  async getTrending(): Promise<TrendingSeriesItem[]> {
    try {
      const res = await apiClient.get('/capyshowtime/trending')
      return res.data
    } catch {
      try {
        const resPublic = await apiClient.get('/capyshowtime/public/trending')
        return resPublic.data
      } catch {
        return []
      }
    }
  }
}

export interface FriendWatchingItem {
  series_id: number
  tmdb_id: number
  title: string
  poster_url?: string
  backdrop_url?: string
  vote_average?: number
  latest_episode?: {
    season: number
    episode: number
    name: string
  }
  last_watched_at: string
  friends: CommentUser[]
}

export interface FriendTopRatedItem {
  series_id: number
  tmdb_id: number
  title: string
  poster_url?: string
  backdrop_url?: string
  genres?: string[]
  friends_rating: number
  ratings_count: number
  friends: CommentUser[]
}

export interface TrendingSeriesItem {
  id: number
  name: string
  original_name?: string
  overview?: string
  poster_path?: string
  backdrop_path?: string
  vote_average?: number
  first_air_date?: string
}

