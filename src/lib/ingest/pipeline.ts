import { writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { getWorkspaceDir } from "@/lib/server-paths";
import {
  getWorkspace,
  updateWorkspace,
} from "@/lib/storage/workspace";
import { listProjects } from "@/lib/storage/project";
import { runAutodiscovery } from "./autodiscovery";
import { extractEntities } from "./entity-extraction";
import { analyzeCrossProject } from "./cross-project";
import { generateQuestions } from "./question-generation";
import { analyzeDiff } from "./diff-analysis";
import { assembleKB } from "./kb-assembly";
import type {
  IngestProgress,
  IngestRound,
  EntityMap,
  Question,
  CrossProjectAnalysis,
  DiffReport,
} from "@/types";

const activeIngests = new Map<string, IngestProgress>();

export function getIngestProgress(
  workspaceId: string
): IngestProgress | null {
  return activeIngests.get(workspaceId) || null;
}

function updateProgress(workspaceId: string, progress: IngestProgress) {
  activeIngests.set(workspaceId, progress);
}

export async function startIngest(
  workspaceId: string,
  projectNames?: string[]
): Promise<void> {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) throw new Error("Workspace not found");

  const allProjects = await listProjects(workspaceId);
  const targetProjects = projectNames
    ? allProjects.filter((p) => projectNames.includes(p.name))
    : allProjects;

  if (targetProjects.length === 0) throw new Error("No projects to ingest");

  const roundNumber = workspace.rounds.length + 1;
  const isIncremental = roundNumber > 1;
  const roundDir = join(
    getWorkspaceDir(workspaceId),
    "ingest",
    `round-${roundNumber}`
  );
  await mkdir(join(roundDir, "entity-maps"), { recursive: true });

  const round: IngestRound = {
    roundNumber,
    startedAt: new Date().toISOString(),
    status: "classifying",
    projects: targetProjects.map((p) => p.name),
    questionCount: 0,
    answeredCount: 0,
  };
  workspace.rounds.push(round);
  await updateWorkspace(workspace);

  // 异步运行流水线
  runPipeline(
    workspaceId,
    workspace.chipType,
    targetProjects,
    roundNumber,
    roundDir,
    isIncremental
  ).catch((err) => {
    console.error("Ingest pipeline failed:", err);
    updateProgress(workspaceId, {
      status: "failed",
      currentStep: 0,
      totalSteps: 6,
      stepLabel: "失败",
      error: String(err.message || err),
    });
  });
}

