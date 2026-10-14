<template>
  <div class="comments-section">
    <div class="comments-header">
      <div class="header-left">
        <svg viewBox="0 0 24 24" class="header-icon"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" fill="currentColor"/></svg>
        <h3 class="section-title mono">Debate do Episódio</h3>
      </div>
      <span class="comments-counter rajdhani">{{ comments.length }} COMENTÁRIOS</span>
    </div>

    <!-- Feed de Comentários -->
    <div v-if="loading" class="comments-loading">
      <div class="retro-spinner-mini"></div>
      <span class="loading-text rajdhani">Carregando comentários dos amigos...</span>
    </div>

    <div v-else-if="comments.length === 0" class="no-comments-box">
      <p class="no-comments-title">Nenhum comentário ainda neste episódio!</p>
      <p class="no-comments-desc">Seja o primeiro da Capihouse a mandar sua opinião ou teoria.</p>
    </div>

    <div v-else class="comments-list">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="comment-card"
        :class="{ 'my-comment': authStore.user?.id === comment.user.id }"
      >
        <div class="comment-top">
          <div class="author-info">
            <img
              v-if="comment.user.avatar_url"
              :src="comment.user.avatar_url"
              :alt="comment.user.name"
              class="author-avatar"
            />
            <div v-else class="avatar-placeholder mono">
              {{ comment.user.name.charAt(0) }}
            </div>
            <div class="author-names">
              <span class="author-name">{{ comment.user.name }}</span>
              <span class="comment-time">{{ comment.created_at }}</span>
            </div>
          </div>

          <!-- Ações do autor (Editar / Excluir) -->
          <div v-if="authStore.user?.id === comment.user.id" class="author-actions">
            <button
              type="button"
              class="action-mini-btn"
              title="Editar comentário"
              @click="startEdit(comment)"
            >
              <svg viewBox="0 0 24 24" class="icon"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>
            </button>
            <button
              type="button"
              class="action-mini-btn danger"
              title="Excluir comentário"
              @click="deleteComment(comment.id)"
            >
              <svg viewBox="0 0 24 24" class="icon"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>

        <!-- Modo de Edição -->
        <div v-if="editingCommentId === comment.id" class="edit-box">
          <textarea
            v-model="editCommentText"
            class="comment-textarea"
            rows="2"
          ></textarea>
          <div class="edit-actions">
            <button type="button" class="btn-cancel mono" @click="cancelEdit">Cancelar</button>
            <button type="button" class="btn-save mono" @click="saveEdit(comment.id)">Salvar Alterações</button>
          </div>
        </div>

        <!-- Modo Normal de Visualização -->
        <div v-else>
          <!-- Aviso de Spoiler -->
          <div
            v-if="comment.is_spoiler && !revealedSpoilers.has(comment.id)"
            class="spoiler-card"
            @click="revealedSpoilers.add(comment.id)"
          >
            <svg viewBox="0 0 24 24" class="spoiler-icon"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/></svg>
            <span>Contém spoiler! Clique para revelar</span>
          </div>
          <div v-else class="comment-text">
            {{ comment.content }}
          </div>

          <div class="comment-footer">
            <!-- Botão Curtir -->
            <button
              type="button"
              class="like-btn"
              :class="{ liked: comment.liked_by_me }"
              @click="toggleLike(comment)"
            >
              <svg viewBox="0 0 24 24" class="like-icon" :style="{ fill: comment.liked_by_me ? '#f87171' : 'none' }">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span class="mono">{{ comment.likes_count }}</span>
            </button>

            <!-- Botão Responder -->
            <button
              type="button"
              class="reply-btn mono"
              @click="replyToUser(comment.user.username)"
            >
              Responder
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Formulário de Novo Comentário -->
    <form @submit.prevent="submitComment" class="new-comment-form">
      <div class="form-header-options">
        <label class="spoiler-toggle-label">
          <input type="checkbox" v-model="isSpoiler" class="spoiler-checkbox" />
          <span class="mono">Contém Spoiler</span>
        </label>
      </div>

      <div class="input-send-row">
        <textarea
          ref="commentInputRef"
          v-model="newCommentText"
          placeholder="O que achou deste episódio? Discuta com os amigos..."
          rows="2"
          class="comment-textarea"
          required
        ></textarea>
        <button
          type="submit"
          class="send-comment-btn"
          :disabled="submitting || !newCommentText.trim()"
          title="Enviar comentário"
        >
          <svg viewBox="0 0 24 24" class="send-icon"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { capyShowTimeApi, type EpisodeComment } from '@/api/capyshowtime'

const props = defineProps<{
  episodeId: number | null
}>()

const emit = defineEmits<{
  (e: 'comment-added'): void
}>()

const authStore = useAuthStore()

const comments = ref<EpisodeComment[]>([])
const loading = ref(false)
const submitting = ref(false)
const newCommentText = ref('')
const isSpoiler = ref(false)
const revealedSpoilers = ref<Set<number>>(new Set())

const editingCommentId = ref<number | null>(null)
const editCommentText = ref('')
const commentInputRef = ref<HTMLTextAreaElement | null>(null)

watch(() => props.episodeId, (id) => {
  if (id) {
    loadComments(id)
  } else {
    comments.value = []
  }
}, { immediate: true })

