import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./lib/i18n";
import { reloadOnceForNewVersion } from "./lib/lazyPage";

// Vite avisa quando falha pré-carregar dependências de uma página (arquivo de
// versão antiga após deploy) — recarrega uma vez em vez de quebrar (lib/lazyPage.ts).
window.addEventListener("vite:preloadError", (event) => {
  if (reloadOnceForNewVersion()) event.preventDefault();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
