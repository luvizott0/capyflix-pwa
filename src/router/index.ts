import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import HomeView from '@/views/HomeView.vue'
import WatchView from '@/views/WatchView.vue'
import SearchView from '@/views/SearchView.vue'
import FavoritesView from '@/views/FavoritesView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/watch/:slug',
      name: 'watch',
      component: WatchView,
      meta: { requiresAuth: true }
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView,
      meta: { requiresAuth: true }
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoritesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Se tiver token mas o usuário ainda não foi carregado na memória
  if (authStore.token && !authStore.user) {
    await authStore.checkAuth()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
