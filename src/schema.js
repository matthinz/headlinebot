"use strict";
exports.__esModule = true;
exports.StateSchema = exports.RequestedDocumentSchema = exports.ArticleSchema = exports.ImageSchema = void 0;
var zod_1 = require("zod");
exports.ImageSchema = zod_1.z.object({
    src: zod_1.z.string(),
    alt: zod_1.z.string()
});
exports.ArticleSchema = zod_1.z.object({
    id: zod_1.z.string(),
    url: zod_1.z.string(),
    title: zod_1.z.string(),
    author: zod_1.z.string().optional(),
    date: zod_1.z.coerce.date().optional(),
    image: exports.ImageSchema.optional(),
    summary: zod_1.z.string().optional(),
    content: zod_1.z.string().optional(),
    metadata: zod_1.z
        .object({})
        .catchall(zod_1.z.string().or(zod_1.z.number()).or(zod_1.z.boolean()))
        .optional()
});
exports.RequestedDocumentSchema = zod_1.z.object({
    date: zod_1.z.coerce.date(),
    url: zod_1.z.string(),
    body: zod_1.z.string()
});
exports.StateSchema = zod_1.z.object({
    articles: zod_1.z.array(exports.ArticleSchema),
    cache: zod_1.z.array(exports.RequestedDocumentSchema)
});
