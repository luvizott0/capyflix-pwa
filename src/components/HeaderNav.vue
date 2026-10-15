<template>
  <header class="header-nav" :class="{ 'header-scrolled': isScrolled }">
    <div class="header-content container">
      <!-- Logo / Marca -->
      <router-link to="/" class="logo-link">
        <span class="logo-title mono">CapyFlix</span>
      </router-link>

      <!-- Ações da Direita -->
      <div class="nav-actions">
        <!-- Botão Armazenamento NAS 300GB -->
        <button
          type="button"
          class="action-btn"
          title="Gerenciador de Armazenamento NAS (300 GB)"
          @click="showStorageModal = true"
        >
          <HardDrive :size="17" />
        </button>

        <!-- Botão Configuração Debrid / Streams Diretos -->
        <button
          type="button"
          class="action-btn"
          title="Configuração Debrid (Streams Diretos)"
          @click="showDebridModal = true"
        >
          <Zap :size="17" />
        </button>

        <!-- Botão de Atualizar o App -->
        <button
          type="button"
          class="action-btn update-btn"
          :class="{ 'has-update': needRefresh, 'is-checking': isChecking }"
          :title="needRefresh ? 'Nova versão pronta! Clique para atualizar' : 'Buscar atualizações do aplicativo'"
          @click="handleUpdateClick"
        >
          <RefreshCw :size="17" :class="{ spinning: isChecking }" />
        </button>

        <!-- Botão de Sair -->
        <button
          v-if="authStore.user"
          type="button"
          class="action-btn logout-action-btn"
          :title="`Sair (${authStore.user.name})`"
          @click="handleLogout"
        >
          <LogOut :size="17" />
        </button>
      </div>
    </div>

    <!-- Modais de NAS e Debrid -->
    <NasStorageModal :is-open="showStorageModal" @close="showStorageModal = false" />
    <DebridConfigModal :is-open="showDebridModal" @close="showDebridModal = false" />

    <!-- Toast flutuante de feedback de atualização -->
    <transition name="fade">
      <div v-if="feedbackMessage" class="update-toast mono" @click="feedbackMessage = ''">
        <span>{{ feedbackMessage }}</span>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { RefreshCw, LogOut, HardDrive, Zap } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { usePwaUpdate } from '@/composables/usePwaUpdate'
import NasStorageModal from '@/components/NasStorageModal.vue'
import DebridConfigModal from '@/components/DebridConfigModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const isScrolled = ref(false)

const showStorageModal = ref(false)
const showDebridModal = ref(false)

const {
  needRefresh,
  isChecking,
  feedbackMessage,
  checkForUpdates,
  updateServiceWorker
} = usePwaUpdate()

function checkScroll() {
  isScrolled.value = window.scrollY > 15
}

async function handleUpdateClick() {
  if (needRefresh.value) {
    await updateServiceWorker()
  } else {
    await checkForUpdates()
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<style scoped>
.header-nav {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  /* Garante compatibilidade com iPhone / Safari notch */
  padding-top: env(safe-area-inset-top, 0px);
  height: calc(56px + env(safe-area-inset-top, 0px));
  background-color: rgba(18, 16, 14, 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.header-scrolled {
  background-color: rgba(18, 16, 14, 0.98);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: calc(16px + env(safe-area-inset-left, 0px));
  padding-right: calc(16px + env(safe-area-inset-right, 0px));
}

.logo-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.logo-title {
  font-size: 1.18rem;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 0.5px;
  transition: opacity 0.2s;
}

.logo-link:hover .logo-title {
  opacity: 0.85;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.action-btn:hover {
  color: var(--text-main);
  background-color: var(--bg-surface-hover);
  border-color: var(--color-primary-light);
}

.update-btn.has-update {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background-color: rgba(245, 197, 24, 0.15);
  animation: pulse-update 2s infinite;
}

@keyframes pulse-update {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 197, 24, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(245, 197, 24, 0); }
}

.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.logout-action-btn:hover {
  color: var(--color-danger);
  border-color: rgba(248, 113, 113, 0.3);
  background-color: rgba(248, 113, 113, 0.1);
}

.update-toast {
  position: absolute;
  top: calc(100% + 8px);
  right: 16px;
  background-color: var(--bg-surface-elevated);
  color: var(--color-accent);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 0.76rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  z-index: 110;
  max-width: 280px;
}
</style>
