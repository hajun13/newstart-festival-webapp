import { ADMIN_SESSION_COOKIE } from "@/lib/server/app-state";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  const configuredPassword =
    process.env.ADMIN_PASSWORD ??
    (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false" ? undefined : "NEWSTART-ADMIN-2026");

  if (!configuredPassword) {
    return NextResponse.json(
      { ok: false, message: "ADMIN_PASSWORD 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  if (password !== configuredPassword) {
    return NextResponse.json(
      { ok: false, message: "관리자 비밀번호를 확인해 주세요." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}
