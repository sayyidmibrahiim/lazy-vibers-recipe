import { NextResponse } from "next/server";

/** The legacy generator is enabled by ENABLE_LEGACY_GENERATOR=1. */
export function legacyEnabled(): boolean {
  return process.env.ENABLE_LEGACY_GENERATOR === "1";
}

export const LEGACY_DISABLED_MESSAGE =
  "The legacy generator is disabled. Set ENABLE_LEGACY_GENERATOR=1 to enable it.";

/** Return a 404 response if the legacy generator is disabled. */
export function legacyGuard(): NextResponse | null {
  if (legacyEnabled()) return null;
  return NextResponse.json({ error: LEGACY_DISABLED_MESSAGE }, { status: 404 });
}
