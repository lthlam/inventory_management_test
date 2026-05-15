import { DbClient, query, withTransaction } from '../config/db';
import { AppError } from '../utils/app.error';
import { DelivererRepository } from './deliverer.repository';
import { InventoryRepository } from './inventory.repository';
import { OrganizationRepository } from './organization.repository';
import { ProductRepository } from './product.repository';
import { SupplierRepository } from './supplier.repository';
import { WarehouseRepository } from './warehouse.repository';

interface CreateStockReceiptInput {
  receiptNumber: string;
  departmentId: string;
  invoiceDocument: string;
  invoiceDate: string;
  debitAccount: string;
  creditAccount: string;
  supplierId: string;
  delivererId: string;
  warehouseId: string;
  receiptDate: string;
  totalAmount: number;
}

interface CreateStockReceiptItemInput {
  receiptId: string;
  productId: string;
  documentQuantity: number;
  actualQuantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface CreateStockReceiptDetailInput {
  productCode: string;
  productName: string;
  unit: string;
  documentQuantity: number;
  actualQuantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface CreateStockReceiptWithDetailsInput {
  receiptNumber: string;
  departmentId: string;
  invoiceDocument: string;
  invoiceDate: string;
  debitAccount: string;
  creditAccount: string;
  supplierId: string;
  delivererId: string;
  warehouseId: string;
  receiptDate: string;
  details: CreateStockReceiptDetailInput[];
}

export class StockReceiptRepository {
  static async create(client: DbClient, data: CreateStockReceiptInput): Promise<string> {
    const { rows } = await client.query<{ id: string }>(
      `
        INSERT INTO warehouse_receipts (
          receipt_no,
          department_id,
          supplier_id,
          deliverer_id,
          warehouse_id,
          receipt_date,
          total_amount,
          invoice_document,
          invoice_date,
          debit_account,
          credit_account
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `,
      [
        data.receiptNumber,
        data.departmentId,
        data.supplierId,
        data.delivererId,
        data.warehouseId,
        data.receiptDate,
        data.totalAmount,
        data.invoiceDocument,
        data.invoiceDate,
        data.debitAccount,
        data.creditAccount
      ]
    );

    return rows[0].id;
  }

  static async createItem(client: DbClient, data: CreateStockReceiptItemInput): Promise<string> {
    const { rows } = await client.query<{ id: string }>(
      `
        INSERT INTO warehouse_receipt_items (
          receipt_id,
          product_id,
          document_quantity,
          actual_quantity,
          unit_price,
          line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        data.receiptId,
        data.productId,
        data.documentQuantity,
        data.actualQuantity,
        data.unitPrice,
        data.totalAmount
      ]
    );

    return rows[0].id;
  }

  static async createWithDetails(data: CreateStockReceiptWithDetailsInput): Promise<string> {
    return withTransaction(async (client) => {
      const warehouseExists = await WarehouseRepository.existsActiveById(data.warehouseId, client);
      if (!warehouseExists) {
        throw new AppError(400, 'Không tìm thấy kho', 'WAREHOUSE_NOT_FOUND');
      }

      const supplierExists = await SupplierRepository.existsActiveById(data.supplierId, client);
      if (!supplierExists) {
        throw new AppError(400, 'Không tìm thấy nhà cung cấp', 'SUPPLIER_NOT_FOUND');
      }

      const departmentExists = await OrganizationRepository.departmentExistsById(data.departmentId, client);
      if (!departmentExists) {
        throw new AppError(400, 'Không tìm thấy bộ phận', 'DEPARTMENT_NOT_FOUND');
      }

      const delivererExists = await DelivererRepository.existsById(data.delivererId, client);
      if (!delivererExists) {
        throw new AppError(400, 'Không tìm thấy người giao', 'DELIVERER_NOT_FOUND');
      }

      const totalAmount = data.details.reduce((sum, detail) => sum + detail.totalAmount, 0);

      const receiptId = await this.create(client, {
        receiptNumber: data.receiptNumber,
        departmentId: data.departmentId,
        invoiceDocument: data.invoiceDocument,
        invoiceDate: data.invoiceDate,
        debitAccount: data.debitAccount,
        creditAccount: data.creditAccount,
        supplierId: data.supplierId,
        delivererId: data.delivererId,
        warehouseId: data.warehouseId,
        receiptDate: data.receiptDate,
        totalAmount
      });

      for (const detail of data.details) {
        const productId = await ProductRepository.upsertByCode(client, {
          code: detail.productCode,
          name: detail.productName,
          unit: detail.unit
        });

        const receiptItemId = await this.createItem(client, {
          receiptId,
          productId,
          documentQuantity: detail.documentQuantity,
          actualQuantity: detail.actualQuantity,
          unitPrice: detail.unitPrice,
          totalAmount: detail.totalAmount
        });

        await InventoryRepository.incrementQuantity(
          client,
          productId,
          data.warehouseId,
          detail.actualQuantity,
          detail.totalAmount
        );

        await InventoryRepository.addTransaction(
          client,
          {
            productId,
            warehouseId: data.warehouseId,
            receiptItemId,
            transactionType: 'IN',
            quantity: detail.actualQuantity,
            unitPrice: detail.unitPrice,
            amount: detail.totalAmount
          }
        );
      }

      return receiptId;
    });
  }

  static async findById(id: string) {
    const [receiptResult, itemsResult] = await Promise.all([
      query<{
        id: string;
        receipt_number: string;
        receipt_date: string;
        department_id: string;
        department_name: string;
        division_id: string;
        division_name: string;
        total_amount: number;
        supplier_id: string;
        supplier_name: string;
        deliverer_name: string;
        warehouse_id: string;
        warehouse_name: string;
        location: string;
        status: string;
        invoice_document: string;
        invoice_date: string;
        debit_account: string;
        credit_account: string;
      }>(
        `
          SELECT
            sr.id,
            sr.receipt_no AS receipt_number,
            sr.receipt_date::text AS receipt_date,
            sr.department_id,
            d.name AS department_name,
            dv.id AS division_id,
            dv.name AS division_name,
            sr.total_amount::float AS total_amount,
            s.id AS supplier_id,
            s.name AS supplier_name,
            dl.name AS deliverer_name,
            sr.warehouse_id AS warehouse_id,
            w.name AS warehouse_name,
            w.address AS location,
            sr.status,
            sr.invoice_document,
            sr.invoice_date::text AS invoice_date,
            sr.debit_account,
            sr.credit_account
          FROM warehouse_receipts sr
          JOIN department d ON d.id = sr.department_id::uuid AND d.is_deleted = FALSE
          JOIN division dv ON dv.id = d.division_id AND dv.is_deleted = FALSE
          JOIN suppliers s ON s.id = sr.supplier_id AND s.is_deleted = FALSE
          JOIN deliverers dl ON dl.id = sr.deliverer_id AND dl.is_deleted = FALSE
          JOIN warehouses w ON w.id = sr.warehouse_id AND w.is_deleted = FALSE
          WHERE sr.id = $1
            AND sr.is_deleted = FALSE
          LIMIT 1
        `,
        [id]
      ),
      query<{
        id: string;
        receipt_id: string;
        product_id: string;
        product_code: string;
        product_name: string;
        unit: string;
        document_quantity: number;
        actual_quantity: number;
        unit_price: number;
        total_amount: number;
      }>(
        `
          SELECT
            sri.id,
            sri.receipt_id,
            sri.product_id,
            p.code AS product_code,
            p.name AS product_name,
            p.unit,
            sri.document_quantity::int AS document_quantity,
            sri.actual_quantity::int AS actual_quantity,
            sri.unit_price::float AS unit_price,
            sri.line_total::float AS total_amount
          FROM warehouse_receipt_items sri
          JOIN products p ON p.id = sri.product_id AND p.is_deleted = FALSE
          WHERE sri.receipt_id = $1
            AND sri.is_deleted = FALSE
          ORDER BY sri.sort_order ASC, sri.created_at ASC
        `,
        [id]
      )
    ]);

    const receipt = receiptResult.rows[0];
    if (!receipt) {
      return null;
    }

    return {
      id: receipt.id,
      receipt_number: receipt.receipt_number,
      receipt_date: receipt.receipt_date,
      department_id: receipt.department_id,
      department_name: receipt.department_name,
      division_id: receipt.division_id,
      division_name: receipt.division_name,
      total_amount: receipt.total_amount,
      supplier_id: receipt.supplier_id,
      supplier_name: receipt.supplier_name,
      deliverer_name: receipt.deliverer_name,
      warehouse_id: receipt.warehouse_id,
      warehouse_name: receipt.warehouse_name,
      location: receipt.location,
      status: receipt.status,
      invoice_document: receipt.invoice_document,
      invoice_date: receipt.invoice_date,
      debit_account: receipt.debit_account,
      credit_account: receipt.credit_account,
      details: itemsResult.rows.map((row) => ({
        id: row.id,
        receipt_id: row.receipt_id,
        product_id: row.product_id,
        product_code: row.product_code,
        product_name: row.product_name,
        unit: row.unit,
        document_quantity: row.document_quantity,
        actual_quantity: row.actual_quantity,
        unit_price: row.unit_price,
        total_amount: row.total_amount
      }))
    };
  }

  static async findAll() {
    const { rows } = await query<{
      id: string;
      receipt_number: string;
      receipt_date: string;
      deliverer_name: string;
      total_quantity: number;
      total_amount: number;
      status: string;
    }>(
      `
        SELECT
          sr.id,
          sr.receipt_no AS receipt_number,
          sr.receipt_date::text AS receipt_date,
          dl.name AS deliverer_name,
          COALESCE(
            SUM(sri.actual_quantity),
            0
          )::int AS total_quantity,
          sr.total_amount::float AS total_amount,
          sr.status
        FROM warehouse_receipts sr
        JOIN deliverers dl ON dl.id = sr.deliverer_id AND dl.is_deleted = FALSE
        LEFT JOIN warehouse_receipt_items sri
          ON sri.receipt_id = sr.id
          AND sri.is_deleted = FALSE
        WHERE sr.is_deleted = FALSE
        GROUP BY sr.id, dl.name
        ORDER BY sr.created_at DESC
      `
    );

    return rows;
  }
}
