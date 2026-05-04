"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { WorkspaceCardSkeleton } from "@/components/skeleton";
import { ChevronRight, FolderOpen } from "lucide-react";
import type { Workspace } from "@/types";

export function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => {
        if (!r.ok) throw new Error(`请求失败 (${r.status})`);
        return r.json();
      })
      .then(setWorkspaces)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <WorkspaceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-8 text-center">
        <p className="font-medium text-destructive">加载失败</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
          <FolderOpen className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">还没有工作区</p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          点击右上角「新建工作区」开始提取知识
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((ws) => {
        const latestRound = ws.rounds[ws.rounds.length - 1];
        return (
          <Link key={ws.id} href={`/workspace/${ws.id}`}>
            <div className="group relative flex h-full cursor-pointer flex-col rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold leading-snug text-foreground">
                    {ws.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ws.chipType}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {latestRound && (
                    <Badge
                      variant={
                        latestRound.status === "completed"
                          ? "default"
                          : latestRound.status === "awaiting_answers"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {statusLabel(latestRound.status)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-auto flex gap-4 text-xs text-muted-foreground">
                <span>{ws.projectCount} 个项目</span>
                <span>{ws.rounds.length} 轮 Ingest</span>
                {ws.description && (
                  <span className="truncate text-muted-foreground/60">
                    {ws.description}
                  </span>
                )}
              </div>

              <ChevronRight className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/30 transition-colors group-hover:text-primary/50" />
            </div>
          </Link>
        );
      })}
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
