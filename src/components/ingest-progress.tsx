"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import type { IngestProgress as IngestProgressType } from "@/types";

interface IngestProgressProps {
  progress: IngestProgressType;
}

const STEP_LABELS_6 = [
  "文件分类",
  "实体提取",
  "跨项目分析",
  "生成确认问题",
  "等待用户确认",
  "组装知识库",
];

const STEP_LABELS_7 = [
  "文件分类",
  "实体提取",
  "跨项目分析",
  "增量差异分析",
  "生成确认问题",
  "等待用户确认",
  "组装知识库",
];

export function IngestProgress({ progress }: IngestProgressProps) {
  const percentage = Math.round(
    (progress.currentStep / progress.totalSteps) * 100
  );
  const stepLabels =
    progress.totalSteps === 7 ? STEP_LABELS_7 : STEP_LABELS_6;
  const isDone = progress.status === "completed";
  const isFailed = progress.status === "failed";

  return (
    <Card className="p-6 max-w-lg">
      <div className="mb-5 flex items-center gap-2">
        <h3 className="font-semibold text-foreground">处理进度</h3>
        {!isDone && !isFailed && (
          <Loader2 className="size-4 animate-spin text-primary" />
        )}
      </div>

      <div className="mb-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium text-foreground">
            {progress.stepLabel}
          </span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {percentage}%
          </span>
        </div>
        <Progress value={percentage} className="h-1.5" />
      </div>

      {progress.projectProgress && (
        <div className="mb-4 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-foreground">
          <span className="text-xs text-muted-foreground">正在处理：</span>{" "}
          <span className="font-medium">
            {progress.projectProgress.currentProject}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            ({progress.projectProgress.current}/{progress.projectProgress.total})
          </span>
        </div>
      )}

      <div className="space-y-2">
        {Array.from({ length: progress.totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const stepDone = stepNum < progress.currentStep;
          const isCurrent = stepNum === progress.currentStep;
          const label = stepLabels[i] ?? `步骤 ${stepNum}`;

          return (
            <div
              key={stepNum}
              className={`flex items-center gap-2.5 text-sm transition-colors ${
                stepDone
                  ? "text-emerald-600"
                  : isCurrent
                    ? "font-medium text-primary"
                    : "text-muted-foreground/40"
              }`}
            >
              {stepDone ? (
                <CheckCircle2 className="size-4 shrink-0" />
              ) : isCurrent ? (
                <ArrowRight className="size-4 shrink-0 animate-pulse" />
              ) : (
                <Circle className="size-4 shrink-0" />
              )}
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      {progress.error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{progress.error}</span>
        </div>
      )}

      {progress.status === "awaiting_answers" && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          ✅ 分析完成，请切换到「问题确认」标签页回答问题。
        </div>
      )}

      {progress.status === "completed" && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          🎉 知识库已生成完成！
        </div>
      )}
    </Card>
  );
}
