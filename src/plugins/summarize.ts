import { addDays } from "date-fns";
import { ChatCompletionFunctions, Configuration, OpenAIApi } from "openai";
import { Article, Logger, Plugin, State } from "../types";
import { asyncMap, augmentArticle } from "../utils";
import { z } from "zod";

type SummarizePluginOptions = {
  logger: Logger;
  maxArticleAgeInDays: number;
  now?: Date;
};

const schema = z.object({
  isActuallyLocal: z.boolean(),
  byline: z.array(z.string()),
  nonClickbaitHeadline: z.string(),
  summary: z.string(),
});

const SCHEMA = {
  type: "object",
  required: ["isActuallyLocal", "byline", "nonClickbaitHeadline", "summary"],
  properties: {
    isActuallyLocal: {
      type: "boolean",
      description:
        "Does this article reference events or locations in the Bellingham, WA area (including Whatcom )?",
    },
    byline: {
      type: "array",
      items: {
        type: "string",
      },
      description: "Names of the authors of the article",
    },
    nonClickbaitHeadline: {
      type: "string",
      description:
        "The headline, adapted to remove clickbait language and fully communicate the thesis of the article.",
    },
    summary: {
      type: "string",
      description:
        "A summary of the article, limited to 55 words, with all major people and places named in the article identified.",
    },
  },
};

export function summarizePlugin({
  logger,
  maxArticleAgeInDays,
  now,
}: SummarizePluginOptions): Plugin {
  return async (state: State): Promise<State> => ({
    ...state,
    articles: await asyncMap(state.articles, async (article) => {
      if (!article.date) {
        return article;
      }

      const isTooOld =
        addDays(article.date, maxArticleAgeInDays) < (now ?? new Date());

      if (isTooOld) {
        logger.debug(
          "Not summarizing %s (too old; posted on %s)",
          article.id,
          article.date.toISOString()
        );
        return article;
      }

      const [prompt, func] = buildSummaryPromptAndFunction(article);

      if (!prompt || !func) {
        // Could not build a prompt for this article
        logger.debug("Could not build a prompt for %s", article.id);
        return article;
      }

      const promptAndFunctionJson = JSON.stringify({ prompt, func });

      if (article.metadata?.summaryPrompt === promptAndFunctionJson) {
        // Already been summarized
        logger.debug("Not summarizing %s (already summarized)", article.id);
        return article;
      }

      logger.debug("Summarizing %s", article.id);

      const info = await answerPrompt(prompt, func, logger);

      if (!info) {
        return article;
      }

      return augmentArticle(
        article,
        {
          author: info.byline.join(", "),
          nonClickbaitTitle: info.nonClickbaitHeadline,
          summary: info.summary,
        },
        { summaryPrompt: promptAndFunctionJson, aiInfo: JSON.stringify(info) }
      );
    }),
  });
}

function buildSummaryPromptAndFunction(
  article: Article
): [string, ChatCompletionFunctions] | [] {
  const textContent = (article.content?.text ?? "").trim();

  if (textContent.length === 0) {
    return [];
  }
  const prompt = `
Read the following news headline and article text and report back information about it.

Headline: ${article.title}

Article text:
${textContent}`.trim();

  const func: ChatCompletionFunctions = {
    name: "reportNewsArticleInformation",
    description: "Reports information about a news article back to the user",
    parameters: SCHEMA,
  };

  return [prompt, func];
}

async function answerPrompt(
  prompt: string,
  func: ChatCompletionFunctions,
  logger: Logger
): Promise<z.infer<typeof schema> | undefined> {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0613",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      functions: [func],
    });

    const data = response.data;

    logger.debug(JSON.stringify(data, null, 2));

    const { message } = response.data.choices[0];

    if (!message) {
      return;
    }

    const { function_call: functionCall } = message;

    if (!functionCall) {
      throw new Error("No function call in response");
    }

    if (functionCall.name !== "reportNewsArticleInformation") {
      throw new Error(`Called function ${functionCall.name}`);
    }

    if (functionCall.arguments == null) {
      throw new Error("No arguments");
    }

    return schema.parse(JSON.parse(functionCall.arguments));
  } catch (err: any) {
    if (err.response) {
      logger.warn(err.response.status, err.response.data);
      logger.debug(prompt);
    } else {
      logger.warn(err);
    }

    return;
  }
}
