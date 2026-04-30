import { readdir, readFile, writeFile, mkdir, cp } from "fs/promises";
import { join, extname, basename, relative } from "path";
import type {
  Project,
  FileClassification,
  ClassifiedFile,
  FileCategory,
  MissingFileType,
} from "@/types";
import { getWorkspaceDir } from "@/lib/utils";

export async function listProjects(workspaceId: string): Promise<Project[]> {
  const projectsDir = join(getWorkspaceDir(workspaceId), "projects");
  await mkdir(projectsDir, { recursive: true });
  const entries = await readdir(projectsDir, { withFileTypes: true });
  const projects: Project[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const metaPath = join(projectsDir, entry.name, ".project-meta.json");
    try {
      const raw = await readFile(metaPath, "utf-8");
      projects.push(JSON.parse(raw));
    } catch {
      const fileCount = await countFiles(join(projectsDir, entry.name));
      projects.push({
        name: entry.name,
        path: join(projectsDir, entry.name),
        fileCount,
        uploadedAt: new Date().toISOString(),
      });
    }
  }
  return projects;
}

export async function addProject(
  workspaceId: string,
  projectName: string,
  sourcePath: string
): Promise<Project> {
  const destDir = join(
    getWorkspaceDir(workspaceId),
    "projects",
    projectName
  );
  await mkdir(destDir, { recursive: true });
  await cp(sourcePath, destDir, { recursive: true });

  const fileCount = await countFiles(destDir);
  const project: Project = {
    name: projectName,
    path: destDir,
    fileCount,
    uploadedAt: new Date().toISOString(),
  };

  await writeFile(
    join(destDir, ".project-meta.json"),
    JSON.stringify(project, null, 2),
    "utf-8"
  );
  return project;
}

export async function getProjectFiles(
  workspaceId: string,
  projectName: string
): Promise<string[]> {
  const projectDir = join(
    getWorkspaceDir(workspaceId),
    "projects",
    projectName
  );
  return collectFiles(projectDir, projectDir);
}

async function collectFiles(
  dir: string,
  baseDir: string
): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, baseDir)));
    } else {
      files.push(relative(baseDir, fullPath));
    }
  }
  return files;
}

async function countFiles(dir: string): Promise<number> {
  const files = await collectFiles(dir, dir);
  return files.length;
}

export function classifyFile(relativePath: string): {
  category: FileCategory;
  priority: "high" | "medium" | "low";
} {
  const ext = extname(relativePath).toLowerCase();
  const name = basename(relativePath).toLowerCase();
  const pathLower = relativePath.toLowerCase();

  if (name.includes("datasheet"))
    return { category: "datasheet", priority: "high" };
  if (
    name.includes("testplan") ||
    name.includes("test_plan") ||
    name.includes("test plan") ||
    name.startsWith("tpd_")
  )
    return { category: "test_plan", priority: "high" };
  if (
    name.includes("schematic") ||
    name.includes("原理图") ||
    ext === ".dsn" ||
    ext === ".brd"
  )
    return { category: "schematic", priority: "high" };

  const sourceExts = [".cpp", ".h", ".c", ".py", ".bas", ".cls", ".frm", ".cs"];
  if (sourceExts.includes(ext) || pathLower.includes("source/"))
    return { category: "source", priority: "high" };

  if (name.includes("pin") && (ext === ".h" || ext === ".txt" || ext === ".csv"))
    return { category: "pin_definition", priority: "medium" };

  const buildExts = [".sln", ".vcproj", ".vcxproj", ".dsp", ".dsw", ".csproj"];
  if (buildExts.includes(ext))
    return { category: "build_metadata", priority: "medium" };

  const configExts = [".json", ".xml", ".yaml", ".yml", ".ini", ".cfg", ".conf"];
  if (configExts.includes(ext))
    return { category: "config", priority: "medium" };

  const compiledExts = [".dll", ".pgs", ".pfl", ".ldf", ".exe", ".obj", ".lib"];
  if (compiledExts.includes(ext))
    return { category: "compiled_artifact", priority: "low" };

  return { category: "other", priority: "low" };
}

export function classifyProject(files: string[]): FileClassification {
  const result: FileClassification = {
    sourceFiles: [],
    testPlans: [],
    datasheets: [],
    schematics: [],
    buildMetadata: [],
    compiledArtifacts: [],
    otherFiles: [],
    missingTypes: [],
  };

  for (const file of files) {
    const { category, priority } = classifyFile(file);
    const classified: ClassifiedFile = {
      relativePath: file,
      category,
      priority,
      sizeBytes: 0,
    };

    switch (category) {
      case "source":
      case "pin_definition":
      case "config":
        result.sourceFiles.push(classified);
        break;
      case "test_plan":
        result.testPlans.push(classified);
        break;
      case "datasheet":
        result.datasheets.push(classified);
        break;
      case "schematic":
        result.schematics.push(classified);
        break;
      case "build_metadata":
        result.buildMetadata.push(classified);
        break;
      case "compiled_artifact":
        result.compiledArtifacts.push(classified);
        break;
      default:
        result.otherFiles.push(classified);
    }
  }

  const missingTypes: MissingFileType[] = [];
  if (result.testPlans.length === 0)
    missingTypes.push({
      type: "test_plan",
      message: "未检测到 Test Plan 文件，建议补充以提高知识提取质量",
    });
  if (result.datasheets.length === 0)
    missingTypes.push({
      type: "datasheet",
      message: "未检测到 Datasheet 文件，建议补充以获取规格约束信息",
    });
  if (result.schematics.length === 0)
    missingTypes.push({
      type: "schematic",
      message: "未检测到原理图文件，建议补充以理解硬件连接关系",
    });
  result.missingTypes = missingTypes;

  return result;
}
