import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Health check — verifies the app is up and Turso is reachable.
// Used for Phase 0 deploy verification (no auth required).
export async function GET() {
  const hasDbEnv = Boolean(process.env.TURSO_DATABASE_URL);

  if (!hasDbEnv) {
    return NextResponse.json(
      { status: "ok", db: "not_configured" },
      { status: 200 }
    );
  }

  try {
    await db.execute("SELECT 1");
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: "degraded", db: "error", message },
      { status: 503 }
    );
  }
}
