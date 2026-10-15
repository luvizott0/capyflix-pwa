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

  // 2. Embeds Universais baseados no TMDB ID (para filmes e séries)
  if (tmdbId) {
    const isMovie = mediaType === 'movie'

    // Provedor 1: VidSrc (Suporte PT-BR integrado)
    const vidsrcUrl = isMovie
      ? `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}&ds_lang=pt`
      : `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}&ds_lang=pt`

    sources.push({
      id: 'embed-vidsrc',
      name: 'VidSrc (Servidor Principal)',
      type: 'embed',
      url: vidsrcUrl,
      badge: 'WEB STREAM',
      isDirectVideo: false
    })

    // Provedor 2: SuperEmbed / MultiEmbed
    const multiEmbedUrl = isMovie
      ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`
      : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`

    sources.push({
      id: 'embed-multiembed',
      name: 'MultiEmbed (Alternativo 1)',
      type: 'embed',
      url: multiEmbedUrl,
      badge: 'WEB BACKUP',
      isDirectVideo: false
    })

    // Provedor 3: AutoEmbed
    const autoEmbedUrl = isMovie
      ? `https://player.autoembed.cc/embed/movie/${tmdbId}`
      : `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`

    sources.push({
      id: 'embed-autoembed',
      name: 'AutoEmbed (Alternativo 2)',
      type: 'embed',
      url: autoEmbedUrl,
      badge: 'WEB BACKUP',
      isDirectVideo: false
    })
  }

  return sources
}
