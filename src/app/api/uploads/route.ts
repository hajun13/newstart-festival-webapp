import { getTeamCookie } from "@/lib/server/app-state";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS, buildMissionSubmissionPath } from "@/lib/supabase/storage";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function ensureBucket() {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase.storage.listBuckets();
  if (data?.some((bucket) => bucket.name === STORAGE_BUCKETS.missionSubmissions)) {
    return supabase;
  }
  const { error } = await supabase.storage.createBucket(STORAGE_BUCKETS.missionSubmissions, {
    public: false,
    fileSizeLimit: 4 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"]
  });
  if (error && !error.message.toLowerCase().includes("already exists")) throw error;
  return supabase;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const teamId = String(formData.get("teamId") ?? "");
  const missionCode = String(formData.get("missionCode") ?? "");
  const file = formData.get("file");
  const cookieTeamId = getTeamCookie(await cookies());

  if (!teamId || cookieTeamId !== teamId) {
    return NextResponse.json({ ok: false, message: "팀 인증이 필요합니다." }, { status: 401 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "파일이 없습니다." }, { status: 400 });
  }
  if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: "이미지는 4MB 이하만 업로드할 수 있습니다." }, { status: 400 });
  }

  const supabase = await ensureBucket();
  const path = buildMissionSubmissionPath({ teamId, missionCode, filename: file.name });
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.missionSubmissions)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false
    });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    path: `${STORAGE_BUCKETS.missionSubmissions}/${path}`,
    name: file.name
  });
}
