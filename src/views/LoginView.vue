<template>
  <div class="login-page">
    <div class="login-card fade-in">
      <div class="logo-container">
        <div class="tv-icon-badge">
          <Film :size="36" class="tv-icon" />
        </div>
        <h1 class="app-title mono">CapyFlix</h1>
        <p class="app-subtitle">Cinema & Séries dos amigos da Capihouse</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>

        <div class="input-group">
          <label for="login" class="input-label">E-mail ou Usuário da Capihouse</label>
          <input
            id="login"
            v-model="loginInput"
            type="text"
            required
            autocomplete="username"
            placeholder="calebe ou morador@capihouse.com"
            class="form-input"
          />
        </div>

        <div class="input-group">
          <label for="password" class="input-label">Senha</label>
          <input
            id="password"
            v-model="passwordInput"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="form-input"
          />
        </div>

        <button type="submit" :disabled="authStore.isLoading" class="btn-primary submit-btn">
          <span v-if="authStore.isLoading">Entrando...</span>
          <span v-else>Entrar com Capihouse</span>
        </button>

        <p class="login-hint">
          Sua conta é a mesma que você já utiliza no <strong>Capihouse</strong> e <strong>CapyShowTime</strong>.
        </p>
      </form>

      <!-- Card de Login Rápido em Ambiente Local / Dev -->
      <div v-if="devUsers.length > 0" class="dev-login-box">
        <div class="dev-header mono">
          ⚡ Moradores da Casa ({{ devUsers.length }} contas)
        </div>
        <p class="dev-desc">
          Selecione uma conta para entrar direto:
        </p>
        <select v-model="selectedDevUserId" class="form-input dev-select">
          <option v-for="u in devUsers" :key="u.id" :value="u.id">
            {{ u.name }} (@{{ u.username }})
          </option>
        </select>
        <button
          type="button"
          class="btn-secondary dev-submit-btn"
          :disabled="authStore.isLoading || !selectedDevUserId"
          @click="handleDevLogin"
        >
          <span>🎭 Entrar como Selecionado</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Film } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginInput = ref('')
const passwordInput = ref('')
const errorMessage = ref('')

const devUsers = ref<any[]>([])
const selectedDevUserId = ref<number | ''>('')

async function handleLogin() {
  errorMessage.value = ''
  const result = await authStore.login(loginInput.value.trim(), passwordInput.value)
  if (result.success) {
    router.push('/')
  } else {
    errorMessage.value = result.message || 'Falha no login.'
  }
}

async function handleDevLogin() {
  if (!selectedDevUserId.value) return
  errorMessage.value = ''
  const result = await authStore.devLogin(Number(selectedDevUserId.value))
  if (result.success) {
    router.push('/')
  } else {
    errorMessage.value = result.message || 'Falha no login de teste.'
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    router.push('/')
    return
  }

  // Tenta autenticar reutilizando token de outros apps se disponível
  const existingToken =
    localStorage.getItem('capyflix_token') ||
    localStorage.getItem('capyshowtime_token') ||
    localStorage.getItem('capihouse_token')

  if (existingToken) {
    authStore.token = existingToken
    const ok = await authStore.checkAuth()
    if (ok) {
      router.push('/')
      return
    }
  }

  // Tenta carregar dev users
  try {
    const res = await authStore.getDevUsers()
    if (res && res.data && Array.isArray(res.data)) {
      devUsers.value = res.data
      if (devUsers.value.length > 0) {
        selectedDevUserId.value = devUsers.value[0].id
      }
    }
  } catch {
    // ignore
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 32px 28px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.tv-icon-badge {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  margin-bottom: 12px;
}

.app-title {
  font-size: 1.5rem;
  color: var(--color-accent);
  letter-spacing: 0.5px;
}

.app-subtitle {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 4px;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-banner {
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  text-align: center;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
}

.form-input {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  color: var(--text-main);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--color-accent);
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
}

.login-hint {
  font-size: 0.75rem;
  color: var(--text-dim);
  text-align: center;
  line-height: 1.4;
  margin-top: 4px;
}

.dev-login-box {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.dev-header {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-accent);
  margin-bottom: 6px;
}

.dev-desc {
  font-size: 0.75rem;
  color: var(--text-dim);
  margin-bottom: 10px;
}

.dev-select {
  width: 100%;
  margin-bottom: 10px;
  font-size: 0.82rem;
}

.dev-submit-btn {
  width: 100%;
  font-size: 0.82rem;
  padding: 8px 12px;
}
</style>
