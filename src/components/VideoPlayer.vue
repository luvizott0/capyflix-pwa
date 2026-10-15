<template>
  <div ref="playerContainer" class="video-player-container" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- Vídeo HTML5 -->
    <video
      ref="videoRef"
      class="video-element"
      playsinline
      webkit-playsinline
      preload="auto"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @loadstart="isBuffering = true"
      @canplay="isBuffering = false"
      @canplaythrough="isBuffering = false"
      @waiting="isBuffering = true"
      @stalled="isBuffering = true"
      @playing="isBuffering = false; isPlaying = true; playError = null"
      @pause="onPause"
      @ended="onEnded"
      @error="handleVideoError"
      @click="togglePlay"
    ></video>

    <!-- Overlay de Erro na Transmissão -->
    <div v-if="playError" class="video-error-overlay">
      <div class="error-box">
        <p class="error-msg rajdhani">{{ playError }}</p>
        <span class="error-sub">Você pode alternar para outro servidor na barra "FONTE" acima.</span>
        <button type="button" class="btn-retry" @click="retryPlayback">
          Tentar Novamente
        </button>
      </div>
    </div>

    <!-- Overlay de Capa Inicial (estilo Akira Nolan) -->
    <div
      v-if="showCover && coverUrl"
      class="player-cover"
      :style="{ backgroundImage: `url(${coverUrl})` }"
      @click="startPlayback"
    >
      <div class="cover-backdrop"></div>
      <div class="play-trigger-btn">
        <svg viewBox="0 0 24 24" class="play-icon">
          <polygon points="6,4 20,12 6,20" fill="currentColor" />
        </svg>
      </div>
      <p class="trigger-label rajdhani">ASSISTIR AGORA</p>
    </div>

    <!-- Spinner de Buffering -->
    <div v-if="isBuffering && !showCover" class="buffer-spinner-overlay">
      <div class="retro-spinner"></div>
      <span class="buffer-text rajdhani">CARREGANDO TRANSMISSÃO...</span>
    </div>

    <!-- Barra de Controles Customizada Retrô -->
    <div
      v-show="!showCover"
      class="controls-overlay"
      :class="{ 'controls-visible': controlsVisible || !isPlaying }"
      @mousemove="resetControlsTimeout"
    >
      <!-- Barra de Progresso / Scrubber -->
      <div
        class="progress-bar-container"
        @click="seek"
        @mousemove="onProgressHover"
        @mouseleave="hoverTime = null"
      >
        <div class="progress-track-bg"></div>
        <div class="progress-buffered" :style="{ width: `${bufferedPercent}%` }"></div>
        <div class="progress-played" :style="{ width: `${playedPercent}%` }"></div>
        <div class="scrubber-head" :style="{ left: `${playedPercent}%` }"></div>
        
        <!-- Tooltip de Tempo ao passar o mouse -->
        <div
          v-if="hoverTime !== null"
          class="seek-tooltip rajdhani"
          :style="{ left: `${hoverPosition}%` }"
        >
          {{ formatTime(hoverTime) }}
        </div>
      </div>

      <!-- Linha de Botões de Controle -->
      <div class="controls-bottom">
        <div class="controls-left">
          <!-- Play / Pause -->
          <button type="button" class="ctrl-btn play-btn" @click="togglePlay" :title="isPlaying ? 'Pausar (Espaço)' : 'Play (Espaço)'">
            <svg v-if="isPlaying" viewBox="0 0 24 24" class="icon"><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg>
            <svg v-else viewBox="0 0 24 24" class="icon"><polygon points="6,4 20,12 6,20" fill="currentColor"/></svg>
          </button>

          <!-- Voltar 10s -->
          <button type="button" class="ctrl-btn skip-btn" @click="skip(-10)" title="Voltar 10s (←)">
            <svg viewBox="0 0 24 24" class="icon"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" fill="currentColor"/></svg>
          </button>

          <!-- Avançar 10s -->
          <button type="button" class="ctrl-btn skip-btn" @click="skip(10)" title="Avançar 10s (→)">
            <svg viewBox="0 0 24 24" class="icon"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" fill="currentColor"/></svg>
          </button>

          <!-- Volume -->
          <button type="button" class="ctrl-btn mute-btn" @click="toggleMute">
            <svg v-if="isMuted || volume === 0" viewBox="0 0 24 24" class="icon"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor"/></svg>
            <svg v-else viewBox="0 0 24 24" class="icon"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/></svg>
          </button>

          <!-- Tempo Atual / Total -->
          <div class="time-display rajdhani">
            <span>{{ formatTime(currentTime) }}</span>
            <span class="time-divider">/</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>

        <div class="controls-right">
          <!-- Velocidade de Reprodução -->
          <div class="speed-picker">
            <button type="button" class="ctrl-btn speed-btn mono" @click="cyclePlaybackRate" title="Velocidade de reprodução">
              {{ playbackRate }}x
            </button>
          </div>

          <!-- Botão Link Externo / VLC / Celular -->
          <a
            :href="externalPlayerUrl"
            class="ctrl-btn external-link"
            title="Abrir no VLC ou Player Externo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" class="icon"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" fill="currentColor"/></svg>
          </a>

          <!-- Picture-in-Picture -->
          <button
            v-if="supportsPiP"
            type="button"
            class="ctrl-btn pip-btn"
            @click="togglePiP"
            title="Picture-in-Picture"
          >
            <svg viewBox="0 0 24 24" class="icon"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z" fill="currentColor"/></svg>
          </button>

          <!-- Tela Cheia -->
          <button type="button" class="ctrl-btn fullscreen-btn" @click="toggleFullscreen" title="Tela Cheia (F)">
            <svg v-if="isFullscreen" viewBox="0 0 24 24" class="icon"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" fill="currentColor"/></svg>
            <svg v-else viewBox="0 0 24 24" class="icon"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import Hls from 'hls.js'

