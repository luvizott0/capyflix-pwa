<template>
  <header class="header-nav" :class="{ 'header-scrolled': isScrolled }">
    <div class="header-content container">
      <!-- Logo / Marca -->
      <router-link to="/" class="logo-link">
        <span class="logo-title mono">CapyFlix</span>
      </router-link>

      <!-- Ações da Direita (Apenas Botões) -->
      <div class="nav-actions">
        <!-- Botão de Busca -->
        <router-link to="/search" class="action-btn" title="Buscar no Catálogo">
          <svg viewBox="0 0 24 24" class="icon"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        </router-link>

        <!-- Meus Favoritos -->
        <router-link to="/favorites" class="action-btn" title="Favoritos">
          <svg viewBox="0 0 24 24" class="icon"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>
        </router-link>

        <!-- Botão de Sair -->
        <button
          v-if="authStore.user"
          type="button"
          class="action-btn logout-action-btn"
          :title="`Sair (${authStore.user.name})`"
          @click="handleLogout"
        >
          <svg viewBox="0 0 24 24" class="icon"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/></svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isScrolled = ref(false)

function checkScroll() {
  isScrolled.value = window.scrollY > 20
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
  padding: 14px 0;
  background: rgba(18, 16, 14, 0.85);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.header-scrolled {
  background: rgba(18, 16, 14, 0.98);
  border-bottom-color: var(--color-border);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  padding: 10px 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-link {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.logo-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 1.2px;
  line-height: 1;
  transition: opacity 0.2s;
}

.logo-link:hover .logo-title {
  opacity: 0.85;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border-subtle);
  transition: all 0.2s;
  cursor: pointer;
  text-decoration: none;
}

.action-btn .icon {
  width: 18px;
  height: 18px;
}

.action-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background: var(--color-accent-dim);
}

.action-btn.router-link-active {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background: var(--color-accent-dim);
}

.logout-action-btn:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
  background: rgba(248, 113, 113, 0.12);
}
</style>
