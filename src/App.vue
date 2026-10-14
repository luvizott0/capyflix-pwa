<template>
  <div class="app-root">
    <HeaderNav v-if="authStore.isAuthenticated && $route.name !== 'login'" />

    <main class="main-content">
      <router-view />
    </main>

    <BottomNav v-if="authStore.isAuthenticated && $route.name !== 'login'" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import HeaderNav from '@/components/HeaderNav.vue'
import BottomNav from '@/components/BottomNav.vue'

const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.token && !authStore.user) {
    await authStore.checkAuth()
  }
})
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>
