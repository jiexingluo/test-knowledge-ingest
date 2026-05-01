import { NextRequest, NextResponse } from "next/server";
import { listWorkspaces, createWorkspace } from "@/lib/storage/workspace";

export async function GET() {
  const workspaces = await listWorkspaces();
  return NextResponse.json(workspaces);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const workspace = await createWorkspace(body);
  return NextResponse.json(workspace, { status: 201 });
}
