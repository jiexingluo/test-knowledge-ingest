import { NextRequest, NextResponse } from "next/server";
import {
  listReferences,
  saveReference,
  deleteReference,
} from "@/lib/storage/reference-shelf";

export async function GET() {
  const refs = await listReferences();
  return NextResponse.json(refs);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  const content = await file.text();
  await saveReference(file.name, content);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { filename } = await request.json();
  await deleteReference(filename);
  return NextResponse.json({ ok: true });
}
