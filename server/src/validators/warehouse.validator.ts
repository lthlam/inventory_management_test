import { z } from 'zod';

export const createWarehouseSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên kho không được để trống'),
    address: z.string().min(1, 'Địa chỉ kho không được để trống'),
  }),
});
