"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectUpload } from "@/components/project-upload";
import { MissingFilesAlert } from "@/components/missing-files-alert";
import { ReferenceShelf } from "@/components/reference-shelf";
import { IngestProgress } from "@/components/ingest-progress";
import { QuestionPanel } from "@/components/question-panel";
import { KBBrowser } from "@/components/kb-browser";
import type { Workspace, Project, IngestProgress as IngestProgressType } from "@/types";

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ingestStatus, setIngestStatus] = useState<IngestProgressType | null>(null);
  const [activeTab, setActiveTab] = useState("projects");

  const loadWorkspace = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}`);
    setWorkspace(await res.json());
  }, [workspaceId]);

  const loadProjects = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/projects`);
    setProjects(await res.json());
  }, [workspaceId]);

  const checkIngestStatus = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/ingest`);
    const status = await res.json();
    setIngestStatus(status.status !== "idle" ? status : null);
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
    await fetch(`/api/workspaces/${workspaceId}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    checkIngestStatus();
    setActiveTab("progress");
  }

  if (!workspace) return <div className="p-6 text-gray-500">加载中...</div>;

  const latestRound = workspace.rounds[workspace.rounds.length - 1];
  const showQuestions =
    latestRound?.status === "awaiting_answers" ||
    ingestStatus?.status === "awaiting_answers";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← 返回工作区列表
          </Link>
          <h2 className="text-2xl font-bold mt-1">{workspace.name}</h2>
          <p className="text-gray-500 text-sm">
            芯片类型: {workspace.chipType} · {workspace.projectCount} 个项目 ·{" "}
            {workspace.rounds.length} 轮 ingest
          </p>
        </div>
        <div className="flex gap-2">
          {projects.length > 0 && (
            <Button onClick={handleStartIngest} disabled={!!ingestStatus}>
              {workspace.rounds.length === 0 ? "开始 Ingest" : "增量 Ingest"}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="projects">项目文件</TabsTrigger>
          <TabsTrigger value="references">参考资料</TabsTrigger>
          {ingestStatus && <TabsTrigger value="progress">处理进度</TabsTrigger>}
          {showQuestions && <TabsTrigger value="questions">问题确认</TabsTrigger>}
          {workspace.rounds.some((r) => r.status === "completed") && (
            <TabsTrigger value="kb">知识库</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="space-y-3">
                {projects.map((p) => (
                  <Card key={p.name} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {p.fileCount} 个文件
                        </span>
                      </div>
                      {p.classification && p.classification.missingTypes.length > 0 && (
                        <Badge variant="outline" className="text-orange-600">
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
              onComplete={() => {
                loadWorkspace();
                setActiveTab("kb");
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="kb" className="mt-4">
          <KBBrowser workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>

      {workspace.rounds.length > 0 && (
        <Card className="mt-6 p-4">
          <h3 className="font-medium mb-3">Ingest 历史</h3>
          <div className="space-y-2">
            {workspace.rounds.map((round) => (
              <div
                key={round.roundNumber}
                className="flex items-center justify-between text-sm py-1 border-b last:border-0"
              >
                <div>
                  <span className="font-medium">Round {round.roundNumber}</span>
                  <span className="text-gray-500 ml-2">
                    {new Date(round.startedAt).toLocaleDateString("zh-CN")}
                  </span>
                  <span className="text-gray-500 ml-2">
                    {round.projects.length} 个项目
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {round.answeredCount}/{round.questionCount} 问题已答
                  </span>
                  <Badge variant={round.status === "completed" ? "default" : "outline"}>
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
