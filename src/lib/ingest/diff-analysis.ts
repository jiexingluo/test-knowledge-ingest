import { aiGenerateText } from "@/lib/ai/provider";
import { getPromptTemplate } from "@/lib/builder/config";
import { listKBEntries } from "@/lib/storage/knowledge-base";
import type {
  EntityMap,
  CrossProjectAnalysis,
  DiffReport,
} from "@/types";

export async function analyzeDiff(
  workspaceId: string,
  newEntityMaps: EntityMap[],
  newAnalysis: CrossProjectAnalysis
): Promise<DiffReport> {
  const existingKnowledge = await listKBEntries(workspaceId, "knowledge");
  const existingKnowhow = await listKBEntries(workspaceId, "knowhow");
  const allExisting = [...existingKnowledge, ...existingKnowhow];

  if (allExisting.length === 0) {
    return { newEntries: [], strengthened: [], refined: [], conflicts: [] };
  }

  const promptTemplate = await getPromptTemplate("diff-analysis");

  const existingSummary = allExisting.map((e) => ({
    id: e.id,
    type: e.type,
    title: e.title,
    summary: e.summary,
    action: e.action,
    scope: e.scope,
    evidenceCount: e.evidence.length,
  }));

  const prompt = promptTemplate
    .replace("{{EXISTING_KB}}", JSON.stringify(existingSummary, null, 2))
    .replace("{{NEW_ENTITY_MAPS}}", JSON.stringify(newEntityMaps, null, 2))
    .replace("{{NEW_ANALYSIS}}", JSON.stringify(newAnalysis, null, 2));

  const system =
    "You are an ATE knowledge management expert. Compare new findings against existing knowledge. Return valid JSON only.";

  const response = await aiGenerateText(system, prompt);

  try {
    const parsed = JSON.parse(extractJSON(response));
    return {
      newEntries: parsed.newEntries || [],
      strengthened: parsed.strengthened || [],
      refined: parsed.refined || [],
      conflicts: parsed.conflicts || [],
    };
  } catch {
    return { newEntries: [], strengthened: [], refined: [], conflicts: [] };
  }
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  return text;
}