const props = defineProps<{
  src: string
  coverUrl?: string
  initialTime?: number
}>()

const emit = defineEmits<{
  (e: 'timeupdate', data: { currentTime: number; duration: number }): void
  (e: 'ended'): void
  (e: 'pause'): void
}>()

const playerContainer = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

let hlsInstance: Hls | null = null
let controlsTimer: any = null
let progressSaveTimer: any = null

const isPlaying = ref(false)
const isBuffering = ref(false)
const showCover = ref(true)
const playError = ref<string | null>(null)
const currentTime = ref(0)
const duration = ref(0)
const bufferedTime = ref(0)
const isMuted = ref(false)
const volume = ref(1)
const playbackRate = ref(1)
const isFullscreen = ref(false)
const controlsVisible = ref(true)

function handleVideoError(e: Event) {
  isBuffering.value = false
  isPlaying.value = false
  const target = e.target as HTMLVideoElement
  const errCode = target.error?.code
  if (errCode === MediaError.MEDIA_ERR_NETWORK) {
    playError.value = 'Falha na conexão de rede com este servidor de vídeo.'
  } else if (errCode === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
    playError.value = 'Transmissão temporariamente indisponível neste link.'
  } else {
    playError.value = 'Não foi possível carregar a transmissão deste servidor.'
  }
}

function retryPlayback() {
  playError.value = null
  initSource()
  startPlayback()
}

const hoverTime = ref<number | null>(null)
const hoverPosition = ref(0)

const supportsPiP = computed(() => {
  return typeof document !== 'undefined' && 'pictureInPictureEnabled' in document
})

const playedPercent = computed(() => {
  if (duration.value <= 0) return 0
  return (currentTime.value / duration.value) * 100
})

const bufferedPercent = computed(() => {
  if (duration.value <= 0) return 0
  return (bufferedTime.value / duration.value) * 100
})

const externalPlayerUrl = computed(() => {
  return props.src
})

