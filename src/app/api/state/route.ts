import { hasAdminCookie, readAppState, writeAppState } from "@/lib/server/app-state";
import type { AppState } from "@/lib/types";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    return NextResponse.json(await readAppState({ includeLoginCodes: hasAdminCookie(cookieStore) }));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "state read failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!hasAdminCookie(cookieStore)) {
      return NextResponse.json({ ok: false, message: "관리자 인증이 필요합니다." }, { status: 401 });
    }
    const state = (await request.json()) as AppState;
    await writeAppState(state);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "state write failed" },
      { status: 500 }
    );
  }
}
