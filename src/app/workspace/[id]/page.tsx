"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/skeleton";
import { ProjectUpload } from "@/components/project-upload";
import { MissingFilesAlert } from "@/components/missing-files-alert";
import { ReferenceShelf } from "@/components/reference-shelf";
import { IngestProgress } from "@/components/ingest-progress";
import { QuestionPanel } from "@/components/question-panel";
import { KBBrowser } from "@/components/kb-browser";
import { ArrowLeft, Loader2, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Workspace, Project, IngestProgress as IngestProgressType } from "@/types";

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ingestStatus, setIngestStatus] = useState<IngestProgressType | null>(null);
  const [activeTab, setActiveTab] = useState("projects");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [startingIngest, setStartingIngest] = useState(false);

  const loadWorkspace = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      if (!res.ok) throw new Error(`工作区不存在 (${res.status})`);
      setWorkspace(await res.json());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "加载失败");
    }
  }, [workspaceId]);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects`);
      if (!res.ok) return;
      setProjects(await res.json());
    } catch {
      // non-critical
    }
  }, [workspaceId]);

  const checkIngestStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ingest`);
      if (!res.ok) return;
      const status = await res.json();
      setIngestStatus(status.status !== "idle" ? status : null);
    } catch {
      // non-critical
    }
  }, [workspaceId]);

  useEffect(() => {
    async function syncWorkspaceData() {
      await Promise.all([loadWorkspace(), loadProjects(), checkIngestStatus()]);
    }

    void syncWorkspaceData();
  }, [loadWorkspace, loadProjects, checkIngestStatus]);

  useEffect(() => {
    if (
      !ingestStatus ||
      ingestStatus.status === "completed" ||
      ingestStatus.status === "failed"
    )
      return;
    const interval = setInterval(checkIngestStatus, 3000);
    return () => clearInterval(interval);
  }, [ingestStatus, checkIngestStatus]);

  async function handleStartIngest() {
    setStartingIngest(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`启动失败 (${res.status})`);
      toast.success("Ingest 已启动，正在处理中...");
      await checkIngestStatus();
      setActiveTab("progress");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "启动失败");
    } finally {
      setStartingIngest(false);
    }
  }

  /* ── Error state ── */
  if (loadError) {
    return (
      <div className="text-center py-16">
        <p className="font-medium text-destructive">{loadError}</p>
        <Link
          href="/"
          className="text-sm text-primary mt-3 inline-flex items-center gap-1 hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          返回工作区列表
        </Link>
      </div>
    );
  }

  /* ── Loading state ── */
  if (!workspace) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const latestRound = workspace.rounds[workspace.rounds.length - 1];
  const showQuestions =
    latestRound?.status === "awaiting_answers" ||
    ingestStatus?.status === "awaiting_answers";
  const hasKB = workspace.rounds.some((r) => r.status === "completed");

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="size-3" />
            工作区列表
          </Link>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">
            {workspace.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            芯片类型：
            <span className="font-medium text-foreground">
              {workspace.chipType}
            </span>
            <span className="mx-1.5">·</span>
            {workspace.projectCount} 个项目
            <span className="mx-1.5">·</span>
            {workspace.rounds.length} 轮 Ingest
          </p>
        </div>

        {projects.length > 0 && (
          <Button
            onClick={handleStartIngest}
            disabled={!!ingestStatus || startingIngest}
            className="shrink-0"
          >
            {startingIngest ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                启动中...
              </>
            ) : workspace.rounds.length === 0 ? (
              <>
                <Play className="size-4 mr-2" />
                开始 Ingest
              </>
            ) : (
              <>
                <RefreshCw className="size-4 mr-2" />
                增量 Ingest
              </>
            )}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          variant="line"
          className="w-full border-b rounded-none justify-start h-auto pb-0 gap-0"
        >
          <TabsTrigger
            value="projects"
            className="rounded-none border-b-2 border-transparent data-active:border-primary px-4 py-2.5"
          >
            项目文件
          </TabsTrigger>
          <TabsTrigger
            value="references"
            className="rounded-none border-b-2 border-transparent data-active:border-primary px-4 py-2.5"
          >
            参考资料
          </TabsTrigger>
          {ingestStatus && (
            <TabsTrigger
              value="progress"
              className="rounded-none border-b-2 border-transparent data-active:border-primary px-4 py-2.5"
            >
              处理进度
            </TabsTrigger>
          )}
          {showQuestions && (
            <TabsTrigger
              value="questions"
              className="rounded-none border-b-2 border-transparent data-active:border-primary px-4 py-2.5 text-amber-600 data-active:text-amber-700"
            >
              问题确认
              {latestRound &&
                latestRound.questionCount > latestRound.answeredCount && (
                  <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs rounded-full px-1.5 py-0.5 font-medium">
                    {latestRound.questionCount - latestRound.answeredCount}
                  </span>
                )}
            </TabsTrigger>
          )}
          {hasKB && (
            <TabsTrigger
              value="kb"
              className="rounded-none border-b-2 border-transparent data-active:border-primary px-4 py-2.5"
            >
              知识库
            </TabsTrigger>
          )}
        </TabsList>

        {/* Projects tab */}
        <TabsContent value="projects" className="mt-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {projects.length === 0 ? (
                <div className="text-center py-14 rounded-xl border-2 border-dashed border-border">
                  <div className="text-3xl mb-2">📁</div>
                  <p className="text-sm font-medium text-foreground">
                    还没有项目
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    在右侧上传项目文件夹
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((p) => (
                    <Card key={p.name} className="p-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm text-foreground">
                            {p.name}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {p.fileCount} 个文件
                          </span>
                        </div>
                        {p.classification &&
                          p.classification.missingTypes.length > 0 && (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-200 bg-amber-50 text-xs"
                            >
                              缺少文件
                            </Badge>
                          )}
                      </div>
                      {p.classification && (
                        <MissingFilesAlert
                          projectName={p.name}
                          missingTypes={p.classification.missingTypes}
                        />
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <div>
              <ProjectUpload
                workspaceId={workspaceId}
                onUploadComplete={() => {
                  loadProjects();
                  loadWorkspace();
                }}
              />
            </div>
          </div>
        </TabsContent>

        {/* References tab */}
        <TabsContent value="references" className="mt-5">
          <ReferenceShelf />
        </TabsContent>

        {/* Progress tab */}
        <TabsContent value="progress" className="mt-5">
          {ingestStatus && <IngestProgress progress={ingestStatus} />}
        </TabsContent>

        {/* Questions tab */}
        <TabsContent value="questions" className="mt-5">
          {latestRound && (
            <QuestionPanel
              workspaceId={workspaceId}
              roundNumber={latestRound.roundNumber}
              onComplete={() => {
                loadWorkspace();
                setActiveTab("kb");
              }}
            />
          )}
        </TabsContent>

        {/* Knowledge Base tab */}
        <TabsContent value="kb" className="mt-5">
          <KBBrowser workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>

      {/* Ingest history */}
      {workspace.rounds.length > 0 && (
        <Card className="mt-8 p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Ingest 历史
          </h3>
          <div className="divide-y">
            {workspace.rounds.map((round) => (
              <div
                key={round.roundNumber}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">
                    第 {round.roundNumber} 轮
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(round.startedAt).toLocaleDateString("zh-CN")}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {round.projects.length} 个项目
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  {round.questionCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {round.answeredCount}/{round.questionCount} 问题
                    </span>
                  )}
                  <Badge
                    variant={round.status === "completed" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {round.status === "completed"
                      ? "已完成"
                      : statusLabel(round.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    classifying: "分类中",
    extracting: "提取中",
    analyzing: "分析中",
    generating_questions: "生成问题",
    awaiting_answers: "待确认",
    assembling_kb: "组装中",
    completed: "已完成",
    failed: "失败",
  };
  return map[status] || status;
}
