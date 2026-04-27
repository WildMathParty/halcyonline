// Import the glob loader
import { glob, file } from "astro/loaders";
// Import utilities from `astro:content`
import { defineCollection } from "astro:content";
// Import Zod
import { z } from "astro/zod";
// Define a `loader` and `schema` for each collection
const blog = defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: "./src/blog" }),
    schema: z.object({
      title: z.string(),
      pubDate: z.date(),
      description: z.string(),
      author: z.string(),
      image: z.object({
        url: z.string(),
        alt: z.string()
      }),
      tags: z.array(z.string())
    })
});
const books = defineCollection({
    loader: file("src/data/books.json"),
    schema: z.object({
      id: z.string(),
      title: z.string(),
      author: z.string(),
      pageCount: z.number(),
      publishDate: z.coerce.date(),
      readDateStart: z.coerce.date(),
      readDateFinish: z.coerce.date().optional(),
      coverUrl: z.string().optional(),
      reviewLink: z.string().optional(),
      tags: z.array(z.string()).default([])
    })
});

// Export a single `collections` object to register your collection(s)
export const collections = { blog, books };