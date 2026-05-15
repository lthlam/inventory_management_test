import { z } from 'zod';

export const emptyRequestSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict(),
}).strict();
