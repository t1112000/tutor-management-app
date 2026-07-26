import { NextResponse } from "next/server";
import { sequelize } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Unauthenticated liveness probe for the container healthcheck and the
 * post-deploy smoke test. Returns 503 when the database is unreachable so a
 * failed migration or a down DB does not look like a successful deploy.
 */
export async function GET() {
  try {
    await sequelize.query("SELECT 1");
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { ok: false, error: "database unreachable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
