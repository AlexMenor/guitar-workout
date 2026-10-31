import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const exercises = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/exercises' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    minutes: z.number().int().positive(),
    bpm: z.number().int().positive().optional(),
  }),
});

export const collections = { exercises };
