import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Mantém os arquivos das versões anteriores em dist/assets: quem está com o site
    // aberto de antes de um deploy continua conseguindo abrir as páginas (os nomes
    // têm hash, então não há conflito). Limpeza dos antigos: cron na VPS (>30 dias).
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-i18n':     ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'vendor-map':      ['leaflet'],
          'vendor-carousel': ['embla-carousel-react', 'embla-carousel-autoplay'],
        },
      },
    },
  },
});
