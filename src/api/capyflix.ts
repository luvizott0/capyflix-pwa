import apiClient from './client'

export interface StorageStatus {
  media_root: string
  total_bytes: number
  total_formatted: string
  max_bytes: number
  max_formatted: string
  free_bytes: number
  free_formatted: string
  percent_used: number
  is_near_limit: boolean
  is_exceeded: boolean
  file_count: number
  files: Array<{
    name: string
    relative_path: string
    size: number
    size_formatted: string
    modified_at: string
    category: 'movie' | 'series' | 'other'
  }>
}

export interface DownloadTask {
  id: string
  title: string
  media_type: 'movie' | 'series' | 'anime' | 'cartoon'
  season: number
  episode: number
  file_name: string
  target_path: string
  url: string
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'pending_source'
  progress: number
  downloaded_bytes: number
  total_bytes: number
  created_at: string
  error: string | null
  engine?: 'http' | 'qbittorrent'
  dlspeed_formatted?: string
  num_seeds?: number
}

export interface DebridConfig {
  provider: 'torbox' | 'realdebrid'
  has_token: boolean
  masked_token: string | null
}

export interface QBittorrentStatus {
  enabled: boolean
  available: boolean
  version: string | null
  host: string
  port: number
  base_url: string
}

export interface MediaStatusResponse {
  title: string
  media_type: string
  season: number
  is_downloaded: boolean
  downloaded_episodes: number[]
  active_downloads: Array<{
    id: string
    season: number
    episode: number
    status: 'queued' | 'downloading' | 'completed' | 'failed' | 'pending_source'
    progress: number
    engine?: 'http' | 'qbittorrent'
    dlspeed_formatted?: string
    num_seeds?: number
  }>
  debrid_configured: boolean
  qbittorrent_available?: boolean
}

export interface BatchDownloadResponse {
  success: boolean
  message: string
  result: {
    success: boolean
    queued_count: number
    skipped_count: number
    queued: DownloadTask[]
    skipped: Array<{
      season: number
      episode: number
      reason: string
      message: string
    }>
  }
}

export const capyFlixApi = {
  async getStorageStatus(): Promise<StorageStatus> {
    const { data } = await apiClient.get<StorageStatus>('/capyflix/storage')
    return data
  },

  async deleteStorageFile(path: string): Promise<boolean> {
    const { data } = await apiClient.delete('/capyflix/file', { data: { path } })
    return data.success
  },

  async getDownloads(): Promise<DownloadTask[]> {
    const { data } = await apiClient.get<{ downloads: DownloadTask[] }>('/capyflix/downloads')
    return data.downloads || []
  },

  async getMediaStatus(params: {
    title: string
    media_type: string
    season?: number
  }): Promise<MediaStatusResponse> {
    const { data } = await apiClient.get<MediaStatusResponse>('/capyflix/media-status', { params })
    return data
  },

  async startDownload(payload: {
    title: string
    media_type: string
    season?: number
    episode?: number
    url?: string
    magnet?: string
    info_hash?: string
    expected_bytes?: number
    preferred_audio?: 'dub' | 'sub' | 'any_pt' | 'any'
    is_animation?: boolean
  }): Promise<{ success: boolean; task: DownloadTask; message: string }> {
    const { data } = await apiClient.post('/capyflix/download', payload)
    return data
  },

  async batchDownload(payload: {
    title: string
    media_type: string
    season?: number
    episodes?: number[]
    tmdb_id?: number
    imdb_id?: string
    url?: string
    magnet?: string
    info_hash?: string
    preferred_audio?: 'dub' | 'sub' | 'any_pt' | 'any'
    is_animation?: boolean
    block_foreign?: boolean
  }): Promise<BatchDownloadResponse> {
    const { data } = await apiClient.post<BatchDownloadResponse>('/capyflix/batch-download', payload)
    return data
  },

  async cancelDownload(id: string): Promise<boolean> {
    const { data } = await apiClient.delete(`/capyflix/download/${id}`)
    return data.success
  },

  async resolveRemoteStreams(params: {
    tmdb_id?: number
    imdb_id?: string
    title?: string
    media_type: string
    season?: number
    episode?: number
    token?: string
    provider?: string
    preferred_audio?: string
    is_animation?: boolean
    genres?: string[]
    include_p2p?: boolean
    block_foreign?: boolean
  }): Promise<{ streams: any[]; debrid_configured: boolean }> {
    const { data } = await apiClient.get('/capyflix/resolve-streams', { params })
    return data
  },

  async getDebridConfig(): Promise<DebridConfig> {
    const { data } = await apiClient.get<DebridConfig>('/capyflix/debrid-config')
    return data
  },

  async saveDebridConfig(payload: {
    provider: 'torbox' | 'realdebrid'
    token: string
  }): Promise<{ success: boolean; config: DebridConfig; message: string }> {
    const { data } = await apiClient.post('/capyflix/debrid-config', payload)
    return data
  },

  async getQBittorrentStatus(): Promise<QBittorrentStatus> {
    const { data } = await apiClient.get<QBittorrentStatus>('/capyflix/qbittorrent-status')
    return data
  }
}
