/**
 * Stream Resolver para CapyFlix
 * 
 * Gerencia as fontes de reprodução com prioridade:
 * 1. Arquivo Local (NAS)
 * 2. CDN Direta / Debrid (HLS / MP4 limpo)
 * 3. Embed Universal (VidSrc, MultiEmbed, AutoEmbed via TMDB ID)
 */

export type StreamSourceType = 'local' | 'cdn' | 'embed'

export interface StreamSourceOption {
  id: string
  name: string
  type: StreamSourceType
  url: string
  badge: string
  isDirectVideo: boolean // true = toca no VideoPlayer HTML5, false = toca em EmbedPlayer (iframe)
}

export interface ResolveParams {
  tmdbId?: number
  imdbId?: string
  mediaType: 'movie' | 'anime' | 'cartoon' | 'series'
  season?: number
  episode?: number
  localStreamUrl?: string
}

export function resolveStreamSources(params: ResolveParams): StreamSourceOption[] {
  const sources: StreamSourceOption[] = []
  const { tmdbId, mediaType, season = 1, episode = 1, localStreamUrl } = params

  // 1. Fonte Local (NAS) ou CDN direta existente no catálogo
  if (localStreamUrl && localStreamUrl.trim() !== '') {
    const isLocalNas = localStreamUrl.startsWith('/local-media/') || localStreamUrl.includes(':8096') || localStreamUrl.includes('192.168.')
    sources.push({
      id: 'local-native',
      name: isLocalNas ? 'Servidor Local (NAS)' : 'Acervo CapyFlix (CDN)',
      type: isLocalNas ? 'local' : 'cdn',
      url: localStreamUrl,
      badge: isLocalNas ? 'LOCAL • MAX' : 'ALTA VELOCIDADE',
      isDirectVideo: true
    })
  }

  // Apenas fontes diretas de vídeo (sem iframes, sem anúncios)
  return sources
}
