import { Configuration, OpenAIApi } from "openai";
import { Article } from "../types";

export function summarizePlugin(articles: Article[]): Promise<Article[]> {
  return articles.reduce<Promise<Article[]>>(
    (promise, article) =>
      promise.then(async (result) => {
        if (article.summary) {
          result.push(article);
          return result;
        }

        const summary = await summarize(article);
        result.push({
          ...article,
          summary,
        });

        return result;
      }),
    Promise.resolve([])
  );
}

async function summarize(article: Article): Promise<string> {
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

${article.content.replace(/ +/g, " ")}

                `.trim(),
      },
    ],
  });

  console.error(JSON.stringify(response.data));

  return response.data.choices[0].message?.content;
}
