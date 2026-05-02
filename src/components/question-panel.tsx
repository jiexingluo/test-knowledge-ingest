"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionCard } from "@/components/question-card";
import { Skeleton } from "@/components/skeleton";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Question } from "@/types";

interface QuestionPanelProps {
  workspaceId: string;
  roundNumber: number;
  onComplete: () => void;
}

export function QuestionPanel({ workspaceId, roundNumber, onComplete }: QuestionPanelProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/questions`);
      if (!res.ok) throw new Error(`加载失败 (${res.status})`);
      setQuestions(await res.json());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载问题失败");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  async function handleAnswer(questionId: string, selectedOption: number | null, customText?: string) {
    setSubmitting(questionId);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, selectedOption, customText, roundNumber }),
      });
      if (!res.ok) throw new Error(`提交失败 (${res.status})`);
      await loadQuestions();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "提交失败，请重试");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    const toastId = toast.loading("正在生成知识库，请稍候...");
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", roundNumber }),
      });
      if (!res.ok) throw new Error(`生成失败 (${res.status})`);
      toast.success("知识库生成完成！", { id: toastId });
      onComplete();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失败，请重试", { id: toastId });
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const answered = questions.filter((q) => q.answer).length;
  const total = questions.length;

  const groups = new Map<string, Question[]>();
  for (const q of questions) {
    const group = groups.get(q.group) || [];
    group.push(q);
    groups.set(q.group, group);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">知识确认 (Round {roundNumber})</h3>
          <p className="text-sm text-gray-500">
            共 {total} 个问题 · 已回答 {answered}
            {answered < total && (
              <span className="text-orange-500 ml-1">（未回答的问题将标记为待确认）</span>
            )}
          </p>
        </div>
        <Button onClick={handleComplete} disabled={completing}>
          {completing ? (
            <><Loader2 className="size-4 mr-2 animate-spin" />生成中...</>
          ) : (
            "生成知识库"
          )}
        </Button>
      </div>

      {total === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>没有需要确认的问题</p>
          <p className="text-sm mt-1">可以直接点击"生成知识库"</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([group, groupQuestions]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wide">{group}</h4>
                <Badge variant="outline" className="text-xs">
                  {groupQuestions.filter((q) => q.answer).length}/{groupQuestions.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {groupQuestions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    submitting={submitting === q.id}
                    onAnswer={(selectedOption, customText) =>
                      handleAnswer(q.id, selectedOption, customText)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
