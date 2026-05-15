import { z } from 'zod';

export const createDelivererSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên người giao không được để trống'),
  }),
});
