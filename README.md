# 🎬 CapyFlix - Cinema & Streaming Retrô da CapiHouse

O **CapyFlix** é o serviço de streaming leve de animes, filmes e séries dos moradores da **CapiHouse**, construído com estética retrô acolhedora e otimizado para **Direct Play** (zero travamentos e uso mínimo de recursos).

---

## ✨ Características Principais

- 🚀 **Zero Gargalo (Direct Play):** Reprodução direta com aceleração de hardware no navegador e suporte a requisições de Byte-Range (HTTP 206) via Nginx.
- 🦫 **Autenticação Integrada com a CapiHouse:** Compartilhamento automático de credenciais e tokens da CapiHouse / CapyShowTime.
- 📺 **Player de Vídeo Retrô Customizado:** Motor **HLS.js** para streams m3u8 e suporte nativo a MP4/WebM, controle de velocidade (`0.75x` até `2x`), atalhos de teclado, PiP e salvamento automático de progresso.
- ⚡ **Busca Instantânea Client-Side:** Busca difusa ultrarrápida via **Fuse.js** inspirada no Akira Nolan.
- 📱 **PWA Instalável:** Funciona como aplicativo nativo em tela cheia no Android, iOS, PC e Smart TVs.

---

## 🛠️ Comandos de Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor local Vite (porta 5175)
npm run dev

# Compilar para produção
npm run build
```

---

## 🐳 Execução com Docker

```bash
docker build -t capyflix-pwa:latest .
docker run -d -p 8008:80 --name capyflix-pwa capyflix-pwa:latest
```
