"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowRight, AlertCircle } from "lucide-react";
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
  const stepLabels = progress.totalSteps === 7 ? STEP_LABELS_7 : STEP_LABELS_6;

  return (
    <Card className="p-6 max-w-lg">
      <h3 className="font-medium mb-4">处理进度</h3>

      <div className="mb-5">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-700">{progress.stepLabel}</span>
          <span className="font-medium tabular-nums">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>

      {progress.projectProgress && (
        <div className="text-sm text-gray-600 mb-4 bg-blue-50 rounded px-3 py-2">
          正在处理：<span className="font-medium">{progress.projectProgress.currentProject}</span>
          <span className="text-gray-400 ml-2">
            ({progress.projectProgress.current}/{progress.projectProgress.total})
          </span>
        </div>
      )}

      <div className="space-y-2.5">
        {Array.from({ length: progress.totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < progress.currentStep;
          const isCurrent = stepNum === progress.currentStep;
          const label = stepLabels[i] ?? `步骤 ${stepNum}`;
          return (
            <div
              key={stepNum}
              className={`flex items-center gap-2.5 text-sm transition-colors ${
                isDone ? "text-green-600" : isCurrent ? "text-blue-600 font-medium" : "text-gray-300"
              }`}
            >
              {isDone ? (
                <CheckCircle className="size-4 shrink-0" />
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
        <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded text-sm">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{progress.error}</span>
        </div>
      )}

      {progress.status === "awaiting_answers" && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">
          ✅ 分析完成，请切换到"问题确认"标签页回答问题。
        </div>
      )}

      {progress.status === "completed" && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded text-sm">
          🎉 知识库已生成完成！
        </div>
      )}
    </Card>
  );
}
