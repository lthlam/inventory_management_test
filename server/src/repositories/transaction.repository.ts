import { DbClient, query } from '../config/db';

export interface TransactionListItem {
  id: string;
  transaction_type: string;
  quantity: number;
  unit_price: number;
  amount: number;
  transaction_date: string;
  product_code: string;
  product_name: string;
  warehouse_name: string;
  receipt_no: string;
  receipt_id: string;
}

export class TransactionRepository {
  private static getDb(client?: DbClient): DbClient {
    return (client ?? { query }) as DbClient;
  }

  static async findAll(): Promise<TransactionListItem[]> {
    const { rows } = await query<TransactionListItem>(
      `
        SELECT
          t.id,
          t.transaction_type,
          t.quantity::float,
          t.unit_price::float,
          t.amount::float,
          t.transaction_date,
          p.code AS product_code,
          p.name AS product_name,
          w.name AS warehouse_name,
          r.receipt_no,
          r.id AS receipt_id
        FROM warehouse_transactions t
        INNER JOIN products p ON p.id = t.product_id AND p.is_deleted = FALSE
        INNER JOIN warehouses w ON w.id = t.warehouse_id AND w.is_deleted = FALSE
        INNER JOIN warehouse_receipt_items ri ON ri.id = t.receipt_item_id AND ri.is_deleted = FALSE
        INNER JOIN warehouse_receipts r ON r.id = ri.receipt_id AND r.is_deleted = FALSE
        WHERE t.is_deleted = FALSE
        ORDER BY t.transaction_date DESC
      `
    );

    return rows;
  }
}
