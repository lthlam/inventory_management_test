import { DbClient, query } from '../config/db';

export interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
}

interface ImportProductInput {
  code: string;
  name: string;
  unit: string;
}

export class ProductRepository {
  private static getDb(client?: DbClient): DbClient {
    return (client ?? { query }) as DbClient;
  }

  static async findAll(): Promise<Product[]> {
    const { rows } = await query<Product>(
      `
        SELECT
          p.id,
          p.code,
          p.name,
          p.unit
        FROM products p
        WHERE p.is_deleted = FALSE
        ORDER BY p.code ASC
      `
    );

    return rows;
  }

  static async findActiveRecordByCode(code: string, client?: DbClient): Promise<Product | null> {
    const db = this.getDb(client);
    const { rows } = await db.query<Product>(
      `
        SELECT id, code, name, unit
        FROM products
        WHERE code = $1
          AND is_deleted = FALSE
        LIMIT 1
      `,
      [code]
    );

    return rows[0] ?? null;
  }

  static async upsertByCode(
    client: DbClient,
    data: ImportProductInput
  ): Promise<string> {
    const db = this.getDb(client);
    const { rows } = await db.query<{ id: string }>(
      `
        INSERT INTO products (code, name, unit)
        VALUES ($1, $2, $3)
        ON CONFLICT (code) WHERE is_deleted = FALSE
        DO UPDATE SET
          name = EXCLUDED.name,
          unit = EXCLUDED.unit
        RETURNING id
      `,
      [data.code, data.name, data.unit]
    );

    return rows[0].id;
  }
}
