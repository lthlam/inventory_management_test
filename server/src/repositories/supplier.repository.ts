import { DbClient, query } from '../config/db';

export interface Supplier {
  id: string;
  name: string;
}

export class SupplierRepository {
  private static getDb(client?: DbClient): DbClient {
    return (client ?? { query }) as DbClient;
  }

  static async findAll(): Promise<Supplier[]> {
    const { rows } = await query<Supplier>(
      `
        SELECT id, name
        FROM suppliers
        WHERE is_deleted = FALSE
        ORDER BY name ASC
      `
    );

    return rows;
  }

  static async findByName(name: string): Promise<Supplier | null> {
    const { rows } = await query<Supplier>(
      `
        SELECT id, name
        FROM suppliers
        WHERE LOWER(name) = LOWER($1)
          AND is_deleted = FALSE
        LIMIT 1
      `,
      [name]
    );

    return rows[0] ?? null;
  }

  static async create(name: string): Promise<Supplier> {
    const { rows } = await query<Supplier>(
      `
        INSERT INTO suppliers (name)
        VALUES ($1)
        RETURNING id, name
      `,
      [name]
    );

    return rows[0];
  }

  static async existsActiveById(id: string, client?: DbClient): Promise<boolean> {
    const db = this.getDb(client);
    const { rows } = await db.query<{ exists: boolean }>(
      `
        SELECT EXISTS(
          SELECT 1
          FROM suppliers
          WHERE id = $1
            AND is_deleted = FALSE
        ) AS exists
      `,
      [id]
    );

    return rows[0]?.exists ?? false;
  }
}
