import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { KBMeta, KBEntry, KBGraph } from "@/types";
import { getWorkspaceDir } from "@/lib/utils";

function kbDir(workspaceId: string) {
  return join(getWorkspaceDir(workspaceId), "knowledge-base");
}

export async function getKBMeta(
  workspaceId: string
): Promise<KBMeta | null> {
  try {
    const raw = await readFile(
      join(kbDir(workspaceId), "kb-meta.json"),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveKBMeta(
  workspaceId: string,
  meta: KBMeta
): Promise<void> {
  await writeFile(
    join(kbDir(workspaceId), "kb-meta.json"),
    JSON.stringify(meta, null, 2),
    "utf-8"
  );
}

export async function listKBEntries(
  workspaceId: string,
  type: "knowledge" | "knowhow"
): Promise<KBEntry[]> {
  const dir = join(kbDir(workspaceId), type);
  await mkdir(dir, { recursive: true });
  const files = await readdir(dir);
  const entries: KBEntry[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const raw = await readFile(join(dir, file), "utf-8");
    entries.push(JSON.parse(raw));
  }
  return entries;
}

export async function getKBEntry(
  workspaceId: string,
  type: "knowledge" | "knowhow",
  entryId: string
): Promise<KBEntry | null> {
  try {
    const raw = await readFile(
      join(kbDir(workspaceId), type, `${entryId}.json`),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveKBEntry(
  workspaceId: string,
  entry: KBEntry
): Promise<void> {
  const dir = join(kbDir(workspaceId), entry.type);
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, `${entry.id}.json`),
    JSON.stringify(entry, null, 2),
    "utf-8"
  );

  const mdContent = renderEntryMarkdown(entry);
  await writeFile(join(dir, `${entry.id}.md`), mdContent, "utf-8");
}

export async function getKBGraph(
  workspaceId: string
): Promise<KBGraph> {
  try {
    const raw = await readFile(
      join(kbDir(workspaceId), "graph.json"),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return { nodes: [], edges: [] };
  }
}

export async function saveKBGraph(
  workspaceId: string,
  graph: KBGraph
): Promise<void> {
  await writeFile(
    join(kbDir(workspaceId), "graph.json"),
    JSON.stringify(graph, null, 2),
    "utf-8"
  );
}

export async function saveKBIndex(
  workspaceId: string,
  entries: KBEntry[]
): Promise<void> {
  const lines = ["# Knowledge Base Index\n"];
  const knowledge = entries.filter((e) => e.type === "knowledge");
  const knowhow = entries.filter((e) => e.type === "knowhow");

  if (knowledge.length > 0) {
    lines.push("## Knowledge\n");
    for (const e of knowledge) {
      lines.push(`- [${e.title}](knowledge/${e.id}.md) — ${e.summary}`);
    }
    lines.push("");
  }

  if (knowhow.length > 0) {
    lines.push("## Know-how\n");
    for (const e of knowhow) {
      lines.push(`- [${e.title}](knowhow/${e.id}.md) — ${e.summary}`);
    }
    lines.push("");
  }

  await writeFile(
    join(kbDir(workspaceId), "index.md"),
    lines.join("\n"),
    "utf-8"
  );
}

function renderEntryMarkdown(entry: KBEntry): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push(`id: ${entry.id}`);
  lines.push(`type: ${entry.type}`);
  lines.push(`scope: ${JSON.stringify(entry.scope)}`);
  lines.push(`version: ${entry.version}`);
  lines.push(`created: ${entry.createdAt}`);
  lines.push(`updated: ${entry.updatedAt}`);
  lines.push(`review_status: ${entry.reviewStatus}`);
  lines.push("---\n");
  lines.push(`# ${entry.title}\n`);
  lines.push(`## Summary\n${entry.summary}\n`);
  lines.push(`## Context\n${entry.context}\n`);
  if (entry.triggerConditions) {
    lines.push(`## Trigger Conditions\n${entry.triggerConditions}\n`);
  }
  lines.push(`## Action\n${entry.action}\n`);
  lines.push(`## Evidence`);
  for (const ev of entry.evidence) {
    lines.push(`- **${ev.project}**: ${ev.description}`);
    if (ev.rawExcerpt) lines.push(`  > ${ev.rawExcerpt}`);
  }
  lines.push("");
  if (entry.dialogueHistory.length > 0) {
    lines.push("## Dialogue History");
    for (const d of entry.dialogueHistory) {
      lines.push(`- Q (Round ${d.round}): ${d.question}`);
      lines.push(`  A: ${d.answer}`);
    }
    lines.push("");
  }
  if (entry.openQuestions.length > 0) {
    lines.push("## Open Questions");
    for (const q of entry.openQuestions) lines.push(`- ${q}`);
    lines.push("");
  }
  return lines.join("\n");
}
