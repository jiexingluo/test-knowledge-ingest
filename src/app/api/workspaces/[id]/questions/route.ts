import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { getWorkspace, updateWorkspace } from "@/lib/storage/workspace";
import { getWorkspaceDir } from "@/lib/server-paths";
import type { Question } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspace = await getWorkspace(id);
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const currentRound = workspace.rounds[workspace.rounds.length - 1];
  if (!currentRound) return NextResponse.json([]);

  try {
    const raw = await readFile(
      join(
        getWorkspaceDir(id),
        "ingest",
        `round-${currentRound.roundNumber}`,
        "questions.json"
      ),
      "utf-8"
    );
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { questionId, selectedOption, customText, roundNumber } = body;

  const questionsPath = join(
    getWorkspaceDir(id),
    "ingest",
    `round-${roundNumber}`,
    "questions.json"
  );

  const raw = await readFile(questionsPath, "utf-8");
  const questions: Question[] = JSON.parse(raw);

  const question = questions.find((q) => q.id === questionId);
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  question.answer = {
    selectedOption,
    customText,
    answeredAt: new Date().toISOString(),
  };

  await writeFile(questionsPath, JSON.stringify(questions, null, 2), "utf-8");

  const workspace = await getWorkspace(id);
  if (workspace) {
    const round = workspace.rounds.find((r) => r.roundNumber === roundNumber);
    if (round) {
      round.answeredCount = questions.filter((q) => q.answer).length;
    }
    await updateWorkspace(workspace);
  }

  return NextResponse.json({ ok: true });
}
