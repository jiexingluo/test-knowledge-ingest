"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { IngestProgress as IngestProgressType } from "@/types";

interface IngestProgressProps {
  progress: IngestProgressType;
}

export function IngestProgress({ progress }: IngestProgressProps) {
  const percentage = Math.round(
    (progress.currentStep / progress.totalSteps) * 100
  );

  return (
    <Card className="p-6">
      <h3 className="font-medium mb-4">处理进度</h3>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>{progress.stepLabel}</span>
          <span>{percentage}%</span>
        </div>
        <Progress value={percentage} />
      </div>

      {progress.projectProgress && (
        <div className="text-sm text-gray-600 mb-4">
          正在处理: {progress.projectProgress.currentProject} (
          {progress.projectProgress.current}/{progress.projectProgress.total})
        </div>
      )}

      <div className="space-y-2">
        {Array.from({ length: progress.totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < progress.currentStep;
          const isCurrent = stepNum === progress.currentStep;
          return (
            <div
              key={stepNum}
              className={`flex items-center gap-2 text-sm ${
                isDone
                  ? "text-green-600"
                  : isCurrent
                    ? "text-blue-600 font-medium"
                    : "text-gray-400"
              }`}
            >
              <span>{isDone ? "✓" : isCurrent ? "→" : "○"}</span>
              <span>Step {stepNum}</span>
            </div>
          );
        })}
      </div>

      {progress.error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm">
          {progress.error}
        </div>
      )}

      {progress.status === "awaiting_answers" && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">
          处理完成，请切换到"问题确认"标签页回答问题。
        </div>
      )}
    </Card>
  );
}
