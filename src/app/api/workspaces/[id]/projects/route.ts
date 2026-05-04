import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { listProjects, classifyProject } from "@/lib/storage/project";
import { getWorkspace, updateWorkspace } from "@/lib/storage/workspace";
import { getWorkspaceDir } from "@/lib/server-paths";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projects = await listProjects(id);
  return NextResponse.json(projects);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await request.formData();
  const projectName = formData.get("projectName") as string;
  const files = formData.getAll("files") as File[];

  if (!projectName || files.length === 0) {
    return NextResponse.json(
      { error: "projectName and files are required" },
      { status: 400 }
    );
  }

  const projectDir = join(
    getWorkspaceDir(id),
    "projects",
    projectName
  );

  for (const file of files) {
    const relativePath = (file as unknown as { webkitRelativePath?: string })
      .webkitRelativePath || file.name;
    const filePath = join(projectDir, relativePath);
    const dir = join(filePath, "..");
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
  }

  const filePaths = files.map(
    (f) =>
      (f as unknown as { webkitRelativePath?: string }).webkitRelativePath ||
      f.name
  );
  const classification = classifyProject(filePaths);

  const project = {
    name: projectName,
    path: projectDir,
    fileCount: files.length,
    uploadedAt: new Date().toISOString(),
    classification,
  };

  await writeFile(
    join(projectDir, ".project-meta.json"),
    JSON.stringify(project, null, 2),
    "utf-8"
  );

  const workspace = await getWorkspace(id);
  if (workspace) {
    workspace.projectCount = (await listProjects(id)).length;
    await updateWorkspace(workspace);
  }

  return NextResponse.json(project, { status: 201 });
}
