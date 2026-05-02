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
import { Loader2 } from "lucide-react";
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
      // non-critical, don't block the page
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
    loadWorkspace();
    loadProjects();
    checkIngestStatus();
  }, [loadWorkspace, loadProjects, checkIngestStatus]);

  useEffect(() => {
    if (!ingestStatus || ingestStatus.status === "completed" || ingestStatus.status === "failed") return;
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

  if (loadError) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 font-medium">{loadError}</p>
        <Link href="/" className="text-sm text-blue-500 mt-2 inline-block hover:underline">
          ← 返回工作区列表
        </Link>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const latestRound = workspace.rounds[workspace.rounds.length - 1];
  const showQuestions =
    latestRound?.status === "awaiting_answers" ||
    ingestStatus?.status === "awaiting_answers";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← 返回工作区列表
          </Link>
          <h2 className="text-2xl font-bold mt-1">{workspace.name}</h2>
          <p className="text-gray-500 text-sm">
            芯片类型: <span className="font-medium text-gray-700">{workspace.chipType}</span>
            {" · "}{workspace.projectCount} 个项目
            {" · "}{workspace.rounds.length} 轮 ingest
          </p>
        </div>
        <div className="flex gap-2">
          {projects.length > 0 && (
            <Button
              onClick={handleStartIngest}
              disabled={!!ingestStatus || startingIngest}
            >
              {startingIngest ? (
                <><Loader2 className="size-4 mr-2 animate-spin" />启动中...</>
              ) : (
                workspace.rounds.length === 0 ? "开始 Ingest" : "增量 Ingest"
              )}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="projects">项目文件</TabsTrigger>
          <TabsTrigger value="references">参考资料</TabsTrigger>
          {ingestStatus && <TabsTrigger value="progress">处理进度</TabsTrigger>}
          {showQuestions && (
            <TabsTrigger value="questions" className="text-orange-600">
              问题确认
              {latestRound && latestRound.questionCount > latestRound.answeredCount && (
                <span className="ml-1.5 bg-orange-100 text-orange-600 text-xs rounded-full px-1.5 py-0.5">
                  {latestRound.questionCount - latestRound.answeredCount}
                </span>
              )}
            </TabsTrigger>
          )}
          {workspace.rounds.some((r) => r.status === "completed") && (
            <TabsTrigger value="kb">知识库</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {projects.length === 0 ? (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg">
                  <div className="text-3xl mb-2">📁</div>
                  <p className="font-medium text-gray-500">还没有项目</p>
                  <p className="text-sm mt-1">在右侧上传项目文件夹</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((p) => (
                    <Card key={p.name} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{p.name}</span>
                          <span className="text-sm text-gray-400 ml-2">{p.fileCount} 个文件</span>
                        </div>
                        {p.classification && p.classification.missingTypes.length > 0 && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
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
                onUploadComplete={() => { loadProjects(); loadWorkspace(); }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="references" className="mt-4">
          <ReferenceShelf />
        </TabsContent>

        <TabsContent value="progress" className="mt-4">
          {ingestStatus && <IngestProgress progress={ingestStatus} />}
        </TabsContent>

        <TabsContent value="questions" className="mt-4">
          {latestRound && (
            <QuestionPanel
              workspaceId={workspaceId}
              roundNumber={latestRound.roundNumber}
              onComplete={() => { loadWorkspace(); setActiveTab("kb"); }}
            />
          )}
        </TabsContent>

        <TabsContent value="kb" className="mt-4">
          <KBBrowser workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>

      {workspace.rounds.length > 0 && (
        <Card className="mt-6 p-4">
          <h3 className="font-medium mb-3 text-sm text-gray-600 uppercase tracking-wide">Ingest 历史</h3>
          <div className="space-y-2">
            {workspace.rounds.map((round) => (
              <div
                key={round.roundNumber}
                className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">Round {round.roundNumber}</span>
                  <span className="text-gray-400 text-xs">
                    {new Date(round.startedAt).toLocaleDateString("zh-CN")}
                  </span>
                  <span className="text-gray-400 text-xs">{round.projects.length} 个项目</span>
                </div>
                <div className="flex items-center gap-2">
                  {round.questionCount > 0 && (
                    <span className="text-xs text-gray-400">
                      {round.answeredCount}/{round.questionCount} 问题
                    </span>
                  )}
                  <Badge variant={round.status === "completed" ? "default" : "outline"} className="text-xs">
                    {round.status === "completed" ? "已完成" : round.status}
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