function initSource() {
  const video = videoRef.value
  if (!video || !props.src) return

  if (hlsInstance) {
    hlsInstance.destroy()
    hlsInstance = null
  }

  // Se for fluxo HLS (.m3u8)
  if (props.src.includes('.m3u8')) {
    if (Hls.isSupported()) {
      hlsInstance = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.5,
        startLevel: -1,
        enableWorker: true,
        lowLatencyMode: false,
        progressive: true
      })
      hlsInstance.loadSource(props.src)
      hlsInstance.attachMedia(video)
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Suporte nativo Safari / iOS
      video.src = props.src
      video.load()
    }
  } else {
    // MP4 ou WebM direto com pré-carregamento imediato e hardware acceleration
    video.src = props.src
    video.load()
  }

  // Não aplicar currentTime imediatamente: aguardar loadedmetadata para não congelar o vídeo
  pendingSeekTime = props.initialTime && props.initialTime > 0 ? props.initialTime : null
}

let pendingSeekTime: number | null = null

function applyPendingSeek() {
  const video = videoRef.value
  if (!video) return
  if (pendingSeekTime !== null && pendingSeekTime > 0 && video.duration > 0) {
    try {
      video.currentTime = Math.min(pendingSeekTime, video.duration)
    } catch (err) {
      console.warn('Falha ao aplicar tempo inicial:', err)
    }
    pendingSeekTime = null
  }
}

function startPlayback() {
  showCover.value = false
  isBuffering.value = true
  togglePlay()

  // No celular na vertical ou mobile em geral, já colocar em tela cheia ao dar play
  const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
  if (isMobile) {
    requestFullscreenInternal()
  }
}

function togglePlay() {
  const video = videoRef.value
  if (!video) return

  if (video.paused) {
    video.play().catch(err => console.log('Autoplay bloqueado:', err))
  } else {
    video.pause()
  }
}

function skip(seconds: number) {
  const video = videoRef.value
  if (!video) return
  video.currentTime = Math.max(0, Math.min(duration.value, video.currentTime + seconds))
}

function toggleMute() {
  const video = videoRef.value
  if (!video) return
  video.muted = !video.muted
  isMuted.value = video.muted
}

const rates = [0.75, 1, 1.25, 1.5, 2]
function cyclePlaybackRate() {
  const nextIdx = (rates.indexOf(playbackRate.value) + 1) % rates.length
  playbackRate.value = rates[nextIdx]
  if (videoRef.value) {
    videoRef.value.playbackRate = playbackRate.value
  }
}

async function togglePiP() {
  const video = videoRef.value
  if (!video) return
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else {
      await video.requestPictureInPicture()
    }
  } catch (e) {
    console.error('Falha PiP:', e)
  }
}

function isFullscreenActive(): boolean {
  const doc = document as any
  const video = videoRef.value as any
  return !!(
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    (video && video.webkitDisplayingFullscreen)
  )
}

function updateFullscreenState() {
  isFullscreen.value = isFullscreenActive()
}

async function requestFullscreenInternal() {
  const container = playerContainer.value as any
  const video = videoRef.value as any

  try {
    if (container?.requestFullscreen) {
      await container.requestFullscreen()
    } else if (container?.webkitRequestFullscreen) {
      await container.webkitRequestFullscreen()
    } else if (container?.mozRequestFullScreen) {
      await container.mozRequestFullScreen()
    } else if (container?.msRequestFullscreen) {
      await container.msRequestFullscreen()
    } else if (video?.webkitEnterFullscreen) {
      video.webkitEnterFullscreen()
    } else if (video?.requestFullscreen) {
      await video.requestFullscreen()
    }
  } catch (err) {
    if (video?.webkitEnterFullscreen) {
      try {
        video.webkitEnterFullscreen()
      } catch (e2) {
        console.warn('Fullscreen fallback error:', e2)
      }
    } else if (video?.requestFullscreen) {
      try {
        await video.requestFullscreen()
      } catch (e2) {
        console.warn('Video requestFullscreen error:', e2)
      }
    }
  }

  try {
    if (screen.orientation && (screen.orientation as any).lock) {
      ;(screen.orientation as any).lock('landscape').catch(() => {})
    }
  } catch {
    // ignore
  }

  updateFullscreenState()
}

