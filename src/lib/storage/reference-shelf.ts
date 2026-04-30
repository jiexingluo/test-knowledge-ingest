import { readdir, readFile, writeFile, mkdir, stat, unlink } from "fs/promises";
import { join } from "path";
import type { ReferenceDoc } from "@/types";
import { getReferenceShelfDir } from "@/lib/utils";

export async function listReferences(): Promise<ReferenceDoc[]> {
  const dir = getReferenceShelfDir();
  await mkdir(dir, { recursive: true });
  const files = await readdir(dir);
  const docs: ReferenceDoc[] = [];
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const fileStat = await stat(join(dir, file));
    docs.push({
      name: file.replace(/\.md$/, ""),
      filename: file,
      sizeBytes: fileStat.size,
      uploadedAt: fileStat.mtime.toISOString(),
    });
  }
  return docs;
}

export async function getReferenceContent(
  filename: string
): Promise<string> {
  return readFile(join(getReferenceShelfDir(), filename), "utf-8");
}

export async function saveReference(
  filename: string,
  content: string
): Promise<void> {
  const dir = getReferenceShelfDir();
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), content, "utf-8");
}

export async function deleteReference(filename: string): Promise<void> {
  await unlink(join(getReferenceShelfDir(), filename));
}

export async function loadAllReferences(): Promise<string> {
  const docs = await listReferences();
  const sections: string[] = [];
  for (const doc of docs) {
    const content = await getReferenceContent(doc.filename);
    sections.push(`## Reference: ${doc.name}\n\n${content}`);
  }
  return sections.join("\n\n---\n\n");
}
