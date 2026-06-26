import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { worker } from "./mocks/browser";
import "./styles/tokens.css";
import "./styles/global.css";

async function bootstrap() {
  // MSW only in dev (and when service workers are available).
  if (import.meta.env.DEV) {
    try {
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: { url: "/mockServiceWorker.js" },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("MSW worker failed to start; falling back to live fetch.", err);
    }
  }

  const rootEl = document.getElementById("root");
  if (!rootEl) {
    throw new Error("#root element not found in index.html");
  }
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
