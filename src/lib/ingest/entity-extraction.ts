import { readFile } from "fs/promises";
import { join } from "path";
import { aiGenerateText } from "@/lib/ai/provider";
import { getEntityDefinitions, getPromptTemplate } from "@/lib/builder/config";
import { getWorkspaceDir } from "@/lib/server-paths";
import type { EntityMap, FileClassification } from "@/types";
import { getAnalyzableFiles } from "./autodiscovery";

export async function extractEntities(
  workspaceId: string,
  projectName: string,
  classification: FileClassification
): Promise<EntityMap> {
  const entityDefs = await getEntityDefinitions();
  const promptTemplate = await getPromptTemplate("entity-extraction");

  const analyzableFiles = getAnalyzableFiles(classification);
  const projectDir = join(
    getWorkspaceDir(workspaceId),
    "projects",
    projectName
  );

  const fileContents: string[] = [];
  for (const relPath of analyzableFiles.slice(0, 50)) {
    try {
      const content = await readFile(join(projectDir, relPath), "utf-8");
      const truncated =
        content.length > 10000
          ? content.slice(0, 10000) + "\n... (truncated)"
          : content;
      fileContents.push(`### File: ${relPath}\n\`\`\`\n${truncated}\n\`\`\``);
    } catch {
      // 跳过二进制或不可读文件
    }
  }

  const prompt = promptTemplate
    .replace("{{ENTITY_DEFINITIONS}}", JSON.stringify(entityDefs, null, 2))
    .replace("{{SOURCE_FILES}}", fileContents.join("\n\n"));

  const system =
    "You are an ATE test program analysis expert. Extract structured entities from test program source code. Return valid JSON only.";

  const response = await aiGenerateText(system, prompt);

  try {
    const parsed = JSON.parse(extractJSON(response));
    return {
      projectName,
      extractedAt: new Date().toISOString(),
      entities: {
        test_flow: parsed.entities?.test_flow || [],
        test_instance: parsed.entities?.test_instance || [],
        timing: parsed.entities?.timing || [],
        levels: parsed.entities?.levels || [],
        pattern: parsed.entities?.pattern || [],
        bin: parsed.entities?.bin || [],
        limit: parsed.entities?.limit || [],
        measurement_setup: parsed.entities?.measurement_setup || [],
        special_handling: parsed.entities?.special_handling || [],
        spec_item: parsed.entities?.spec_item || [],
        coverage_intent: parsed.entities?.coverage_intent || [],
      },
    };
  } catch {
    return {
      projectName,
      extractedAt: new Date().toISOString(),
      entities: {
        test_flow: [],
        test_instance: [],
        timing: [],
        levels: [],
        pattern: [],
        bin: [],
        limit: [],
        measurement_setup: [],
        special_handling: [],
        spec_item: [],
        coverage_intent: [],
      },
    };
  }
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  return text;
}
