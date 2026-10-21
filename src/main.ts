import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  const checkSwUpdate = () => {
    navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {})
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkSwUpdate()
    }
  })

  setInterval(checkSwUpdate, 30 * 60 * 1000)
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
