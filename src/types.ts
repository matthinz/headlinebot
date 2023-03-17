import { z } from "zod";
import {
  ArticleSchema,
  ArtifactSchema,
  ImageSchema,
  RequestedDocumentSchema,
  StateSchema,
  TextContentSchema,
} from "./schema";

export type Artifact = z.infer<typeof ArtifactSchema>;

export type TextContent = z.infer<typeof TextContentSchema>;

export type Image = z.infer<typeof ImageSchema>;

export type Article = z.infer<typeof ArticleSchema>;

export type RequestedDocument = z.infer<typeof RequestedDocumentSchema>;

export type State = z.infer<typeof StateSchema>;

export type Plugin = (
  state: State,
  next: (state?: State) => Promise<State>
) => Promise<State>;

export type Scraper = {
  key: keyof Article;
  selector: string;
  reader: ($el: cheerio.Cheerio) => any;
};

export type Logger = {
  debug: (...args: any[]) => Logger;
  info: (...args: any[]) => Logger;
  warn: (...args: any[]) => Logger;
};
