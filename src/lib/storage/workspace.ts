import { readdir, readFile, writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";
import type { Workspace, WorkspaceCreateInput } from "@/types";
import { getWorkspacesDir, getWorkspaceDir } from "@/lib/server-paths";

export async function listWorkspaces(): Promise<Workspace[]> {
  const dir = getWorkspacesDir();
  await mkdir(dir, { recursive: true });
  const entries = await readdir(dir, { withFileTypes: true });
  const workspaces: Workspace[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const ws = await getWorkspace(entry.name);
      if (ws) workspaces.push(ws);
    } catch {
      // skip invalid workspace directories
    }
  }
  return workspaces.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  try {
    const raw = await readFile(
      join(getWorkspaceDir(id), "workspace.json"),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function createWorkspace(
  input: WorkspaceCreateInput
): Promise<Workspace> {
  const id = nanoid(10);
  const wsDir = getWorkspaceDir(id);
  await mkdir(join(wsDir, "projects"), { recursive: true });
  await mkdir(join(wsDir, "ingest"), { recursive: true });
  await mkdir(join(wsDir, "knowledge-base", "knowledge"), { recursive: true });
  await mkdir(join(wsDir, "knowledge-base", "knowhow"), { recursive: true });

  const workspace: Workspace = {
    id,
    name: input.name,
    chipType: input.chipType,
    description: input.description || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rounds: [],
    projectCount: 0,
  };

  await writeFile(
    join(wsDir, "workspace.json"),
    JSON.stringify(workspace, null, 2),
    "utf-8"
  );
  return workspace;
}

export async function updateWorkspace(workspace: Workspace): Promise<void> {
  workspace.updatedAt = new Date().toISOString();
  await writeFile(
    join(getWorkspaceDir(workspace.id), "workspace.json"),
    JSON.stringify(workspace, null, 2),
    "utf-8"
  );
}

export async function deleteWorkspace(id: string): Promise<void> {
  await rm(getWorkspaceDir(id), { recursive: true, force: true });
}
