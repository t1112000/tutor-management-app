/**
 * The app runs as a Next standalone server bound to HOSTNAME=0.0.0.0 behind
 * nginx/Cloudflare, so `request.nextUrl` reports `https://0.0.0.0:3000/...`.
 * Anything user-facing (redirects, callbackUrl) must be derived from the
 * forwarded / Host headers instead, which also keeps both public domains working.
 */

function firstValue(v: string | null): string | null {
  const first = v?.split(",")[0]?.trim();
  return first ? first : null;
}

/** Public origin (scheme + host) as seen by the browser. */
export function publicOrigin(headers: Headers, fallback: string): string {
  const host = firstValue(headers.get("x-forwarded-host")) ?? firstValue(headers.get("host"));
  if (!host) return new URL(fallback).origin;
  const proto =
    firstValue(headers.get("x-forwarded-proto")) ??
    (/^(localhost|127\.|0\.0\.0\.0)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Only same-site relative paths are accepted as a post-login target; anything
 * else (absolute URLs, `//evil.com`, backslash tricks) falls back to "/".
 */
export function safeCallbackPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/";
  return raw;
}

/** Absolute sign-in URL carrying a *relative* callbackUrl (path + search). */
export function buildSignInUrl(requestUrl: string, headers: Headers): URL {
  const req = new URL(requestUrl);
  const url = new URL("/signin", publicOrigin(headers, requestUrl));
  const callback = safeCallbackPath(req.pathname + req.search);
  if (callback !== "/") url.searchParams.set("callbackUrl", callback);
  return url;
}
