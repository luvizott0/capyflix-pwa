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
}

export interface DebridConfig {
  provider: 'torbox' | 'realdebrid'
  has_token: boolean
  masked_token: string | null
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

  async startDownload(payload: {
    title: string
    media_type: string
    season?: number
    episode?: number
    url?: string
    expected_bytes?: number
  }): Promise<{ success: boolean; task: DownloadTask; message: string }> {
    const { data } = await apiClient.post('/capyflix/download', payload)
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
  }
}
