import { Configuration, OpenAIApi } from "openai";
import { Article, Logger, Plugin, State } from "../types";

type SummarizePluginOptions = {
  logger: Logger;
};

export function summarizePlugin({ logger }: SummarizePluginOptions): Plugin {
  return async (state: State): Promise<State> => ({
    ...state,
    articles: await state.articles.reduce<Promise<Article[]>>(
      (promise: Promise<Article[]>, article: Article) =>
        promise.then(async (result) => {
          if (article.summary) {
            result.push(article);
            return result;
          }

          const summary = await summarize(article, logger);
          if (summary) {
            result.push({
              ...article,
              summary,
            });
          } else {
            result.push(article);
          }

          return result;
        }),
      Promise.resolve([])
    ),
  });
}

async function summarize(
  article: Article,
  logger: Logger
): Promise<string | undefined> {
  const { content } = article;
  if (!content) {
    return;
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant who reads local newspaper articles and summarizes them.",
      },
      {
        role: "user",
        content: `
Given the following headline and article text, summarize the article in 2-3 sentences.
If there is any ambiguity or clickbaity questions posted by the headline, answer them first in your summary.

Headline: ${article.title}

Article Text:

${content.replace(/ +/g, " ")}

                `.trim(),
      },
    ],
  });

  logger.debug(JSON.stringify(response.data, null, 2));

  return response.data.choices[0].message?.content;
}
