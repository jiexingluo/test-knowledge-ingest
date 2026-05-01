"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Workspace } from "@/types";

export function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then(setWorkspaces)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">加载中...</div>;

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">还没有工作区</p>
        <p className="text-sm mt-1">创建一个工作区开始提取知识</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((ws) => {
        const latestRound = ws.rounds[ws.rounds.length - 1];
        return (
          <Link key={ws.id} href={`/workspace/${ws.id}`}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{ws.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{ws.chipType}</p>
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
