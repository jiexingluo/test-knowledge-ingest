"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkspaceCardSkeleton } from "@/components/skeleton";
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <WorkspaceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">加载失败</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-4xl mb-3" aria-hidden="true">📂</div>
        <p className="text-base font-medium text-gray-500">还没有工作区</p>
        <p className="text-sm mt-1">点击右上角"新建工作区"开始提取知识</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((ws) => {
        const latestRound = ws.rounds[ws.rounds.length - 1];
        return (
          <Link key={ws.id} href={`/workspace/${ws.id}`}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{ws.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{ws.chipType}</p>
                </div>
                {latestRound && (
                  <Badge
                    variant={
                      latestRound.status === "completed"
                        ? "default"
                        : latestRound.status === "awaiting_answers"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {statusLabel(latestRound.status)}
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gray-400">
                <span>{ws.projectCount} 个项目</span>
                <span>{ws.rounds.length} 轮 ingest</span>
                {ws.description && (
                  <span className="truncate text-gray-300">{ws.description}</span>
                )}
              </div>
            </Card>
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
