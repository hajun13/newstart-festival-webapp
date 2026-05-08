import { getMockState, setMockState } from "@/lib/server/mock-db";
import { verifyFinal } from "@/lib/state";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { teamId } = (await request.json()) as { teamId: string };
  const result = verifyFinal(getMockState(), teamId);
  setMockState(result.state);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
