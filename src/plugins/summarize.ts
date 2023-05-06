import { addDays } from "date-fns";
import { Configuration, OpenAIApi } from "openai";
import { options } from "sanitize-html";
import { Article, Logger, Plugin, State } from "../types";
import { asyncMap, augmentArticle } from "../utils";

type SummarizePluginOptions = {
  logger: Logger;
  maxArticleAgeInDays: number;
  now?: Date;
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

      const prompt = buildSummaryPrompt(article);

      if (!prompt) {
        // Could not build a prompt for this article
        logger.debug("Could not build a prompt for %s", article.id);
        return article;
      }

      if (article.metadata?.summaryPrompt === prompt) {
        // Already been summarized
        logger.debug("Not summarizing %s (already summarized)", article.id);
        return article;
      }

      logger.debug("Summarizing %s", article.id);

      const summary = await answerPrompt(prompt, logger);

      if (!summary) {
        return article;
      }

      return augmentArticle(article, { summary }, { summaryPrompt: prompt });
    }),
  });
}

function buildSummaryPrompt(article: Article): string | undefined {
  const { content } = article;
  if (!content) {
    return;
  }
  return `

  Given the following headline and article text:

  - If the headline is a question, answer it based on the article text.
  - Otherwise, summarize the article text

  Always limit your response to less than 55 words.

  Headline: ${article.title}

  Article Text:

  ${typeof content == "string" ? content : content.text}

                  `.trim();
}

async function answerPrompt(
  prompt: string,
  logger: Logger
): Promise<string | undefined> {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that reads articles and summarizes them.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const data = response.data;

    logger.debug(JSON.stringify(data, null, 2));

    return data.choices[0]?.message?.content;
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
