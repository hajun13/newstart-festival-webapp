import { resetMockState } from "@/lib/server/mock-db";
import { NextResponse } from "next/server";

export async function POST() {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
    return NextResponse.json({ ok: false, message: "운영 모드에서는 사용할 수 없습니다." }, { status: 403 });
  }

  return NextResponse.json({ ok: true, state: resetMockState() });
}
