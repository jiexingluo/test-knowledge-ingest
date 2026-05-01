"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionCard } from "@/components/question-card";
import type { Question } from "@/types";

interface QuestionPanelProps {
  workspaceId: string;
  roundNumber: number;
  onComplete: () => void;
}

export function QuestionPanel({
  workspaceId,
  roundNumber,
  onComplete,
}: QuestionPanelProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const loadQuestions = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/questions`);
    const data = await res.json();
    setQuestions(data);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  async function handleAnswer(
    questionId: string,
    selectedOption: number | null,
    customText?: string
  ) {
    await fetch(`/api/workspaces/${workspaceId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId,
        selectedOption,
        customText,
        roundNumber,
      }),
    });
    loadQuestions();
  }

  async function handleComplete() {
    setCompleting(true);
    await fetch(`/api/workspaces/${workspaceId}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", roundNumber }),
    });
    setCompleting(false);
    onComplete();
  }

  if (loading) return <div className="text-gray-500">加载问题中...</div>;

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
          </p>
        </div>
        <Button onClick={handleComplete} disabled={completing}>
          {completing ? "生成知识库中..." : "生成知识库"}
        </Button>
      </div>

      <div className="space-y-6">
        {Array.from(groups.entries()).map(([group, groupQuestions]) => (
          <div key={group}>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="font-medium text-sm text-gray-700 uppercase">
                {group}
              </h4>
              <Badge variant="outline" className="text-xs">
                {groupQuestions.filter((q) => q.answer).length}/
                {groupQuestions.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {groupQuestions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  onAnswer={(selectedOption, customText) =>
                    handleAnswer(q.id, selectedOption, customText)
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
