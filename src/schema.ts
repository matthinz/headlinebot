import { z } from "zod";

export const ImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
});

export const TextContentSchema = z.object({
  text: z.string(),
  html: z.string(),
});

export const ArticleSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  author: z.string().optional(),
  date: z.coerce.date().optional(),
  image: ImageSchema.optional(),
  summary: z.string().optional(),
  content: TextContentSchema.optional(),
  metadata: z
    .object({})
    .catchall(z.string().or(z.number()).or(z.boolean()))
    .optional(),
});

export const ArtifactSchema = z.object({
  name: z.string(),
  contentType: z.string(),
  content: z.string().or(z.instanceof(Buffer)),
  isPublic: z.boolean(),
});

export const RequestedDocumentSchema = z.object({
  date: z.coerce.date(),
  url: z.string(),
  body: z.string(),
});

export const StateSchema = z.object({
  articles: z.array(ArticleSchema),
  cache: z.array(RequestedDocumentSchema),
  artifacts: z.array(ArtifactSchema).optional(),
});
