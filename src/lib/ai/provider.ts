import { generateText, generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

// 获取配置的 AI 模型实例
function getModel() {
  const provider = process.env.AI_PROVIDER || "anthropic";
  const apiKey = process.env.AI_API_KEY || "";
  const modelId = process.env.AI_MODEL || "claude-sonnet-4-20250514";

  if (provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey });
    return anthropic(modelId);
  }
  if (provider === "openai") {
    const openai = createOpenAI({ apiKey });
    return openai(modelId);
  }
  throw new Error(`不支持的 AI 提供商: ${provider}`);
}

// 生成文本内容
export async function aiGenerateText(
  system: string,
  prompt: string
): Promise<string> {
  const result = await generateText({
    model: getModel(),
    system,
    prompt,
    maxOutputTokens: 16000,
  });
  return result.text;
}

// 生成结构化 JSON 对象
export async function aiGenerateJSON<T>(
  system: string,
  prompt: string,
  schema: z.ZodType<T>
): Promise<T> {
  const result = await generateObject({
    model: getModel(),
    system,
    prompt,
    schema,
    maxOutputTokens: 16000,
  });
  return result.object;
}
