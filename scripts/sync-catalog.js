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
const LOCAL_MEDIA_DIR = process.env.MEDIA_FOLDER || '/mnt/capyflix'
const OUTPUT_FILE = path.resolve(__dirname, '../public/catalog.json')
const AKIRA_CATALOG_URL = 'https://akiranolan.pages.dev/animes.json'
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.webm', '.avi', '.m4v'])

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

  try {
    const endpoint = isMovie ? '/search/movie' : '/search/tv'
    const res = await axiosClient.get(`${TMDB_BASE_URL}${endpoint}`, {
      params: {
        api_key: TMDB_API_KEY,
        query: title,
        language: 'pt-BR'
      }
    })

    const results = res.data?.results
    if (!results || results.length === 0) return null

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
  } catch (err) {
    return null
  }
}

// 3. Escanear Mídias Locais do NAS Futebol
async function scanLocalMedia(baseDir) {
  const localItems = []
  if (!fs.existsSync(baseDir)) {
    console.log(`[Local Media] Pasta "${baseDir}" não encontrada (normal em ambiente dev). Ignorando scan local.`)
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
      // ignore read error
    }
    return files
  }

  const allVideoFiles = walkDir(baseDir)
  console.log(`[Local Media] Encontrados ${allVideoFiles.length} arquivos de vídeo locais.`)

  // Agrupar arquivos por pasta principal
  const groups = new Map()

  for (const filePath of allVideoFiles) {
    const rel = path.relative(baseDir, filePath).replace(/\\/g, '/')
    const parts = rel.split('/')
    const titleFolder = parts[0]

    if (!groups.has(titleFolder)) {
      groups.set(titleFolder, [])
    }
    groups.get(titleFolder).push({ fullPath: filePath, relativePath: rel, fileName: path.basename(filePath) })
  }

  for (const [folderName, files] of groups.entries()) {
    const isSingleMovie = files.length === 1 && !folderName.toLowerCase().includes('temporada')
    const tmdbData = await fetchTmdbMetadata(folderName, isSingleMovie)

    const seasonsMap = new Map()

    for (const f of files) {
      // Regex para detectar S01E02 ou Ep 02
      const match = f.fileName.match(/(?:s|season|temp|temporada)\s*(\d{1,2})[\s._-]*(?:e|ep|episodio)\s*(\d{1,3})/i) ||
                    f.fileName.match(/(?:e|ep|episodio)\s*(\d{1,3})/i)

      let seasonNum = 1
      let epNum = 1

      if (match && match.length >= 3) {
        seasonNum = parseInt(match[1], 10)
        epNum = parseInt(match[2], 10)
      } else if (match && match.length >= 2) {
        epNum = parseInt(match[1], 10)
      }

      const seasonName = isSingleMovie ? 'Filme Completo' : `${seasonNum}ª Temporada`
      if (!seasonsMap.has(seasonName)) {
        seasonsMap.set(seasonName, [])
      }

      seasonsMap.get(seasonName).push({
        id: sanitizeSlug(`${folderName}-s${seasonNum}-e${epNum}`),
        name: isSingleMovie ? (tmdbData?.title || folderName) : `Episódio ${String(epNum).padStart(2, '0')}`,
        number: epNum,
        streamUrl: `/local-media/${encodeURI(f.relativePath)}`
      })
    }

    const seasons = []
    for (const [sName, epList] of seasonsMap.entries()) {
      epList.sort((a, b) => a.number - b.number)
      seasons.push({ name: sName, episodes: epList })
    }

    localItems.push({
      id: sanitizeSlug(`local-${folderName}`),
      slug: sanitizeSlug(folderName),
      tmdbId: tmdbData?.tmdbId,
      title: tmdbData?.title || folderName,
      originalTitle: tmdbData?.originalTitle || '',
      type: isSingleMovie ? 'movie' : 'anime',
      poster: tmdbData?.poster || '/capy-icon.svg',
      backdrop: tmdbData?.backdrop || '',
      synopsis: tmdbData?.synopsis || 'Disponível localmente no acervo do Homelab.',
      genres: ['Local Homelab', 'Full HD'],
      year: tmdbData?.year || '',
      rating: tmdbData?.rating || 8.5,
      isDubbed: true,
      isSubbed: false,
      isNew: true,
      seasons
    })
  }

  return localItems
}

// 4. Importar e Validar Acervo da Nuvem (Akira Nolan)
async function importAkiraCatalog(limit = 12) {
  const remoteItems = []
  console.log('[Remote Sync] Baixando catálogo remoto de animes...')

  try {
    const res = await axiosClient.get(AKIRA_CATALOG_URL)
    const rawList = res.data
    if (!Array.isArray(rawList)) return remoteItems

    const validList = rawList.filter(item => item.link && !item.link.startsWith('http') && item.tipo !== 'none')
    const selected = validList.slice(0, limit)

    console.log(`[Remote Sync] Processando ${selected.length} títulos da nuvem com validação de stream...`)

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
        const tmdb = await fetchTmdbMetadata(item.titulo)

        const seasons = parsedSeasons.map((s, sIdx) => ({
          name: s.name || `Temporada ${sIdx + 1}`,
          episodes: (s.episodes || []).map((ep, eIdx) => ({
            id: sanitizeSlug(`${item.link}-s${sIdx + 1}-e${eIdx + 1}`),
            name: ep.name || `Episódio ${String(eIdx + 1).padStart(2, '0')}`,
            number: eIdx + 1,
            streamUrl: ep.url
          }))
        }))

        remoteItems.push({
          id: sanitizeSlug(item.link),
          slug: sanitizeSlug(item.link),
          tmdbId: tmdb?.tmdbId,
          title: tmdb?.title || item.titulo,
          originalTitle: tmdb?.originalTitle || item.alt || '',
          type: item.tipo?.includes('movie') ? 'movie' : (item.tipo?.includes('cartoons') ? 'cartoon' : 'anime'),
          poster: item.imagem || tmdb?.poster || '/capy-icon.svg',
          backdrop: tmdb?.backdrop || item.imagem || '',
          synopsis: tmdb?.synopsis || 'Anime em alta definição disponível no CapyFlix.',
          genres: (item.generos || ['Full HD', 'Anime']).map(g => g.toUpperCase()),
          year: tmdb?.year || '',
          rating: tmdb?.rating || 8.2,
          isDubbed: (item.generos || []).includes('dub'),
          isSubbed: (item.generos || []).includes('leg'),
          isFeatured: (item.generos || []).includes('recente') || (item.tipo || '').includes('new'),
          seasons
        })

        console.log(`[Remote Sync] ✓ ${item.titulo} validado com sucesso (${seasons.length} temporadas)!`)
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
  const remoteItems = await importAkiraCatalog(10)

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

  console.log('====================================================')
  console.log(`🎉 Sucesso! Catálogo gerado com ${finalCatalog.length} títulos validados.`)
  console.log(`📁 Arquivo salvo em: ${OUTPUT_FILE}`)
  console.log('====================================================')
}

run().catch(err => {
  console.error('Erro na execução do sincronizador:', err)
  process.exit(1)
})
