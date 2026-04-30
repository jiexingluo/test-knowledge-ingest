import { nanoid } from "nanoid";
import { aiGenerateText } from "@/lib/ai/provider";
import { getPromptTemplate } from "@/lib/builder/config";
import type { CrossProjectAnalysis, Question } from "@/types";

export async function generateQuestions(
  analysis: CrossProjectAnalysis,
  roundNumber: number
): Promise<Question[]> {
  const promptTemplate = await getPromptTemplate("question-generation");

  const prompt = promptTemplate.replace(
    "{{ANALYSIS_RESULTS}}",
    JSON.stringify(analysis, null, 2)
  );

  const system =
    "You are an ATE test engineering expert. Generate structured review questions in Chinese. Each question must have exactly 3 options. Return a JSON array.";

  const response = await aiGenerateText(system, prompt);

  try {
    const parsed = JSON.parse(extractJSON(response));
    const questions: Question[] = (Array.isArray(parsed) ? parsed : parsed.questions || []).map(
      (q: Partial<Question>) => ({
        id: q.id || `q-${nanoid(8)}`,
        roundNumber,
        category: q.category || "gap",
        group: q.group || "general",
        priority: q.priority || 50,
        title: q.title || "",
        background: q.background || "",
        options: (q.options || []).slice(0, 3),
        relatedEntities: q.relatedEntities || [],
        sourceAnchors: q.sourceAnchors || [],
      })
    );
    return questions.sort((a, b) => b.priority - a.priority);
  } catch {
    return [];
  }
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();
  const bracketMatch = text.match(/\[[\s\S]*\]/);
  if (bracketMatch) return bracketMatch[0];
  return text;
}
