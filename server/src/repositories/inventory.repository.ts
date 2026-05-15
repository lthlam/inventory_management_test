import { DbClient, query } from '../config/db';

interface Inventory {
  product_id: string;
  warehouse_id: string;
  quantity: number;
  total_value: number;
}

export interface InventoryListItem {
  product_id: string;
  product_code: string;
  product_name: string;
  unit: string;
  warehouse_id: string;
  warehouse_name: string;
  warehouse_address: string;
  quantity: number;
}

export class InventoryRepository {
  private static getDb(client?: DbClient): DbClient {
    return (client ?? { query }) as DbClient;
  }

  static async findAll(): Promise<Inventory[]> {
    const { rows } = await query<{
      product_id: string;
      warehouse_id: string;
      quantity: number;
      total_value: number;
    }>(
      `
        SELECT
          product_id,
          warehouse_id,
          quantity,
          total_value
        FROM product_stocks
        WHERE is_deleted = FALSE
      `
    );

    return rows.map((row) => ({
      product_id: row.product_id,
      warehouse_id: row.warehouse_id,
      quantity: row.quantity,
      total_value: row.total_value
    }));
  }

  static async findAllWithDetails(): Promise<InventoryListItem[]> {
    const { rows } = await query<InventoryListItem>(
      `
        SELECT
          i.product_id,
          p.code AS product_code,
          p.name AS product_name,
          p.unit,
          i.warehouse_id,
          w.name AS warehouse_name,
          w.address AS warehouse_address,
          i.quantity
        FROM product_stocks i
        INNER JOIN products p ON p.id = i.product_id
        INNER JOIN warehouses w ON w.id = i.warehouse_id
        WHERE i.is_deleted = FALSE
          AND p.is_deleted = FALSE
          AND w.is_deleted = FALSE
        ORDER BY p.code ASC, w.name ASC
      `
    );

    return rows;
  }

  static async findByProductAndWarehouse(productId: string, warehouseId: string): Promise<Inventory | null> {
    const { rows } = await query<{
      product_id: string;
      warehouse_id: string;
      quantity: number;
      total_value: number;
    }>(
      `
        SELECT
          product_id,
          warehouse_id,
          quantity,
          total_value
        FROM product_stocks
        WHERE product_id = $1
          AND warehouse_id = $2
          AND is_deleted = FALSE
        LIMIT 1
      `,
      [productId, warehouseId]
    );

    const row = rows[0];
    return row
      ? {
          product_id: row.product_id,
          warehouse_id: row.warehouse_id,
          quantity: row.quantity,
          total_value: row.total_value
        }
      : null;
  }

  static async incrementQuantity(
    client: DbClient,
    productId: string,
    warehouseId: string,
    quantity: number,
    value: number = 0
  ): Promise<void> {
    const db = this.getDb(client);
    await db.query(
      `
        INSERT INTO product_stocks (product_id, warehouse_id, quantity, total_value)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (product_id, warehouse_id)
        DO UPDATE SET
          quantity = product_stocks.quantity + EXCLUDED.quantity,
          total_value = product_stocks.total_value + EXCLUDED.total_value,
          is_deleted = FALSE
      `,
      [productId, warehouseId, quantity, value]
    );
  }

  static async addTransaction(
    client: DbClient,
    data: {
      productId: string;
      warehouseId: string;
      receiptItemId: string;
      transactionType: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }
  ): Promise<void> {
    const db = this.getDb(client);
    await db.query(
      `
        INSERT INTO warehouse_transactions (
          product_id,
          warehouse_id,
          receipt_item_id,
          transaction_type,
          quantity,
          unit_price,
          amount
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        data.productId,
        data.warehouseId,
        data.receiptItemId,
        data.transactionType,
        data.quantity,
        data.unitPrice,
        data.amount
      ]
    );
  }
}
