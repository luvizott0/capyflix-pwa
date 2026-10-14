<template>
  <div class="comments-section">
    <div class="comments-header">
      <div class="header-left">
        <MessageSquare :size="18" class="header-icon" />
        <h3 class="section-title mono">Debate do Episódio</h3>
      </div>
      <span class="comments-counter mono">{{ comments.length }} comentários</span>
    </div>

    <!-- Feed de Comentários -->
    <div v-if="loading" class="comments-loading">
      <div class="spinner"></div>
      <span class="loading-text">Carregando comentários...</span>
    </div>

    <div v-else-if="comments.length === 0" class="no-comments-box">
      <p class="no-comments-title">Nenhum comentário ainda neste episódio!</p>
      <p class="no-comments-desc">Seja o primeiro a mandar sua opinião ou teoria.</p>
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
              <Pencil :size="14" />
            </button>
            <button
              type="button"
              class="action-mini-btn danger"
              title="Excluir comentário"
              @click="deleteComment(comment.id)"
            >
              <Trash2 :size="14" />
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
            <button type="button" class="btn-save mono" @click="saveEdit(comment.id)">Salvar</button>
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
            <AlertTriangle :size="15" />
            <span>Contém spoiler! Toque para revelar</span>
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
              <Heart :size="14" :fill="comment.liked_by_me ? 'currentColor' : 'none'" />
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
          <Send :size="16" />
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { MessageSquare, Heart, Send, Pencil, Trash2, AlertTriangle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { capyShowTimeApi, type EpisodeComment } from '@/api/capyshowtime'

const props = defineProps<{
  episodeId: number | null
}>()

const authStore = useAuthStore()

const comments = ref<EpisodeComment[]>([])
const loading = ref(false)
const submitting = ref(false)
const newCommentText = ref('')
const isSpoiler = ref(false)
const commentInputRef = ref<HTMLTextAreaElement | null>(null)

const editingCommentId = ref<number | null>(null)
const editCommentText = ref('')
const revealedSpoilers = ref<Set<number>>(new Set())

watch(
  () => props.episodeId,
  (newId) => {
    if (newId) {
      loadComments(newId)
    } else {
      comments.value = []
    }
  },
  { immediate: true }
)

async function loadComments(epId: number) {
  loading.value = true
  try {
    const res = await capyShowTimeApi.getEpisodeComments(epId)
    if (res.data?.comments) {
      comments.value = res.data.comments
    }
  } catch (err) {
    console.warn('Erro ao carregar comentários do episódio:', err)
  } finally {
    loading.value = false
  }
}

async function submitComment() {
  if (!props.episodeId || !newCommentText.value.trim() || submitting.value) return

  submitting.value = true
  try {
    const res = await capyShowTimeApi.addEpisodeComment(props.episodeId, {
      content: newCommentText.value.trim(),
      is_spoiler: isSpoiler.value
    })

    if (res.data?.comment) {
      comments.value.push(res.data.comment)
      newCommentText.value = ''
      isSpoiler.value = false
    }
  } catch (err) {
    console.error('Falha ao enviar comentário:', err)
  } finally {
    submitting.value = false
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
    const res = await capyShowTimeApi.updateComment(commentId, editCommentText.value.trim())
    const updated = res.data?.comment
    if (updated) {
      const idx = comments.value.findIndex(c => c.id === commentId)
      if (idx !== -1) {
        comments.value[idx].content = updated.content
      }
    }
    editingCommentId.value = null
  } catch (err) {
    console.error('Erro ao salvar comentário:', err)
  }
}

async function deleteComment(commentId: number) {
  if (!confirm('Deseja excluir seu comentário?')) return

  try {
    await capyShowTimeApi.deleteComment(commentId)
    comments.value = comments.value.filter(c => c.id !== commentId)
  } catch (err) {
    console.error('Erro ao excluir comentário:', err)
  }
}

async function toggleLike(comment: EpisodeComment) {
  const previousState = comment.liked_by_me
  comment.liked_by_me = !comment.liked_by_me
  comment.likes_count += comment.liked_by_me ? 1 : -1

  try {
    await capyShowTimeApi.toggleCommentLike(comment.id)
  } catch (err) {
    comment.liked_by_me = previousState
    comment.likes_count += previousState ? 1 : -1
  }
}

function replyToUser(username: string) {
  newCommentText.value = `@${username} ` + newCommentText.value
  if (commentInputRef.value) {
    commentInputRef.value.focus()
  }
}

onMounted(() => {
  if (props.episodeId) {
    loadComments(props.episodeId)
  }
})
</script>

<style scoped>
.comments-section {
  margin-top: 28px;
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 18px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: var(--color-accent);
}

.comments-counter {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.comments-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 0;
}

.loading-text {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.no-comments-box {
  text-align: center;
  padding: 24px 12px;
  background-color: var(--bg-surface-elevated);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
}

.no-comments-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-main);
}

.no-comments-desc {
  font-size: 0.78rem;
  color: var(--text-dim);
  margin-top: 2px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.comment-card {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  transition: border-color 0.2s;
}

.comment-card.my-comment {
  border-color: rgba(245, 197, 24, 0.2);
}

.comment-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  border: 1px solid var(--color-primary);
}

.avatar-placeholder {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary);
  color: #fff;
  font-size: 0.75rem;
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
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.2;
}

.comment-time {
  font-size: 0.7rem;
  color: var(--text-dim);
}

.author-actions {
  display: flex;
  gap: 4px;
}

.action-mini-btn {
  color: var(--text-dim);
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s;
}

.action-mini-btn:hover {
  color: var(--text-main);
}

.action-mini-btn.danger:hover {
  color: var(--color-danger);
}

.spoiler-card {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(245, 197, 24, 0.08);
  border: 1px dashed var(--color-accent);
  color: var(--color-accent);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  cursor: pointer;
  margin: 4px 0;
}

.comment-text {
  font-size: 0.85rem;
  color: var(--text-main);
  line-height: 1.45;
  white-space: pre-wrap;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 8px;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-dim);
  font-size: 0.75rem;
  font-weight: 600;
  transition: color 0.2s;
}

.like-btn:hover {
  color: var(--text-main);
}

.like-btn.liked {
  color: var(--color-danger);
}

.reply-btn {
  font-size: 0.72rem;
  color: var(--color-primary-light);
  font-weight: 600;
}

.reply-btn:hover {
  color: var(--color-accent);
}

.edit-box {
  margin-top: 6px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.btn-cancel {
  font-size: 0.75rem;
  padding: 4px 10px;
  color: var(--text-dim);
  border-radius: var(--radius-sm);
}

.btn-save {
  font-size: 0.75rem;
  padding: 4px 10px;
  background-color: var(--color-accent);
  color: #12100e;
  border-radius: var(--radius-sm);
  font-weight: 700;
}

/* Formulário de novo comentário */
.new-comment-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.form-header-options {
  display: flex;
  justify-content: flex-end;
}

.spoiler-toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--text-dim);
  cursor: pointer;
}

.spoiler-checkbox {
  accent-color: var(--color-accent);
}

.input-send-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.comment-textarea {
  flex: 1;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  color: var(--text-main);
  font-size: 0.85rem;
  resize: vertical;
  outline: none;
  font-family: inherit;
}

.comment-textarea:focus {
  border-color: var(--color-accent);
}

.send-comment-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background-color: var(--color-accent);
  color: #12100e;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.send-comment-btn:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
  transform: translateY(-1px);
}

.send-comment-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
