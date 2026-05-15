import request from 'supertest';
import createApp from '../src/app';

const receiptId = '11111111-1111-1111-1111-111111111111';
const supplierId = '22222222-2222-2222-2222-222222222222';
const warehouseId = '33333333-3333-3333-3333-333333333333';
const productId = '44444444-4444-4444-4444-444444444444';
const receiptItemId = '55555555-5555-5555-5555-555555555555';
const divisionId = '66666666-6666-6666-6666-666666666666';
const departmentId = '77777777-7777-7777-7777-777777777777';
const delivererId = '88888888-8888-8888-8888-888888888888';

jest.mock('../src/config/db', () => ({
  connect: jest.fn().mockResolvedValue({
    query: jest.fn().mockImplementation((...args: unknown[]) => {
      const query = args[0] as string;
      if (query === 'BEGIN') return Promise.resolve();
      if (query === 'COMMIT') return Promise.resolve();
      if (query === 'ROLLBACK') return Promise.resolve();
      if (query.includes('FROM warehouses') && query.includes('AS exists')) {
        return Promise.resolve({ rows: [{ exists: true }] });
      }
      if (query.includes('FROM suppliers') && query.includes('AS exists')) {
        return Promise.resolve({ rows: [{ exists: true }] });
      }
      if (query.includes('FROM department') && query.includes('AS exists')) {
        return Promise.resolve({ rows: [{ exists: true }] });
      }
      if (query.includes('FROM deliverers') && query.includes('AS exists')) {
        return Promise.resolve({ rows: [{ exists: true }] });
      }
      if (query.includes('INSERT INTO warehouse_receipts')) {
        return Promise.resolve({ rows: [{ id: receiptId }] });
      }
      if (query.includes('INSERT INTO products')) {
        return Promise.resolve({ rows: [{ id: productId }] });
      }
      if (query.includes('INSERT INTO warehouse_receipt_items')) {
        return Promise.resolve({ rows: [{ id: receiptItemId }] });
      }
      if (query.includes('INSERT INTO product_stocks')) {
        return Promise.resolve({ rows: [] });
      }
      if (query.includes('INSERT INTO warehouse_transactions')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    }),
    release: jest.fn(),
  } as never),
  withTransaction: jest.fn().mockImplementation(async (fn: unknown) => {
    const client = {
      query: jest.fn().mockImplementation((...args: unknown[]) => {
        const query = args[0] as string;
        if (query.includes('FROM warehouses') && query.includes('AS exists')) {
          return Promise.resolve({ rows: [{ exists: true }] });
        }
        if (query.includes('FROM suppliers') && query.includes('AS exists')) {
          return Promise.resolve({ rows: [{ exists: true }] });
        }
        if (query.includes('FROM department') && query.includes('AS exists')) {
          return Promise.resolve({ rows: [{ exists: true }] });
        }
        if (query.includes('FROM deliverers') && query.includes('AS exists')) {
          return Promise.resolve({ rows: [{ exists: true }] });
        }
        if (query.includes('INSERT INTO warehouse_receipts')) {
          return Promise.resolve({ rows: [{ id: receiptId }] });
        }
        if (query.includes('INSERT INTO products')) {
          return Promise.resolve({ rows: [{ id: productId }] });
        }
        if (query.includes('INSERT INTO warehouse_receipt_items')) {
          return Promise.resolve({ rows: [{ id: receiptItemId }] });
        }
        if (query.includes('INSERT INTO product_stocks')) {
          return Promise.resolve({ rows: [] });
        }
        if (query.includes('INSERT INTO warehouse_transactions')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      }),
    };

    return (fn as (client: unknown) => Promise<unknown>)(client);
  }),
  query: jest.fn().mockImplementation((...args: unknown[]) => {
    const query = args[0] as string;
    if (query.includes('FROM warehouse_receipts sr') && query.includes('WHERE sr.id = $1')) {
      return Promise.resolve({
        rows: [{
          id: receiptId,
          receipt_number: 'PNK001',
          receipt_date: '2023-10-01',
          department_id: departmentId,
          department_name: 'Công ty ABC',
          division_id: divisionId,
          division_name: 'Tổng công ty DBC',
          supplier_id: supplierId,
          supplier_name: 'Nhà cung cấp A',
          warehouse_name: 'Kho Tổng',
          warehouse_id: warehouseId,
          location: 'Hà Nội',
          total_amount: 500000,
          deliverer_name: 'Nguyễn Văn A',
          status: 'COMPLETED',
          invoice_document: 'HD001',
          invoice_date: '2023-09-30',
          debit_account: '156',
          credit_account: '331'
        }]
      });
    }
    if (query.includes('FROM warehouse_receipt_items sri')) {
      return Promise.resolve({
        rows: [{
          id: receiptItemId,
          receipt_id: receiptId,
          product_id: productId,
          product_code: 'SP01',
          product_name: 'Sản phẩm 1',
          unit: 'Cái',
          document_quantity: 10,
          actual_quantity: 10,
          unit_price: 50000,
          total_amount: 500000
        }]
      });
    }
    if (query.includes('FROM warehouse_receipts sr') && query.includes('GROUP BY sr.id')) {
      return Promise.resolve({
        rows: [{
          id: receiptId,
          receipt_number: 'PNK001',
          receipt_date: '2023-10-01',
          deliverer_name: 'Nguyễn Văn A',
          total_quantity: 10,
          total_amount: 500000,
          status: 'COMPLETED'
        }]
      });
    }
    return Promise.resolve({ rows: [] });
  }) as never,
  on: jest.fn(),
}));

describe('Receipts API', () => {
  const app = createApp();

  it('should create a receipt', async () => {
    const payload = {
      receiptNumber: 'PNK001',
      receiptDate: '2023-10-01',
      supplierId,
      departmentId,
      invoiceDocument: 'HD001',
      invoiceDate: '2023-09-30',
      debitAccount: '156',
      creditAccount: '331',
      delivererId,
      warehouseId,
      details: [
        {
          productCode: 'SP01',
          productName: 'Sản phẩm 1',
          unit: 'Cái',
          documentQuantity: 10,
          actualQuantity: 10,
          unitPrice: 50000,
          totalAmount: 500000
        }
      ]
    };

    const response = await request(app)
      .post('/api/receipts')
      .send(payload)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.message).toBe('Tạo phiếu nhập thành công');
  });

  it('should fail validation when required fields are missing', async () => {
    const payload = {
      receiptDate: '2023-10-01',
      supplierId,
      warehouseId,
      details: [] // empty details
    };

    const response = await request(app)
      .post('/api/receipts')
      .send(payload)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'VALIDATION_FAILED');
  });

  it('should fail validation when amount calculation is incorrect', async () => {
    const payload = {
      receiptNumber: 'PNK002',
      receiptDate: '2023-10-01',
      supplierId,
      departmentId,
      invoiceDocument: 'HD002',
      invoiceDate: '2023-09-30',
      debitAccount: '156',
      creditAccount: '331',
      delivererId,
      warehouseId,
      details: [
        {
          productCode: 'SP01',
          productName: 'Sản phẩm 1',
          unit: 'Cái',
          documentQuantity: 10,
          actualQuantity: 10,
          unitPrice: 50000,
          totalAmount: 999999 // Incorrect total
        }
      ]
    };

    const response = await request(app)
      .post('/api/receipts')
      .send(payload)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'VALIDATION_FAILED');
    expect(response.body.message).toContain('Xác thực không thành công');
  });

  it('should list all receipts', async () => {
    const response = await request(app)
      .get('/api/receipts')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('receipt_number', 'PNK001');
  });

  it('should get a receipt by id', async () => {
    const response = await request(app)
      .get(`/api/receipts/${receiptId}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', receiptId);
    expect(response.body.details).toBeDefined();
  });
});
