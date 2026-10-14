<template>
  <header class="header-nav" :class="{ 'header-scrolled': isScrolled }">
    <div class="header-content container">
      <!-- Logo / Marca -->
      <router-link to="/" class="logo-link">
        <span class="logo-title mono">CapyFlix</span>
      </router-link>

      <!-- Ações da Direita -->
      <div class="nav-actions">
        <!-- Botão de Busca -->
        <router-link to="/search" class="action-btn" title="Buscar no Catálogo">
          <Search :size="18" />
        </router-link>

        <!-- Meus Favoritos / Minha Lista -->
        <router-link to="/favorites" class="action-btn" title="Minha Lista">
          <Bookmark :size="18" />
        </router-link>

        <!-- Botão de Sair -->
        <button
          v-if="authStore.user"
          type="button"
          class="action-btn logout-action-btn"
          :title="`Sair (${authStore.user.name})`"
          @click="handleLogout"
        >
          <LogOut :size="18" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Bookmark, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isScrolled = ref(false)

function checkScroll() {
  isScrolled.value = window.scrollY > 15
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
  z-index: 90;
  height: 56px;
  background-color: rgba(18, 16, 14, 0.92);
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
}

.logo-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.logo-title {
  font-size: 1.15rem;
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
}

.action-btn:hover {
  color: var(--text-main);
  background-color: var(--bg-surface-hover);
  border-color: var(--color-primary-light);
}

.action-btn.router-link-active {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background-color: var(--color-accent-dim);
}

.logout-action-btn:hover {
  color: var(--color-danger);
  border-color: rgba(248, 113, 113, 0.3);
  background-color: rgba(248, 113, 113, 0.1);
}
</style>
