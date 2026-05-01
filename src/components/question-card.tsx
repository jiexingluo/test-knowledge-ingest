"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Question } from "@/types";

interface QuestionCardProps {
  question: Question;
  onAnswer: (selectedOption: number | null, customText?: string) => void;
}

const categoryLabels: Record<string, string> = {
  mismatch: "不一致",
  gap: "信息缺口",
  depth: "深层原因",
  conflict: "冲突",
};

const categoryColors: Record<string, string> = {
  mismatch: "bg-red-100 text-red-700",
  gap: "bg-yellow-100 text-yellow-700",
  depth: "bg-blue-100 text-blue-700",
  conflict: "bg-purple-100 text-purple-700",
};

export function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(
    question.answer?.selectedOption ?? null
  );
  const [customText, setCustomText] = useState(
    question.answer?.customText || ""
  );
  const [showCustom, setShowCustom] = useState(
    question.answer?.selectedOption === null && !!question.answer?.customText
  );

  function handleSubmit() {
    if (showCustom) {
      onAnswer(null, customText);
    } else if (selected !== null) {
      onAnswer(selected);
    }
  }

  const isAnswered = !!question.answer;

  return (
    <Card className={`p-4 ${isAnswered ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm leading-snug flex-1">
          {question.title}
        </h4>
        <Badge className={`ml-2 text-xs ${categoryColors[question.category]}`}>
          {categoryLabels[question.category]}
        </Badge>
      </div>

      <p className="text-xs text-gray-500 mb-3">{question.background}</p>

      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <label
            key={i}
            className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
              selected === i && !showCustom
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name={`q-${question.id}`}
              checked={selected === i && !showCustom}
              onChange={() => {
                setSelected(i);
                setShowCustom(false);
              }}
              className="mt-0.5"
              disabled={isAnswered}
            />
            <div>
              <span className="text-sm font-medium">{opt.label}</span>
              <p className="text-xs text-gray-500">{opt.description}</p>
            </div>
          </label>
        ))}

        <label
          className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
            showCustom
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            name={`q-${question.id}`}
            checked={showCustom}
            onChange={() => setShowCustom(true)}
            className="mt-0.5"
            disabled={isAnswered}
          />
          <span className="text-sm font-medium">其他</span>
        </label>

        {showCustom && (
          <Textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="请输入您的回答..."
            rows={2}
            disabled={isAnswered}
            className="text-sm"
          />
        )}
      </div>

      {!isAnswered && (
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={selected === null && !showCustom}
          className="mt-3"
        >
          确认
        </Button>
      )}

      {isAnswered && (
        <div className="mt-2 text-xs text-green-600">已回答</div>
      )}
    </Card>
  );
}