async function exitFullscreenInternal() {
  const doc = document as any
  const video = videoRef.value as any

  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen()
    } else if (doc.mozCancelFullScreen) {
      await doc.mozCancelFullScreen()
    } else if (doc.msExitFullscreen) {
      await doc.msExitFullscreen()
    } else if (video?.webkitExitFullscreen) {
      video.webkitExitFullscreen()
    }
  } catch (err) {
    console.warn('Exit fullscreen error:', err)
  }

  try {
    if (screen.orientation && (screen.orientation as any).unlock) {
      ;(screen.orientation as any).unlock()
    }
  } catch {
    // ignore
  }

  updateFullscreenState()
}

function toggleFullscreen() {
  if (isFullscreenActive()) {
    exitFullscreenInternal()
  } else {
    requestFullscreenInternal()
  }
}

function seek(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const pos = (e.clientX - rect.left) / rect.width
  if (videoRef.value && duration.value > 0) {
    videoRef.value.currentTime = pos * duration.value
  }
}

function onProgressHover(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  hoverPosition.value = pos * 100
  hoverTime.value = pos * duration.value
}

function onTimeUpdate() {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime
  
  if (videoRef.value.buffered.length > 0) {
    bufferedTime.value = videoRef.value.buffered.end(videoRef.value.buffered.length - 1)
  }

  emit('timeupdate', {
    currentTime: currentTime.value,
    duration: duration.value
  })
}

function onLoadedMetadata() {
  if (!videoRef.value) return
  duration.value = videoRef.value.duration
  applyPendingSeek()
}

function onPause() {
  isPlaying.value = false
  emit('pause')
}

function onEnded() {
  emit('ended')
}

function resetControlsTimeout() {
  controlsVisible.value = true
  clearTimeout(controlsTimer)
  controlsTimer = setTimeout(() => {
    if (isPlaying.value) {
      controlsVisible.value = false
    }
  }, 3000)
}

function formatTime(sec: number): string {
  if (isNaN(sec) || sec < 0) return '00:00'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function handleKeydown(e: KeyboardEvent) {
  if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
    return
  }
  if (e.code === 'Space') {
    e.preventDefault()
    togglePlay()
  } else if (e.code === 'ArrowLeft') {
    skip(-10)
  } else if (e.code === 'ArrowRight') {
    skip(10)
  } else if (e.code === 'KeyF') {
    toggleFullscreen()
  } else if (e.code === 'KeyM') {
    toggleMute()
  }
}

watch(() => props.src, () => {
  initSource()
})

onMounted(() => {
  initSource()
  window.addEventListener('keydown', handleKeydown)

  document.addEventListener('fullscreenchange', updateFullscreenState)
  document.addEventListener('webkitfullscreenchange', updateFullscreenState)
  document.addEventListener('mozfullscreenchange', updateFullscreenState)
  document.addEventListener('MSFullscreenChange', updateFullscreenState)

  const video = videoRef.value
  if (video) {
    video.addEventListener('webkitbeginfullscreen', updateFullscreenState)
    video.addEventListener('webkitendfullscreen', updateFullscreenState)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  clearTimeout(controlsTimer)
  clearInterval(progressSaveTimer)
  if (hlsInstance) {
    hlsInstance.destroy()
  }

  document.removeEventListener('fullscreenchange', updateFullscreenState)
  document.removeEventListener('webkitfullscreenchange', updateFullscreenState)
  document.removeEventListener('mozfullscreenchange', updateFullscreenState)
  document.removeEventListener('MSFullscreenChange', updateFullscreenState)

  const video = videoRef.value
  if (video) {
    video.removeEventListener('webkitbeginfullscreen', updateFullscreenState)
    video.removeEventListener('webkitendfullscreen', updateFullscreenState)
  }
})
</script>

<style scoped>
.video-player-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(166, 97, 48, 0.15);
  user-select: none;
}

