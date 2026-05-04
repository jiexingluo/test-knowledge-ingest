import { join } from "path";

export function getDataDir(): string {
  return join(/*turbopackIgnore: true*/ process.cwd(), process.env.DATA_DIR || "data");
}

export function getWorkspacesDir(): string {
  return join(getDataDir(), "workspaces");
}

export function getWorkspaceDir(workspaceId: string): string {
  return join(getWorkspacesDir(), workspaceId);
}

export function getReferenceShelfDir(): string {
  return join(getDataDir(), "reference-shelf");
}
