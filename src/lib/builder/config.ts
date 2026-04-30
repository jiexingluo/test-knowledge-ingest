import { readFile } from "fs/promises";
import { join } from "path";

const BUILDER_DIR = join(process.cwd(), "builder");

let entityDefinitionsCache: unknown = null;
let outputSchemasCache: Record<string, unknown> = {};

export async function getEntityDefinitions() {
  if (!entityDefinitionsCache) {
    const raw = await readFile(
      join(BUILDER_DIR, "entity-definitions.json"),
      "utf-8"
    );
    entityDefinitionsCache = JSON.parse(raw);
  }
  return entityDefinitionsCache;
}

export async function getOutputSchema(
  type: "knowledge" | "knowhow" | "question"
) {
  if (!outputSchemasCache[type]) {
    const raw = await readFile(
      join(BUILDER_DIR, "output-schema", `${type}.schema.json`),
      "utf-8"
    );
    outputSchemasCache[type] = JSON.parse(raw);
  }
  return outputSchemasCache[type];
}

export async function getPromptTemplate(step: string): Promise<string> {
  return readFile(join(BUILDER_DIR, "prompts", `${step}.md`), "utf-8");
}

export function clearConfigCache() {
  entityDefinitionsCache = null;
  outputSchemasCache = {};
}
