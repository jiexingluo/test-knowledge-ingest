import {
  getProjectFiles,
  classifyProject,
} from "@/lib/storage/project";
import type { Project, FileClassification } from "@/types";

export async function runAutodiscovery(
  workspaceId: string,
  projects: Project[]
): Promise<Map<string, FileClassification>> {
  const results = new Map<string, FileClassification>();

  for (const project of projects) {
    const files = await getProjectFiles(workspaceId, project.name);
    const classification = classifyProject(files);
    results.set(project.name, classification);
  }

  return results;
}

export function getAnalyzableFiles(
  classification: FileClassification
): string[] {
  const analyzable = [
    ...classification.sourceFiles,
    ...classification.testPlans,
    ...classification.datasheets,
  ];
  return analyzable
    .filter((f) => f.priority !== "low")
    .map((f) => f.relativePath);
}
