import type Anthropic from "@anthropic-ai/sdk";
import { getHelpArticle } from "@/lib/ai/help-articles";
import { getHelpArticleInputSchema, helpTopicSchema } from "@/lib/schemas/ai-schema";
import type { ChatLocale } from "@/lib/schemas/ai-schema";
import type { ToolExecutionResult } from "./types";

export const getHelpArticleToolDefinition: Anthropic.Tool = {
  name: "get_help_article",
  description: "Look up a curated WeShareCozy help article by topic slug.",
  input_schema: {
    type: "object",
    properties: {
      topic: { type: "string", enum: helpTopicSchema.options },
    },
    required: ["topic"],
  },
};

export async function executeGetHelpArticle(
  rawInput: unknown,
  locale: ChatLocale,
): Promise<ToolExecutionResult> {
  const input = getHelpArticleInputSchema.parse(rawInput ?? {});
  const article = getHelpArticle(input.topic, locale);

  return {
    result: {
      title: article.title,
      bodyMarkdown: article.body,
      url: `/${locale}/help/${input.topic}`,
    },
    flagged: false,
    flagReasons: [],
  };
}
