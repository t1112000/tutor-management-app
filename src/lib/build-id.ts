import { readFileSync } from "node:fs";
import path from "node:path";

let cached: string | undefined;

/**
 * Next's own id for the build this server is running, read from
 * `.next/BUILD_ID` (present in the standalone output next to `server.js`).
 * Server-only. The root layout hands it to the client as a prop, so a page
 * keeps the id of the build that rendered it — and after a deploy, an
 * already-open client holds the old id while `/api/version` reports the new.
 *
 * Deliberately not a `NEXT_PUBLIC_*` value from `next.config.js`: the config is
 * evaluated once per build worker, so a generated stamp there comes out
 * different in the client bundle and the server.
 *
 * `"dev"` when there is no build output (`next dev`), which turns the watcher off.
 */
export function getBuildId(): string {
  if (cached === undefined) {
    try {
      cached = readFileSync(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim() || "dev";
    } catch {
      cached = "dev";
    }
  }
  return cached;
}