async function runPipeline(
  workspaceId: string,
  chipType: string,
  projects: { name: string; path: string; fileCount: number; uploadedAt: string }[],
  roundNumber: number,
  roundDir: string,
  isIncremental: boolean
) {
  const totalSteps = isIncremental ? 7 : 6;

  // 步骤 1：文件自动发现与分类
  updateProgress(workspaceId, {
    status: "classifying",
    currentStep: 1,
    totalSteps,
    stepLabel: "文件分类中...",
  });
  const classifications = await runAutodiscovery(workspaceId, projects);

  // 步骤 2：实体提取
  const entityMaps: EntityMap[] = [];
  let projectIdx = 0;
  for (const project of projects) {
    projectIdx++;
    updateProgress(workspaceId, {
      status: "extracting",
      currentStep: 2,
      totalSteps,
      stepLabel: "实体提取中...",
      projectProgress: {
        current: projectIdx,
        total: projects.length,
        currentProject: project.name,
      },
    });

    const classification = classifications.get(project.name);
    if (!classification) continue;

    const entityMap = await extractEntities(
      workspaceId,
      project.name,
      classification
    );
    entityMaps.push(entityMap);

    await writeFile(
      join(roundDir, "entity-maps", `${project.name}.json`),
      JSON.stringify(entityMap, null, 2),
      "utf-8"
    );
  }

  // 步骤 3：跨项目分析
  updateProgress(workspaceId, {
    status: "analyzing",
    currentStep: 3,
    totalSteps,
    stepLabel: "跨项目分析中...",
  });
  const analysis = await analyzeCrossProject(chipType, entityMaps);
  await writeFile(
    join(roundDir, "analysis.json"),
    JSON.stringify(analysis, null, 2),
    "utf-8"
  );

  // 步骤 4：增量差异分析（仅增量模式）
  let diffReport: DiffReport | undefined;
  if (isIncremental) {
    updateProgress(workspaceId, {
      status: "analyzing",
      currentStep: 4,
      totalSteps,
      stepLabel: "增量差异分析中...",
    });
    diffReport = await analyzeDiff(workspaceId, entityMaps, analysis);
    await writeFile(
      join(roundDir, "diff-report.json"),
      JSON.stringify(diffReport, null, 2),
      "utf-8"
    );
  }

  // 步骤 5：生成确认问题
  const qStep = isIncremental ? 5 : 4;
  updateProgress(workspaceId, {
    status: "generating_questions",
    currentStep: qStep,
    totalSteps,
    stepLabel: "生成确认问题中...",
  });
  const questions = await generateQuestions(analysis, roundNumber);
  await writeFile(
    join(roundDir, "questions.json"),
    JSON.stringify(questions, null, 2),
    "utf-8"
  );

  // 更新工作区问题数量
  const workspace = await getWorkspace(workspaceId);
  if (workspace) {
    const currentRound = workspace.rounds.find(
      (r) => r.roundNumber === roundNumber
    );
    if (currentRound) {
      currentRound.status = "awaiting_answers";
      currentRound.questionCount = questions.length;
    }
    await updateWorkspace(workspace);
  }

  // 保存清单文件
  await writeFile(
    join(roundDir, "manifest.json"),
    JSON.stringify(
      {
        roundNumber,
        projects: projects.map((p) => p.name),
        fileClassifications: Object.fromEntries(classifications),
        entityMapCount: entityMaps.length,
        questionCount: questions.length,
        isIncremental,
        startedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf-8"
  );

  updateProgress(workspaceId, {
    status: "awaiting_answers",
    currentStep: qStep + 1,
    totalSteps,
    stepLabel: "等待用户确认...",
  });
}

export async function completeIngest(
  workspaceId: string,
  roundNumber: number
): Promise<{ entryCount: number }> {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) throw new Error("Workspace not found");

  const roundDir = join(
    getWorkspaceDir(workspaceId),
    "ingest",
    `round-${roundNumber}`
  );

  const questionsRaw = await readFile(join(roundDir, "questions.json"), "utf-8");
  const questions: Question[] = JSON.parse(questionsRaw);

  const analysisRaw = await readFile(join(roundDir, "analysis.json"), "utf-8");
  const analysis: CrossProjectAnalysis = JSON.parse(analysisRaw);

  let diffReport: DiffReport | undefined;
  try {
    const diffRaw = await readFile(join(roundDir, "diff-report.json"), "utf-8");
    diffReport = JSON.parse(diffRaw);
  } catch {
    // 首轮没有差异报告
  }

  updateProgress(workspaceId, {
    status: "assembling_kb",
    currentStep: 6,
    totalSteps: 7,
    stepLabel: "组装知识库中...",
  });

  const currentRound = workspace.rounds.find(
    (r) => r.roundNumber === roundNumber
  );
  const projectNames = currentRound?.projects || [];

  const result = await assembleKB(
    workspaceId,
    workspace.chipType,
    analysis,
    questions,
    projectNames,
    diffReport
  );

  if (currentRound) {
    currentRound.status = "completed";
    currentRound.completedAt = new Date().toISOString();
  }
  await updateWorkspace(workspace);

  updateProgress(workspaceId, {
    status: "completed",
    currentStep: 7,
    totalSteps: 7,
    stepLabel: "完成",
  });

  return result;
}