.video-player-container.is-fullscreen {
  border-radius: 0;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
}

/* Capa / Trigger inicial estilo Akira Nolan */
.player-cover {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
}

.cover-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(18, 16, 14, 0.7);
  backdrop-filter: blur(4px);
}

.play-trigger-btn {
  position: relative;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: var(--color-accent);
  color: #12100e;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 30px rgba(245, 197, 24, 0.6);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s;
}

.play-trigger-btn .play-icon {
  width: 32px;
  height: 32px;
  margin-left: 4px;
}

.player-cover:hover .play-trigger-btn {
  transform: scale(1.15);
  box-shadow: 0 0 45px rgba(245, 197, 24, 0.9);
}

.trigger-label {
  position: relative;
  margin-top: 16px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
}

/* Erro no Vídeo */
.video-error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(18, 16, 14, 0.95);
  z-index: 6;
  padding: 20px;
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  max-width: 400px;
}

.error-msg {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ef4444;
  margin: 0;
}

.error-sub {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.btn-retry {
  margin-top: 8px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  font-size: 0.8rem;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: var(--color-accent);
  color: #12100e;
  border-color: var(--color-accent);
}

/* Spinner */
.buffer-spinner-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  z-index: 4;
}

.retro-spinner {
  width: 44px;
  height: 44px;
  border: 4px solid rgba(245, 197, 24, 0.2);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.buffer-text {
  font-size: 13px;
  letter-spacing: 2px;
  color: var(--color-accent);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Controles */
.controls-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 18px 12px 18px;
  background: linear-gradient(to top, rgba(10, 8, 7, 0.95) 0%, rgba(10, 8, 7, 0.4) 70%, transparent 100%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 6;
}

.controls-overlay.controls-visible {
  opacity: 1;
}

.progress-bar-container {
  position: relative;
  width: 100%;
  height: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.progress-track-bg {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.progress-buffered {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 4px;
}

.progress-played {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: var(--color-accent);
  border-radius: 4px;
  box-shadow: 0 0 10px var(--color-accent);
}

.scrubber-head {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
}

.progress-bar-container:hover .scrubber-head {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2);
}

.seek-tooltip {
  position: absolute;
  bottom: 18px;
  transform: translateX(-50%);
  background: rgba(18, 16, 14, 0.95);
  border: 1px solid var(--color-border);
  color: var(--color-accent);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  pointer-events: none;
}

.controls-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ctrl-btn {
  color: #f5efe6;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;
}

.ctrl-btn .icon {
  width: 20px;
  height: 20px;
}

.ctrl-btn:hover {
  color: var(--color-accent);
  background: rgba(255, 255, 255, 0.08);
}

.time-display {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  display: flex;
  gap: 6px;
  letter-spacing: 0.5px;
}

.time-divider {
  color: var(--text-dim);
}

.speed-btn {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

@media (max-width: 640px) {
  .controls-overlay {
    padding: 10px 10px 8px 10px;
  }

  .controls-left {
    gap: 6px;
    min-width: 0;
  }

  .controls-right {
    gap: 6px;
    flex-shrink: 0;
  }

  .ctrl-btn {
    width: 28px;
    height: 28px;
  }

  .ctrl-btn .icon {
    width: 18px;
    height: 18px;
  }

  /* Oculta volume e PiP no mobile vertical (smartphone usa botões físicos de volume) */
  .mute-btn,
  .pip-btn {
    display: none !important;
  }

  .time-display {
    font-size: 11px;
    gap: 4px;
    white-space: nowrap;
  }
}

@media (max-width: 420px) {
  /* Em celulares muito estreitos, oculta os botões de pular 10s para manter os botões de ação e play sempre visíveis */
  .skip-btn {
    display: none !important;
  }

  .controls-overlay {
    padding: 8px 6px 6px 6px;
  }
}
</style>
