import { z } from "zod";

export const ImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
});

export const ArticleSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  author: z.string().optional(),
  date: z.coerce.date().optional(),
  image: ImageSchema.optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  metadata: z
    .object({})
    .catchall(z.string().or(z.number()).or(z.boolean()))
    .optional(),
});

export const RequestedDocumentSchema = z.object({
  date: z.coerce.date(),
  url: z.string(),
  body: z.string(),
});

export const StateSchema = z.object({
  articles: z.array(ArticleSchema),
  cache: z.array(RequestedDocumentSchema),
});
