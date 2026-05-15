import { z } from 'zod';

export const getDepartmentsSchema = z.object({
  query: z.object({
    divisionId: z.string().uuid('divisionId phải là UUID hợp lệ').optional()
  })
});

export const createDivisionSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Tên đơn vị không được để trống')
  })
});

export const createDepartmentSchema = z.object({
  body: z.object({
    divisionId: z.string().uuid('divisionId phải là UUID hợp lệ'),
    name: z.string().trim().min(1, 'Tên bộ phận không được để trống')
  })
});
