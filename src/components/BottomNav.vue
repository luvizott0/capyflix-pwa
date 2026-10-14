<template>
  <nav class="bottom-nav">
    <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
      <svg viewBox="0 0 24 24" class="icon"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/></svg>
      <span class="nav-label">Início</span>
    </router-link>

    <router-link to="/search" class="nav-item" :class="{ active: $route.path === '/search' }">
      <svg viewBox="0 0 24 24" class="icon"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
      <span class="nav-label">Busca</span>
    </router-link>

    <router-link to="/favorites" class="nav-item" :class="{ active: $route.path === '/favorites' }">
      <svg viewBox="0 0 24 24" class="icon"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>
      <span class="nav-label">Favoritos</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(56px + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background: rgba(18, 16, 14, 0.95);
  backdrop-filter: blur(16px);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 90;
}

@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: var(--text-dim);
  transition: color 0.2s, transform 0.2s;
  padding: 6px 12px;
}

.nav-item .icon {
  width: 22px;
  height: 22px;
}

.nav-label {
  font-size: 10px;
  font-family: var(--font-heading);
  letter-spacing: 0.5px;
}

.nav-item.active {
  color: var(--color-accent);
  transform: translateY(-2px);
}
</style>
