export type MediaType = 'anime' | 'movie' | 'series' | 'cartoon'

export interface Episode {
  id: string
  name: string
  number: number
  seasonNumber?: number
  stillUrl?: string
  streamUrl: string
  fallbackUrl?: string
  duration?: number
}

export interface Season {
  name: string
  episodes: Episode[]
}

export interface MediaItem {
  id: string
  slug: string
  tmdbId?: number
  title: string
  originalTitle?: string
  type: MediaType
  poster: string
  backdrop?: string
  synopsis: string
  genres: string[]
  year?: number | string
  rating?: number
  isDubbed?: boolean
  isSubbed?: boolean
  isNew?: boolean
  isFeatured?: boolean
  seasons: Season[]
}

export interface WatchProgress {
  mediaId: string
  seasonIndex: number
  episodeIndex: number
  time: number
  duration: number
  completed: boolean
  updatedAt: number
}
