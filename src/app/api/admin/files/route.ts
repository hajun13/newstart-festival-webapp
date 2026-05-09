import { hasAdminCookie } from "@/lib/server/app-state";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS } from "@/lib/supabase/storage";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!hasAdminCookie(await cookies())) {
    return NextResponse.json({ ok: false, message: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const url = new URL(request.url);
  const fullPath = url.searchParams.get("path") ?? "";
  const prefix = `${STORAGE_BUCKETS.missionSubmissions}/`;
  if (!fullPath.startsWith(prefix)) {
    return NextResponse.json({ ok: false, message: "잘못된 파일 경로입니다." }, { status: 400 });
  }

  const objectPath = fullPath.slice(prefix.length);
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.missionSubmissions)
    .createSignedUrl(objectPath, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { ok: false, message: error?.message ?? "파일 URL 생성 실패" },
      { status: 404 }
    );
  }

  return NextResponse.redirect(data.signedUrl, 302);
}
