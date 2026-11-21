import { NextResponse } from "next/server";
import { getBuildId } from "@/lib/build-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Which build this server is running. Unauthenticated on purpose: an open tab
 * or installed PWA polls it to find out it is stale (see VersionWatcher), and
 * it has to answer even when the session has expired. It discloses nothing but
 * an opaque build stamp.
 */
export function GET() {
  return NextResponse.json({ buildId: getBuildId() }, { headers: { "Cache-Control": "no-store" } });
}
