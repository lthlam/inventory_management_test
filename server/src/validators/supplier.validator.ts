import { z } from 'zod';

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên nhà cung cấp không được để trống'),
  }),
});
