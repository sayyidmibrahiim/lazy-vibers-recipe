import { NextResponse } from "next/server";

/** Generator 5-dokumen lama hanya aktif bila ENABLE_LEGACY_GENERATOR=1. */
export function legacyEnabled(): boolean {
  return process.env.ENABLE_LEGACY_GENERATOR === "1";
}

export const LEGACY_DISABLED_MESSAGE =
  "Generator lama dinonaktifkan. Setel ENABLE_LEGACY_GENERATOR=1 untuk mengaktifkannya.";

/** Mengembalikan respons 404 bila generator lama mati, atau null bila boleh lanjut. */
export function legacyGuard(): NextResponse | null {
  if (legacyEnabled()) return null;
  return NextResponse.json({ error: LEGACY_DISABLED_MESSAGE }, { status: 404 });
}
