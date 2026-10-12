import "./appRuntime";
import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";

// Safari can resume an earlier /store-select memory page without a bfcache
// pageshow event. Compare only that route's loaded hashed bundle to a fresh
// no-store SPA entry when it returns to the foreground, then reload only if
// the release actually differs.
if (typeof window !== "undefined") {
  const STORE_SELECT_ROUTE = "/store-select";
  let storeSelectReleaseProbeInFlight = false;

  const getLoadedStoreSelectBundle = () =>
    Array.from(document.scripts)
      .map(script => script.src)
      .filter(Boolean)
      .find(source => {
        try {
          return /\/assets\/index-[^/]+\.js$/.test(
            new URL(source, window.location.href).pathname
          );
        } catch {
          return false;
        }
      });

  const refreshStoreSelectIfReleaseChanged = () => {
    if (
      window.location.pathname !== STORE_SELECT_ROUTE ||
      storeSelectReleaseProbeInFlight
    ) {
      return;
    }
    const loadedBundle = getLoadedStoreSelectBundle();
    if (!loadedBundle) return;

    storeSelectReleaseProbeInFlight = true;
    void fetch(`${STORE_SELECT_ROUTE}?__release_probe=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
      .then(response => response.text())
      .then(html => {
        const latestBundlePath = html.match(/\/assets\/index-[^"']+\.js/)?.[0];
        if (!latestBundlePath) return;
        const latestBundle = new URL(latestBundlePath, window.location.origin).href;
        if (latestBundle !== loadedBundle) window.location.reload();
      })
      .catch(() => {
        // A transient network failure must not disrupt an already working page.
      })
      .finally(() => {
        storeSelectReleaseProbeInFlight = false;
      });
  };

  window.addEventListener("pageshow", event => {
    if ((event as PageTransitionEvent).persisted) {
      window.location.reload();
      return;
    }
    refreshStoreSelectIfReleaseChanged();
  });
  window.addEventListener("focus", refreshStoreSelectIfReleaseChanged);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshStoreSelectIfReleaseChanged();
    }
  });
}

const queryClient = new QueryClient();

// API base URL: empty (relative) for the website; set VITE_API_BASE_URL at build
// time for the native app build so the bundled frontend talks to the remote API.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_BASE_URL}/api/trpc`,
      transformer: superjson,
      headers() {
        // Preview auto-login fallback: when the browser blocks iframe cookies
        // (Safari ITP / private browsing / WebView), the runtime mirrors the
        // session into sessionStorage so we can forward it as a Bearer token.
        // The regular OAuth cookie flow keeps working and takes priority server-side.
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
