import { NextRequest, NextResponse } from "next/server";
import {
  getKBMeta,
  listKBEntries,
  getKBGraph,
} from "@/lib/storage/knowledge-base";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const view = searchParams.get("view") || "summary";

  if (view === "graph") {
    const graph = await getKBGraph(id);
    return NextResponse.json(graph);
  }

  const meta = await getKBMeta(id);
  const knowledge = await listKBEntries(id, "knowledge");
  const knowhow = await listKBEntries(id, "knowhow");

  return NextResponse.json({
    meta,
    knowledge,
    knowhow,
  });
}
