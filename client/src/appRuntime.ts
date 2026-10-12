// Native-app runtime shim.
// When the frontend is bundled inside the Capacitor app (served from
// capacitor:// or http://localhost), relative paths like /api/* and
// /manus-storage/* must be rewritten to the remote production origin.
// On the website itself VITE_API_BASE_URL is empty and this module is a no-op.

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

function isRelativeBackendPath(u: string): boolean {
  return u.startsWith("/api/") || u.startsWith("/manus-storage/");
}

export function toAbsoluteUrl(u: string): string {
  if (BASE && isRelativeBackendPath(u)) return `${BASE}${u}`;
  return u;
}

if (BASE) {
  // 1) fetch: rewrite relative backend calls
  const origFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && isRelativeBackendPath(input)) {
      input = `${BASE}${input}`;
    } else if (input instanceof Request && isRelativeBackendPath(new URL(input.url, "http://x").pathname) && input.url.startsWith("/")) {
      input = new Request(`${BASE}${input.url}`, input);
    }
    return origFetch(input as RequestInfo | URL, init);
  }) as typeof fetch;

  // 2) media elements: rewrite src/href attributes pointing at backend paths
  const patchSrc = (proto: object, attr: string) => {
    const desc = Object.getOwnPropertyDescriptor(proto, attr);
    if (!desc?.set) return;
    Object.defineProperty(proto, attr, {
      ...desc,
      set(this: HTMLElement, value: string) {
        desc.set!.call(this, typeof value === "string" ? toAbsoluteUrl(value) : value);
      },
    });
  };
  patchSrc(HTMLImageElement.prototype, "src");
  patchSrc(HTMLMediaElement.prototype, "src");
  patchSrc(HTMLSourceElement.prototype, "src");
  patchSrc(HTMLAnchorElement.prototype, "href");

  // 3) setAttribute fallback (React uses property setters, but cover both)
  const origSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name: string, value: string) {
    if ((name === "src" || name === "href") && typeof value === "string") {
      value = toAbsoluteUrl(value);
    }
    return origSetAttribute.call(this, name, value);
  };
}