async function loadComments(epId: number) {
  loading.value = true
  try {
    const list = await capyShowTimeApi.getEpisodeComments(epId)
    comments.value = list
  } catch (err) {
    console.warn('[CapyFlix] Falha ao carregar comentários:', err)
  } finally {
    loading.value = false
  }
}

async function submitComment() {
  if (!props.episodeId || !newCommentText.value.trim() || submitting.value) return

  submitting.value = true
  try {
    const created = await capyShowTimeApi.addEpisodeComment(
      props.episodeId,
      newCommentText.value.trim(),
      isSpoiler.value
    )
    comments.value.unshift(created)
    newCommentText.value = ''
    isSpoiler.value = false
    emit('comment-added')
  } catch (err) {
    console.error('Erro ao enviar comentário:', err)
  } finally {
    submitting.value = false
  }
}

async function toggleLike(comment: EpisodeComment) {
  try {
    const res = await capyShowTimeApi.toggleCommentLike(comment.id)
    comment.liked_by_me = res.liked
    comment.likes_count = res.likes_count
  } catch (err) {
    console.error('Erro ao curtir comentário:', err)
  }
}

function startEdit(comment: EpisodeComment) {
  editingCommentId.value = comment.id
  editCommentText.value = comment.content
}

function cancelEdit() {
  editingCommentId.value = null
  editCommentText.value = ''
}

async function saveEdit(commentId: number) {
  if (!editCommentText.value.trim()) return
  try {
    const updated = await capyShowTimeApi.updateComment(commentId, editCommentText.value.trim())
    const c = comments.value.find(item => item.id === commentId)
    if (c) {
      c.content = updated.content
      c.is_spoiler = updated.is_spoiler
    }
    cancelEdit()
  } catch (err) {
    console.error('Erro ao salvar comentário:', err)
  }
}

async function deleteComment(commentId: number) {
  if (!confirm('Deseja realmente excluir seu comentário?')) return
  try {
    await capyShowTimeApi.deleteComment(commentId)
    comments.value = comments.value.filter(c => c.id !== commentId)
  } catch (err) {
    console.error('Erro ao excluir comentário:', err)
  }
}

function replyToUser(username: string) {
  newCommentText.value = `@${username} ` + newCommentText.value
  if (commentInputRef.value) {
    commentInputRef.value.focus()
  }
}
</script>

<style scoped>
.comments-section {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-top: 24px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  width: 20px;
  height: 20px;
  color: var(--color-accent);
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: 0.5px;
}

.comments-counter {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-dim);
  letter-spacing: 1px;
}

/* Loading */
.comments-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 30px 0;
  justify-content: center;
}

.retro-spinner-mini {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(245, 197, 24, 0.2);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 13px;
  color: var(--text-muted);
}

/* Sem comentários */
.no-comments-box {
  text-align: center;
  padding: 32px 16px;
  background: var(--bg-surface-elevated);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.no-comments-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.no-comments-desc {
  font-size: 12px;
  color: var(--text-dim);
  margin-top: 4px;
}

/* Lista de comentários */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.comment-card {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  transition: border-color 0.2s;
}

.comment-card:hover {
  border-color: var(--color-border);
}

.comment-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-primary);
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.author-names {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.comment-time {
  font-size: 11px;
  color: var(--text-dim);
}

.author-actions {
  display: flex;
  gap: 6px;
}

.action-mini-btn {
  color: var(--text-dim);
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s;
}

.action-mini-btn .icon {
  width: 14px;
  height: 14px;
}

.action-mini-btn:hover {
  color: var(--color-accent);
}

.action-mini-btn.danger:hover {
  color: var(--color-danger);
}

/* Spoiler */
.spoiler-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(245, 197, 24, 0.08);
  border: 1px dashed var(--color-accent);
  color: var(--color-accent);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
}

.spoiler-icon {
  width: 16px;
  height: 16px;
}

.comment-text {
  font-size: 13px;
  color: var(--text-main);
  line-height: 1.5;
  white-space: pre-wrap;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 10px;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 700;
  transition: color 0.2s;
}

.like-icon {
  width: 14px;
  height: 14px;
}

.like-btn.liked {
  color: #f87171;
}

.like-btn:hover {
  color: #f87171;
}

.reply-btn {
  font-size: 11px;
  color: var(--text-dim);
  font-weight: 700;
  transition: color 0.2s;
}

.reply-btn:hover {
  color: var(--color-accent);
}

/* Edição */
.edit-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-cancel {
  font-size: 11px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-dim);
}

.btn-save {
  font-size: 11px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: #12100e;
  font-weight: 700;
}

/* Novo Comentário */
.new-comment-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px;
}

.form-header-options {
  display: flex;
  justify-content: flex-end;
}

.spoiler-toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-dim);
  cursor: pointer;
}

.spoiler-checkbox {
  accent-color: var(--color-accent);
}

.input-send-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.comment-textarea {
  flex: 1;
  background: var(--bg-app);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  color: #fff;
  font-size: 13px;
  outline: none;
  resize: vertical;
  min-height: 52px;
  transition: border-color 0.2s;
}

.comment-textarea:focus {
  border-color: var(--color-accent);
}

.send-comment-btn {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: #12100e;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, filter 0.2s;
  flex-shrink: 0;
}

.send-comment-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.send-comment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-icon {
  width: 18px;
  height: 18px;
}
</style>
