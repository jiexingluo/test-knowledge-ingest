import { nanoid } from "nanoid";
import { aiGenerateText } from "@/lib/ai/provider";
import {
  getPromptTemplate,
  getOutputSchema,
} from "@/lib/builder/config";
import {
  saveKBEntry,
  saveKBGraph,
  saveKBIndex,
  saveKBMeta,
  listKBEntries,
  getKBMeta,
} from "@/lib/storage/knowledge-base";
import type {
  CrossProjectAnalysis,
  Question,
  KBEntry,
  KBGraph,
  KBMeta,
  DiffReport,
} from "@/types";

export async function assembleKB(
  workspaceId: string,
  chipType: string,
  analysis: CrossProjectAnalysis,
  questions: Question[],
  projectNames: string[],
  diffReport?: DiffReport
): Promise<{ entryCount: number }> {
  const promptTemplate = await getPromptTemplate("kb-assembly");
  const knowledgeSchema = await getOutputSchema("knowledge");
  const knowhowSchema = await getOutputSchema("knowhow");

  const answeredQuestions = questions
    .filter((q) => q.answer)
    .map((q) => ({
      id: q.id,
      title: q.title,
      category: q.category,
      selectedOption:
        q.answer!.selectedOption !== null
          ? q.options[q.answer!.selectedOption]?.label
          : null,
      customText: q.answer!.customText,
    }));

  const prompt = promptTemplate
    .replace("{{CHIP_TYPE}}", chipType)
    .replace("{{ANALYSIS}}", JSON.stringify(analysis, null, 2))
    .replace("{{ANSWERS}}", JSON.stringify(answeredQuestions, null, 2))
    .replace("{{KNOWLEDGE_SCHEMA}}", JSON.stringify(knowledgeSchema, null, 2))
    .replace("{{KNOWHOW_SCHEMA}}", JSON.stringify(knowhowSchema, null, 2));

  const system =
    "You are an ATE knowledge base builder. Assemble structured knowledge entries from analysis and expert answers. Write content in Chinese. Return valid JSON only.";

  const response = await aiGenerateText(system, prompt);

  let entries: KBEntry[] = [];
  let graph: KBGraph = { nodes: [], edges: [] };

  try {
    const parsed = JSON.parse(extractJSON(response));
    const rawEntries = parsed.entries || [];
    const now = new Date().toISOString();

    entries = rawEntries.map((e: Partial<KBEntry>) => ({
      id: e.id || `${e.type === "knowledge" ? "k" : "kh"}-${nanoid(8)}`,
      type: e.type || "knowhow",
      title: e.title || "",
      summary: e.summary || "",
      context: e.context || "",
      triggerConditions: e.triggerConditions,
      action: e.action || "",
      scope: e.scope || { chipType, universal: false },
      evidence: e.evidence || [],
      sourceAnchors: e.sourceAnchors || [],
      relatedItems: e.relatedItems || [],
      openQuestions: e.openQuestions || [],
      reviewNotes: e.reviewNotes || [],
      reviewStatus: "draft" as const,
      createdAt: now,
      updatedAt: now,
      version: 1,
      dialogueHistory: e.dialogueHistory || [],
    }));

    graph = parsed.graph || { nodes: [], edges: [] };
    if (graph.nodes.length === 0) {
      graph.nodes = entries.map((e) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        group: e.scope.chipType,
      }));
    }
  } catch {
    // AI 返回了无法解析的响应
  }

  // 增量模式下合并已有条目
  const existingKnowledge = await listKBEntries(workspaceId, "knowledge");
  const existingKnowhow = await listKBEntries(workspaceId, "knowhow");
  const existingEntries = [...existingKnowledge, ...existingKnowhow];

  if (diffReport && existingEntries.length > 0) {
    for (const strengthened of diffReport.strengthened) {
      if (!strengthened.existingEntryId) continue;
      const existing = existingEntries.find(
        (e) => e.id === strengthened.existingEntryId
      );
      if (existing) {
        existing.evidence.push(...strengthened.evidence);
        existing.version += 1;
        existing.updatedAt = new Date().toISOString();
        await saveKBEntry(workspaceId, existing);
      }
    }
  }

  for (const entry of entries) {
    await saveKBEntry(workspaceId, entry);
  }

  const allEntries = [
    ...existingEntries,
    ...entries,
  ];
  await saveKBGraph(workspaceId, graph);
  await saveKBIndex(workspaceId, allEntries);

  const existingMeta = await getKBMeta(workspaceId);
  const meta: KBMeta = {
    workspaceId,
    chipType,
    version: (existingMeta?.version || 0) + 1,
    createdAt: existingMeta?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceProjects: projectNames,
    stats: {
      knowledgeCount: allEntries.filter((e) => e.type === "knowledge").length,
      knowhowCount: allEntries.filter((e) => e.type === "knowhow").length,
      openQuestions: allEntries.reduce(
        (sum, e) => sum + e.openQuestions.length,
        0
      ),
    },
  };
  await saveKBMeta(workspaceId, meta);

  return { entryCount: entries.length };
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  return text;
}
