/**
 * CapyFlix NAS Storage Quota Monitor & Manager
 * 
 * Limite de Armazenamento: 300 GB
 * Alerta: 285 GB (95%)
 */

import fs from 'node:fs'
import path from 'node:path'

const MAX_STORAGE_BYTES = 300 * 1024 * 1024 * 1024 // 300 GB
const WARN_STORAGE_BYTES = 285 * 1024 * 1024 * 1024 // 285 GB

const MEDIA_ROOT = process.env.MEDIA_FOLDER ||
  (fs.existsSync('/mnt/capyflix') ? '/mnt/capyflix' : (fs.existsSync('X:\\') ? 'X:\\' : '/mnt/capyflix'))

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function scanDirectorySizes(dirPath) {
  let totalBytes = 0
  const filesList = []

  if (!fs.existsSync(dirPath)) {
    return { totalBytes: 0, filesList: [] }
  }

  function walk(current) {
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name)
        if (entry.isDirectory()) {
          walk(fullPath)
        } else if (entry.isFile()) {
          try {
            const stats = fs.statSync(fullPath)
            totalBytes += stats.size
            filesList.push({
              path: fullPath,
              name: entry.name,
              size: stats.size,
              mtime: stats.mtime
            })
          } catch {
            // ignora erro de acesso a arquivo individual
          }
        }
      }
    } catch {
      // ignora erro de leitura de diretório
    }
  }

  walk(dirPath)
  return { totalBytes, filesList }
}

export function checkStorageStatus() {
  const { totalBytes, filesList } = scanDirectorySizes(MEDIA_ROOT)
  const percentUsed = (totalBytes / MAX_STORAGE_BYTES) * 100
  const isNearLimit = totalBytes >= WARN_STORAGE_BYTES
  const isExceeded = totalBytes >= MAX_STORAGE_BYTES

  return {
    mediaRoot: MEDIA_ROOT,
    totalBytes,
    totalFormatted: formatBytes(totalBytes),
    maxBytes: MAX_STORAGE_BYTES,
    maxFormatted: formatBytes(MAX_STORAGE_BYTES),
    percentUsed: Math.min(100, Math.round(percentUsed * 10) / 10),
    isNearLimit,
    isExceeded,
    fileCount: filesList.length
  }
}

// Execução direta via CLI para inspeção
if (process.argv[1]?.endsWith('storage-manager.js')) {
  console.log('====================================================')
  console.log('🦫  CapyFlix • Monitor de Quota de Armazenamento NAS')
  console.log('====================================================')
  const status = checkStorageStatus()
  console.log(`📁 Diretório Monitorado: ${status.mediaRoot}`)
  console.log(`📊 Ocupação Atual:       ${status.totalFormatted} / ${status.maxFormatted} (${status.percentUsed}%)`)
  console.log(`📄 Total de Arquivos:    ${status.fileCount}`)
  
  if (status.isExceeded) {
    console.log(`🚨 ATENÇÃO: A quota máxima de 300 GB foi atingida!`)
  } else if (status.isNearLimit) {
    console.log(`⚠️ ALERTA: Armazenamento próximo do limite estipulado (95%).`)
  } else {
    console.log(`✅ Armazenamento seguro. ${formatBytes(status.maxBytes - status.totalBytes)} livres dentro da quota de 300 GB.`)
  }
  console.log('====================================================')
}
