import { z } from 'zod';

export const createReceiptSchema = z.object({
  body: z.object({
    receiptNumber: z.string().trim().min(1, 'Số phiếu nhập không được để trống'),
    receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có định dạng YYYY-MM-DD'),
    supplierId: z.string().uuid('supplierId phải là UUID hợp lệ'),
    departmentId: z.string().uuid('departmentId phải là UUID hợp lệ'),
    invoiceDocument: z.string().trim().min(1, 'invoiceDocument không được để trống'),
    invoiceDate: z.string().min(1, 'invoiceDate không được để trống').regex(/^\d{4}-\d{2}-\d{2}$/, 'invoiceDate phải có định dạng YYYY-MM-DD'),
    debitAccount: z.string().trim().min(1, 'debitAccount không được để trống'),
    creditAccount: z.string().trim().min(1, 'creditAccount không được để trống'),
    delivererId: z.string().uuid('delivererId phải là UUID hợp lệ'),
    warehouseId: z.string().uuid('warehouseId phải là UUID hợp lệ'),
    details: z.array(
      z.object({
        productCode: z.string().trim().min(1),
        productName: z.string().trim().min(1),
        unit: z.string().trim().min(1),
        documentQuantity: z.number().nonnegative(),
        actualQuantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        totalAmount: z.number().nonnegative()
      }).strict()
    ).min(1, 'Cần ít nhất một dòng chi tiết')
  }).strict().refine((data) => {
    for (const detail of data.details) {
      if (Math.abs(detail.actualQuantity * detail.unitPrice - detail.totalAmount) > 0.01) {
        return false;
      }
    }

    return true;
  }, {
    message: 'Thành tiền phải bằng số lượng thực tế nhân với đơn giá',
    path: ['details']
  })
});

export const getReceiptSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID phải là UUID hợp lệ')
  })
});
