import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

apiClient.interceptors.request.use(config => {
  // Compartilha autenticação com o ecossistema CapiHouse
  const token =
    localStorage.getItem('capyflix_token') ||
    localStorage.getItem('capyshowtime_token') ||
    localStorage.getItem('capihouse_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('capyflix_token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
