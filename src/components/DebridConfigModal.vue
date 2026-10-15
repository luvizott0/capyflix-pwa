<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-backdrop fade-in" @click.self="emit('close')">
      <div class="debrid-modal">
      <div class="modal-header">
        <div class="header-title-box">
          <Zap :size="20" class="icon-accent" />
          <h2 class="title mono">CONFIGURAÇÃO DE STREAMS DEBRID</h2>
        </div>
        <button type="button" class="close-btn" @click="emit('close')" title="Fechar">
          <X :size="20" />
        </button>
      </div>

      <div class="modal-body">
        <div class="explanation-box">
          <p class="explanation-text">
            O <strong>Torbox</strong> e o <strong>Real-Debrid</strong> fornecem fluxos de vídeo diretos (semelhante ao Stremio), permitindo que você assista a qualquer filme ou série no player nativo do CapyFlix em até 4K/1080p, com legendas e <strong>sem anúncios ou popups</strong>.
          </p>
          <div class="tip-box mono">
            💡 Dica: O Torbox possui plano 100% gratuito. Basta criar uma conta em <a href="https://torbox.app" target="_blank" rel="noopener noreferrer" class="link">torbox.app</a> e copiar o seu <strong>API Token</strong> nas configurações da sua conta.
          </div>
        </div>

        <form @submit.prevent="saveConfig" class="form-container">
          <div class="form-group">
            <label class="mono form-label">PROVEDOR DE STREAM:</label>
            <div class="provider-selector">
              <label class="provider-radio" :class="{ selected: provider === 'torbox' }">
                <input type="radio" v-model="provider" value="torbox" />
                <span class="radio-title mono">Torbox (Gratuito / Pro)</span>
                <span class="radio-desc">CDN rápida, suporte direto e API aberta.</span>
              </label>

              <label class="provider-radio" :class="{ selected: provider === 'realdebrid' }">
                <input type="radio" v-model="provider" value="realdebrid" />
                <span class="radio-title mono">Real-Debrid (Premium)</span>
                <span class="radio-desc">Maior cache mundial de torrents em 10Gbps.</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="mono form-label">API TOKEN / CHAVE DE ACESSO:</label>
            <input
              type="password"
              v-model="token"
              class="form-input mono"
              :placeholder="currentConfig?.has_token ? `Salvo: ${currentConfig.masked_token}` : 'Cole seu Token aqui...'"
              autocomplete="off"
            />
            <span class="field-hint mono">
              {{ currentConfig?.has_token ? `Status: Conectado (${currentConfig.provider.toUpperCase()})` : 'Nenhum token configurado no momento.' }}
            </span>
          </div>

          <div v-if="successMsg" class="alert-success mono">
            ✓ {{ successMsg }}
          </div>
          <div v-if="errorMsg" class="alert-error mono">
            ⚠ {{ errorMsg }}
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel mono" @click="emit('close')">
              Cancelar
            </button>
            <button type="submit" class="btn-save mono" :disabled="isSaving || !token">
              {{ isSaving ? 'Salvando...' : 'Salvar e Ativar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Zap, X } from 'lucide-vue-next'
import { capyFlixApi, type DebridConfig } from '@/api/capyflix'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const provider = ref<'torbox' | 'realdebrid'>('torbox')
const token = ref('')
const currentConfig = ref<DebridConfig | null>(null)
const isSaving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

async function loadConfig() {
  try {
    const data = await capyFlixApi.getDebridConfig()
    currentConfig.value = data
    if (data.provider) provider.value = data.provider
  } catch (err) {
    console.warn('Falha ao carregar configuração Debrid:', err)
  }
}

async function saveConfig() {
  if (!token.value.trim()) return
  isSaving.value = true
  successMsg.value = ''
  errorMsg.value = ''

  try {
    const res = await capyFlixApi.saveDebridConfig({
      provider: provider.value,
      token: token.value.trim()
    })
    currentConfig.value = res.config
    token.value = ''
    successMsg.value = 'Configuração Debrid salva! Streams de alta velocidade ativados.'
    emit('saved')
    setTimeout(() => {
      emit('close')
    }, 1500)
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Falha ao salvar configuração.'
  } finally {
    isSaving.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      loadConfig()
    }
  }
)

onMounted(() => {
  if (props.isOpen) {
    loadConfig()
  }
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 8, 7, 0.88);
  backdrop-filter: blur(8px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
}

.debrid-modal {
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  margin: auto;
  background: var(--bg-surface, #1e1b18);
  border: 1px solid var(--border-color, rgba(245, 197, 24, 0.2));
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

.modal-header {
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-accent {
  color: var(--color-accent, #f5c518);
}

.title {
  font-size: 0.95rem;
  color: var(--text-main, #ffffff);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted, #999);
  cursor: pointer;
  padding: 4px;
}

.close-btn:hover {
  color: #ffffff;
}

.modal-body {
  padding: 20px;
}

.explanation-box {
  margin-bottom: 18px;
}

.explanation-text {
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--text-muted, #ccc);
  margin-bottom: 10px;
}

.tip-box {
  background: rgba(245, 197, 24, 0.08);
  border: 1px solid rgba(245, 197, 24, 0.2);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 0.78rem;
  color: var(--color-accent, #f5c518);
  line-height: 1.4;
}

.link {
  color: #ffffff;
  text-decoration: underline;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.75rem;
  color: var(--text-muted, #aaa);
}

.provider-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.provider-radio {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.2s;
}

.provider-radio input {
  display: none;
}

.provider-radio.selected {
  border-color: var(--color-accent, #f5c518);
  background: rgba(245, 197, 24, 0.1);
}

.radio-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #ffffff;
}

.radio-desc {
  font-size: 0.7rem;
  color: var(--text-muted, #888);
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--color-accent, #f5c518);
}

.field-hint {
  font-size: 0.72rem;
  color: var(--text-muted, #777);
}

.alert-success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
}

.alert-error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted, #aaa);
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-save {
  background: var(--color-accent, #f5c518);
  color: #12100e;
  border: none;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: opacity 0.2s;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
