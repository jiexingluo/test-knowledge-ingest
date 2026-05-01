import { NextRequest, NextResponse } from "next/server";
import {
  startIngest,
  getIngestProgress,
  completeIngest,
} from "@/lib/ingest/pipeline";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const progress = getIngestProgress(id);
  return NextResponse.json(progress || { status: "idle" });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { action, roundNumber, projectNames } = body;

  if (action === "complete") {
    const result = await completeIngest(id, roundNumber);
    return NextResponse.json(result);
  }

  await startIngest(id, projectNames);
  return NextResponse.json({ status: "started" });
}
