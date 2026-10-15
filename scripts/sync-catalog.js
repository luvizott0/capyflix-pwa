/**
 * CapyFlix Catalog Synchronizer & Stream Validator
 * 
 * 1. Escaneia arquivos locais do NAS (/mnt/capyflix).
 * 2. Importa e valida streams remotos (Akira Nolan / Internet Archive).
 * 3. Enriquece metadados automaticamente via API TheMovieDB (TMDB).
 * 4. Valida streams ativos via HTTP Range Requests (elimina links quebrados).
 * 5. Salva em public/catalog.json.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configurações
const TMDB_API_KEY = process.env.TMDB_API_KEY || '9460fe099c4cb1ca3026582f448e9d29'
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const LOCAL_MEDIA_DIR = process.env.MEDIA_FOLDER ||
  (fs.existsSync('/mnt/capyflix') ? '/mnt/capyflix' : (fs.existsSync('X:\\') ? 'X:\\' : '/mnt/capyflix'))
const OUTPUT_FILE = path.resolve(__dirname, '../public/catalog.json')
const AKIRA_CATALOG_URL = 'https://akiranolan.pages.dev/animes.json'
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.webm', '.avi', '.m4v'])
const CATEGORY_NAMES = new Set(['filmes', 'movies', 'series', 'séries', 'animes', 'anime', 'desenhos', 'tv'])

const axiosClient = axios.create({
  timeout: 5000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CapyFlix-Bot/1.0'
  }
})

// Utilitário para limpar nomes e extrair dados
function sanitizeSlug(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// 1. Validador de Links de Streaming via HTTP Range
async function testStreamUrl(url) {
  if (!url || typeof url !== 'string') return false
  if (url.startsWith('/local-media/')) return true // Mídia local sempre válida

  try {
    const res = await axiosClient.get(url, {
      headers: { Range: 'bytes=0-10' },
      timeout: 3500,
      maxRedirects: 5,
      validateStatus: (status) => status === 200 || status === 206
    })
    return res.status === 200 || res.status === 206
  } catch (err) {
    return false
  }
}

// 2. Consulta à API do TMDB para enriquecimento
async function fetchTmdbMetadata(title, isMovie = false) {
  if (!TMDB_API_KEY) return null

  const queries = [
    title.replace(/\s*\(\d{4}\)/, '').trim(),
    title
  ]

  // Casos específicos de títulos populares
  if (title.toLowerCase().includes('lenda de aang')) {
    queries.push('Avatar O Ultimo Mestre do Ar')
  }

  for (const q of queries) {
    try {
      const endpoint = isMovie ? '/search/movie' : '/search/tv'
      const res = await axiosClient.get(`${TMDB_BASE_URL}${endpoint}`, {
        params: {
          api_key: TMDB_API_KEY,
          query: q,
          language: 'pt-BR'
        }
      })

      const results = res.data?.results
      if (results && results.length > 0) {
        const item = results[0]
        return {
          tmdbId: item.id,
          title: item.title || item.name,
          originalTitle: item.original_title || item.original_name,
          synopsis: item.overview || '',
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : null,
          backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
          year: (item.release_date || item.first_air_date || '').substring(0, 4),
          rating: item.vote_average || 0
        }
      }
    } catch (err) {
      // continue to next query
    }
  }

  return null
}

function parseSeasonEpisode(fileName, parts) {
  let sMatch = fileName.match(/(?:s|season|temp|temporada)\s*(\d{1,2})[\s._-]*(?:e|ep|episodio)\s*(\d{1,3})/i) ||
               fileName.match(/(\d{1,2})x(\d{1,3})/i)
  let seasonNum = null
  let epNum = null
  let epTitle = ''
  let bookLabel = null

  if (sMatch) {
    seasonNum = parseInt(sMatch[1], 10)
    epNum = parseInt(sMatch[2], 10)
  }

  for (const part of parts) {
    const bookMatch = part.match(/(?:livro|book)\s*(\d{1,2})/i)
    if (bookMatch) {
      if (seasonNum === null) seasonNum = parseInt(bookMatch[1], 10)
      bookLabel = `Livro ${bookMatch[1]}`
      break
    }
    const tempMatch = part.match(/(?:temporada|season|temp)\s*(\d{1,2})/i)
    if (tempMatch) {
      if (seasonNum === null) seasonNum = parseInt(tempMatch[1], 10)
      break
    }
  }

  if (epNum === null) {
    const epMatch = fileName.match(/(?:e|ep|episodio)\s*(\d{1,3})/i) ||
                    fileName.match(/^(\d{1,3})\.[a-z0-9]+$/i) ||
                    fileName.match(/[\s._-](\d{1,3})\.[a-z0-9]+$/i)
    if (epMatch) epNum = parseInt(epMatch[1], 10)
  }

  if (seasonNum === null) seasonNum = 1
  if (epNum === null) epNum = 1

  const nameMatch = fileName.match(/(?:\d+x\d+|\bS\d+E\d+\b)\s*[-_]\s*(.+?)\.[a-z0-9]+$/i)
  if (nameMatch) {
    epTitle = nameMatch[1].trim()
  } else {
    epTitle = `Episódio ${String(epNum).padStart(2, '0')}`
  }

  const seasonName = bookLabel ? bookLabel : `${seasonNum}ª Temporada`
  return { seasonNum, epNum, epTitle, seasonName }
}

// 3. Escanear Mídias Locais do NAS Futebol
async function scanLocalMedia(baseDir) {
  const localItems = []
  if (!fs.existsSync(baseDir)) {
    console.log(`[Local Media] Pasta "${baseDir}" não encontrada. Ignorando scan local.`)
    return localItems
  }

  console.log(`[Local Media] Escaneando arquivos em: ${baseDir}`)

  function walkDir(dir) {
    let files = []
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          files = files.concat(walkDir(fullPath))
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          if (VIDEO_EXTENSIONS.has(ext)) {
            files.push(fullPath)
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return files
  }

  const allVideoFiles = walkDir(baseDir)
  console.log(`[Local Media] Encontrados ${allVideoFiles.length} arquivos de vídeo locais.`)

  // Agrupar arquivos por título da série/filme
  const titleGroups = new Map()

  for (const filePath of allVideoFiles) {
    const rel = path.relative(baseDir, filePath)
    const parts = rel.split(/[/\\]/).filter(Boolean)
    if (parts.length === 0) continue

    let category = null
    let title = ''
    let isMovie = false

    const firstPartNorm = parts[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

    if (CATEGORY_NAMES.has(firstPartNorm)) {
      category = firstPartNorm
      if (category === 'filmes' || category === 'movies') {
        isMovie = true
        if (parts.length === 2) {
          title = path.parse(parts[1]).name
        } else {
          title = parts[1]
        }
      } else {
        title = parts[1]
      }
    } else {
      if (parts.length === 1) {
        isMovie = true
        title = path.parse(parts[0]).name
      } else {
        title = parts[0]
      }
    }

    if (isMovie) {
      title = title.replace(/\s*\(\d{3,4}p[^\)]*\)/i, '').replace(/\s*\[\d{3,4}p[^\]]*\]/i, '').trim()
    }

    if (!titleGroups.has(title)) {
      titleGroups.set(title, { title, isMovie, category, files: [] })
    }
    titleGroups.get(title).files.push({
      fullPath: filePath,
      parts,
      relativePath: parts.join('/'),
      fileName: path.basename(filePath)
    })
  }

  for (const [groupTitle, groupData] of titleGroups.entries()) {
    const { isMovie, files, category } = groupData
    console.log(`[Local Media] Processando "${groupTitle}" (${files.length} arquivos, isMovie=${isMovie})...`)

    const tmdbData = await fetchTmdbMetadata(groupTitle, isMovie)
    const titleSlug = sanitizeSlug(groupTitle)

    let seasons = []

    if (isMovie) {
      const f = files[0]
      const streamUrl = `/local-media/${f.parts.map(encodeURIComponent).join('/')}`
      seasons = [
        {
          name: 'Filme Completo',
          episodes: [
            {
              id: `${titleSlug}-filme`,
              name: tmdbData?.title || groupTitle,
              number: 1,
              streamUrl
            }
          ]
        }
      ]
    } else {
      const seasonsMap = new Map()
      const seenEpisodes = new Set()

      for (const f of files) {
        const { seasonNum, epNum, epTitle, seasonName } = parseSeasonEpisode(f.fileName, f.parts)
        const epKey = `${seasonNum}_${epNum}`
        if (seenEpisodes.has(epKey)) continue
        seenEpisodes.add(epKey)

        if (!seasonsMap.has(seasonName)) {
          seasonsMap.set(seasonName, [])
        }

        const streamUrl = `/local-media/${f.parts.map(encodeURIComponent).join('/')}`
        seasonsMap.get(seasonName).push({
          id: `${titleSlug}-s${seasonNum}-e${epNum}`,
          name: epTitle,
          number: epNum,
          streamUrl
        })
      }

      for (const [sName, epList] of seasonsMap.entries()) {
        epList.sort((a, b) => a.number - b.number)
        seasons.push({ name: sName, episodes: epList })
      }
    }

    let mediaType = isMovie ? 'movie' : 'anime'
    if (!isMovie && (category === 'desenhos' || groupTitle.toLowerCase().includes('caverna do drag'))) {
      mediaType = 'cartoon'
    }

    localItems.push({
      id: sanitizeSlug(`local-${groupTitle}`),
      slug: titleSlug,
      tmdbId: tmdbData?.tmdbId,
      title: tmdbData?.title || groupTitle,
      originalTitle: tmdbData?.originalTitle || '',
      type: mediaType,
      poster: tmdbData?.poster || '/capy-icon.svg',
      backdrop: tmdbData?.backdrop || '',
      synopsis: tmdbData?.synopsis || 'Disponível localmente no acervo do Homelab com streaming instantâneo.',
      genres: ['Local Homelab', 'Full HD', isMovie ? 'Filme' : 'Série'],
      year: tmdbData?.year || '',
      rating: tmdbData?.rating || 8.8,
      isDubbed: true,
      isSubbed: false,
      isNew: true,
      isFeatured: true,
      seasons
    })

    console.log(`[Local Media] ✓ "${tmdbData?.title || groupTitle}" integrado com sucesso (${seasons.length} temporadas / ${seasons.reduce((acc, s) => acc + s.episodes.length, 0)} episódios)!`)
  }

  return localItems
}

// 4. Importar e Validar Acervo da Nuvem (Akira Nolan)
async function importAkiraCatalog(animeLimit = 35) {
  const remoteItems = []
  console.log('[Remote Sync] Baixando catálogo remoto de animes e desenhos...')

  try {
    const res = await axiosClient.get(AKIRA_CATALOG_URL)
    const rawList = res.data
    if (!Array.isArray(rawList)) return remoteItems

    const validList = rawList.filter(item => item.link && !item.link.startsWith('http') && item.tipo !== 'none')

    // 1. Incluir todos os desenhos/cartoons (Hora de Aventura, Jovens Titãs, Batman, etc.)
    const cartoons = validList.filter(item => item.tipo && item.tipo.includes('cartoon'))
    
    // 2. Incluir animes populares
    const animes = validList.filter(item => !item.tipo || !item.tipo.includes('cartoon')).slice(0, animeLimit)

    const selected = [...cartoons, ...animes]

    console.log(`[Remote Sync] Processando ${selected.length} títulos (${cartoons.length} desenhos + ${animes.length} animes) com validação de stream...`)

    for (const item of selected) {
      try {
        const pageUrl = `https://akiranolan.pages.dev/${item.link}`
        const pageRes = await axiosClient.get(pageUrl)
        const html = pageRes.data

        // Extrai bloco animeData = [...]
        const dataMatch = html.match(/const\s+animeData\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/)
        if (!dataMatch) continue

        let parsedSeasons = []
        try {
          // Eval seguro via Function para parsear o literal JS
          parsedSeasons = new Function(`return ${dataMatch[1]}`)()
        } catch (e) {
          continue
        }

        if (!Array.isArray(parsedSeasons) || parsedSeasons.length === 0) continue

        // Validar se o primeiro episódio está ativo
        const firstEp = parsedSeasons[0]?.episodes?.[0]
        if (!firstEp || !firstEp.url) continue

        const isOnline = await testStreamUrl(firstEp.url)
        if (!isOnline) {
          console.log(`[Remote Sync] ⚠️ Stream offline ou bloqueado para: ${item.titulo}. Pulando.`)
          continue
        }

        // Metadados TMDB
        const isMovie = item.tipo?.includes('movie') || false
        const tmdb = await fetchTmdbMetadata(item.titulo, isMovie)

        const seasons = parsedSeasons.map((s, sIdx) => ({
          name: s.name || `Temporada ${sIdx + 1}`,
          episodes: (s.episodes || []).map((ep, eIdx) => ({
            id: sanitizeSlug(`${item.link}-s${sIdx + 1}-e${eIdx + 1}`),
            name: ep.name || `Episódio ${String(eIdx + 1).padStart(2, '0')}`,
            number: eIdx + 1,
            streamUrl: ep.url
          }))
        }))

        const mediaType = item.tipo?.includes('movie')
          ? 'movie'
          : (item.tipo?.includes('cartoon') ? 'cartoon' : 'anime')

        remoteItems.push({
          id: sanitizeSlug(item.link),
          slug: sanitizeSlug(item.link),
          tmdbId: tmdb?.tmdbId,
          title: tmdb?.title || item.titulo,
          originalTitle: tmdb?.originalTitle || item.alt || '',
          type: mediaType,
          poster: tmdb?.poster || item.imagem || '/capy-icon.svg',
          backdrop: tmdb?.backdrop || item.imagem || '',
          synopsis: tmdb?.synopsis || (mediaType === 'cartoon' ? 'Desenho animado clássico dublado disponível no CapyFlix.' : 'Anime em alta definição disponível no CapyFlix.'),
          genres: (item.generos && item.generos.length > 0)
            ? item.generos.map(g => g.toUpperCase())
            : ['FULL HD', mediaType === 'cartoon' ? 'DESENHO' : 'ANIME'],
          year: tmdb?.year || '',
          rating: tmdb?.rating || 8.2,
          isDubbed: (item.generos || []).includes('dub') || mediaType === 'cartoon',
          isSubbed: (item.generos || []).includes('leg'),
          isFeatured: (item.generos || []).includes('recente') || (item.tipo || '').includes('new'),
          seasons
        })

        console.log(`[Remote Sync] ✓ ${tmdb?.title || item.titulo} validado com sucesso (${seasons.length} temporadas / ${seasons.reduce((acc, s) => acc + s.episodes.length, 0)} eps)!`)
      } catch (err) {
        // ignora falha de página individual
      }
    }
  } catch (err) {
    console.error('[Remote Sync] Falha ao carregar catálogo remoto:', err.message)
  }

  return remoteItems
}

// 5. Execução Principal
async function run() {
  console.log('====================================================')
  console.log('🦫  CapyFlix • Sincronizador de Mídia & Catálogo')
  console.log('====================================================')

  const localItems = await scanLocalMedia(LOCAL_MEDIA_DIR)
  const remoteItems = await importAkiraCatalog(35)

  // Mesclar catálogos sem duplicidade de slug
  const catalogMap = new Map()

  for (const item of localItems) {
    catalogMap.set(item.slug, item)
  }

  for (const item of remoteItems) {
    if (!catalogMap.has(item.slug)) {
      catalogMap.set(item.slug, item)
    }
  }

  const finalCatalog = Array.from(catalogMap.values())

  // Salvar em public/catalog.json
  const outDir = path.dirname(OUTPUT_FILE)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalCatalog, null, 2), 'utf-8')

  // Salvar também em src/data/initialCatalog.ts
  const initialCatalogPath = path.resolve(__dirname, '../src/data/initialCatalog.ts')
  const tsContent = `import type { MediaItem } from '@/types/media'\n\nexport const initialCatalog: MediaItem[] = ${JSON.stringify(finalCatalog, null, 2)}\n`
  fs.writeFileSync(initialCatalogPath, tsContent, 'utf-8')

  console.log('====================================================')
  console.log(`🎉 Sucesso! Catálogo gerado com ${finalCatalog.length} títulos validados.`)
  console.log(`📁 Arquivos salvos em:\n  - ${OUTPUT_FILE}\n  - ${initialCatalogPath}`)
  console.log('====================================================')
}

run().catch(err => {
  console.error('Erro na execução do sincronizador:', err)
  process.exit(1)
})
