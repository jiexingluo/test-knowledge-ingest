"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle } from "lucide-react";
import type { Question } from "@/types";

interface QuestionCardProps {
  question: Question;
  submitting?: boolean;
  onAnswer: (selectedOption: number | null, customText?: string) => void;
}

const categoryLabels: Record<string, string> = {
  mismatch: "不一致",
  gap: "信息缺口",
  depth: "深层原因",
  conflict: "冲突",
};

const categoryColors: Record<string, string> = {
  mismatch: "bg-red-100 text-red-700 border-red-200",
  gap: "bg-yellow-100 text-yellow-700 border-yellow-200",
  depth: "bg-blue-100 text-blue-700 border-blue-200",
  conflict: "bg-purple-100 text-purple-700 border-purple-200",
};

export function QuestionCard({ question, submitting = false, onAnswer }: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(
    question.answer?.selectedOption ?? null
  );
  const [customText, setCustomText] = useState(question.answer?.customText || "");
  const [showCustom, setShowCustom] = useState(
    question.answer?.selectedOption === null && !!question.answer?.customText
  );

  function handleSubmit() {
    if (showCustom && customText.trim()) {
      onAnswer(null, customText.trim());
    } else if (selected !== null) {
      onAnswer(selected);
    }
  }

  const isAnswered = !!question.answer;
  const canSubmit = selected !== null || (showCustom && customText.trim().length > 0);

  return (
    <Card className={`p-4 transition-opacity ${isAnswered ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm leading-snug flex-1 pr-2">
          {question.title}
        </h4>
        <Badge className={`shrink-0 text-xs border ${categoryColors[question.category] ?? "bg-gray-100 text-gray-600"}`}>
          {categoryLabels[question.category] ?? question.category}
        </Badge>
      </div>

      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{question.background}</p>

      <div className="space-y-2" role="radiogroup" aria-label={question.title}>
        {question.options.map((opt, i) => (
          <label
            key={i}
            className={`flex items-start gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${
              selected === i && !showCustom
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            } ${isAnswered ? "cursor-default" : ""}`}
          >
            <input
              type="radio"
              name={`q-${question.id}`}
              checked={selected === i && !showCustom}
              onChange={() => { setSelected(i); setShowCustom(false); }}
              className="mt-0.5 shrink-0"
              disabled={isAnswered || submitting}
              aria-label={opt.label}
            />
            <div>
              <span className="text-sm font-medium">{opt.label}</span>
              {opt.description && (
                <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
              )}
            </div>
          </label>
        ))}

        <label
          className={`flex items-start gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${
            showCustom ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          } ${isAnswered ? "cursor-default" : ""}`}
        >
          <input
            type="radio"
            name={`q-${question.id}`}
            checked={showCustom}
            onChange={() => setShowCustom(true)}
            className="mt-0.5 shrink-0"
            disabled={isAnswered || submitting}
            aria-label="其他（自定义回答）"
          />
          <span className="text-sm font-medium">其他</span>
        </label>

        {showCustom && (
          <Textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="请输入您的回答..."
            rows={2}
            disabled={isAnswered || submitting}
            className="text-sm"
            aria-label="自定义回答内容"
          />
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {!isAnswered && (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <><Loader2 className="size-3 mr-1.5 animate-spin" />提交中</>
            ) : (
              "确认"
            )}
          </Button>
        )}
        {isAnswered && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="size-3.5" />
            <span>已回答</span>
          </div>
        )}
      </div>
    </Card>
  );
}
