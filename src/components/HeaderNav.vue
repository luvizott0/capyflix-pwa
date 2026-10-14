<template>
  <header class="header-nav" :class="{ 'header-scrolled': isScrolled }">
    <div class="header-content container">
      <!-- Logo e Título -->
      <router-link to="/" class="logo-area">
        <img src="/capy-icon.svg" alt="CapyFlix Logo" class="capy-logo-img" />
        <div class="logo-text">
          <span class="logo-title mono">CapyFlix</span>
          <span class="logo-badge rajdhani">RETRO CINEMA</span>
        </div>
      </router-link>

      <!-- Ações da Direita -->
      <div class="nav-actions">
        <!-- Botão de Busca -->
        <router-link to="/search" class="action-btn" title="Buscar no Catálogo">
          <svg viewBox="0 0 24 24" class="icon"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        </router-link>

        <!-- Meus Favoritos -->
        <router-link to="/favorites" class="action-btn" title="Favoritos">
          <svg viewBox="0 0 24 24" class="icon"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>
        </router-link>

        <!-- Perfil CapiHouse -->
        <div v-if="authStore.user" class="user-chip">
          <img
            v-if="authStore.user.avatar_url"
            :src="authStore.user.avatar_url"
            :alt="authStore.user.name"
            class="user-avatar"
          />
          <div v-else class="user-avatar-placeholder mono">
            {{ authStore.user.name.charAt(0) }}
          </div>
          <span class="user-name">{{ authStore.user.name.split(' ')[0] }}</span>

          <button type="button" class="logout-btn" title="Sair" @click="handleLogout">
            <svg viewBox="0 0 24 24" class="logout-icon"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/></svg>
          </button>
        </div>
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
  padding: 12px 0;
  background: rgba(18, 16, 14, 0.85);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.header-scrolled {
  background: rgba(18, 16, 14, 0.98);
  border-bottom-color: var(--color-border);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  padding: 8px 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.capy-logo-img {
  width: 38px;
  height: 38px;
  border-radius: 10px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 1px;
  line-height: 1.1;
}

.logo-badge {
  font-size: 9px;
  font-weight: 700;
  color: var(--color-primary-light);
  letter-spacing: 2px;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border-subtle);
  transition: all 0.2s;
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

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-primary);
}

.user-avatar-placeholder {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.logout-btn {
  color: var(--text-dim);
  display: flex;
  align-items: center;
  padding: 2px;
  transition: color 0.2s;
}

.logout-btn .logout-icon {
  width: 16px;
  height: 16px;
}

.logout-btn:hover {
  color: var(--color-danger);
}

@media (max-width: 640px) {
  .user-name {
    display: none;
  }
}
</style>
