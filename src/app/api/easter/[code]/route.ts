import { getMockState, setMockState } from "@/lib/server/mock-db";
import { claimEasterEgg } from "@/lib/state";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { teamId } = (await request.json()) as { teamId: string };
  try {
    const result = claimEasterEgg(getMockState(), teamId, code);
    setMockState(result.state);
    return NextResponse.json({ ok: true, claim: result.claim, message: result.message });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "히든 QR 처리 실패" },
      { status: 400 }
    );
  }
}
