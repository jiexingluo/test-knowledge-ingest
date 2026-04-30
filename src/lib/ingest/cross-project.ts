import { aiGenerateText } from "@/lib/ai/provider";
import { getPromptTemplate } from "@/lib/builder/config";
import { loadAllReferences } from "@/lib/storage/reference-shelf";
import type { EntityMap, CrossProjectAnalysis } from "@/types";

export async function analyzeCrossProject(
  chipType: string,
  entityMaps: EntityMap[]
): Promise<CrossProjectAnalysis> {
  const promptTemplate = await getPromptTemplate("cross-project-analysis");
  const referenceContext = await loadAllReferences();

  const mapsJson = entityMaps.map((m) => ({
    project: m.projectName,
    entities: m.entities,
  }));

  const prompt = promptTemplate
    .replace("{{CHIP_TYPE}}", chipType)
    .replace("{{ENTITY_MAPS}}", JSON.stringify(mapsJson, null, 2))
    .replace("{{REFERENCE_CONTEXT}}", referenceContext || "No reference materials provided.");

  const system =
    "You are an ATE test engineering expert. Analyze patterns across multiple test projects. Return valid JSON only.";

  const response = await aiGenerateText(system, prompt);

  try {
    const parsed = JSON.parse(extractJSON(response));
    return {
      patterns: parsed.patterns || [],
      differences: parsed.differences || [],
      gaps: parsed.gaps || [],
    };
  } catch {
    return { patterns: [], differences: [], gaps: [] };
  }
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  return text;
}
