import { NextRequest, NextResponse } from "next/server";
import { getWorkspace, deleteWorkspace } from "@/lib/storage/workspace";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspace = await getWorkspace(id);
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(workspace);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteWorkspace(id);
  return NextResponse.json({ ok: true });
}
