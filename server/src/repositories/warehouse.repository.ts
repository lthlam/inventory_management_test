import { DbClient, query } from '../config/db';

export interface Warehouse {
  id: string;
  name: string;
  address: string;
}

export class WarehouseRepository {
  private static getDb(client?: DbClient): DbClient {
    return (client ?? { query }) as DbClient;
  }

  static async findAll(): Promise<Warehouse[]> {
    const { rows } = await query<Warehouse>(
      `
        SELECT id, name, address
        FROM warehouses
        WHERE is_deleted = FALSE
        ORDER BY name ASC
      `
    );

    return rows;
  }

  static async findByName(name: string): Promise<Warehouse | null> {
    const { rows } = await query<Warehouse>(
      `
        SELECT id, name, address
        FROM warehouses
        WHERE LOWER(name) = LOWER($1)
          AND is_deleted = FALSE
        LIMIT 1
      `,
      [name]
    );

    return rows[0] ?? null;
  }

  static async create(name: string, address?: string): Promise<Warehouse> {
    const { rows } = await query<Warehouse>(
      `
        INSERT INTO warehouses (name, address)
        VALUES ($1, $2)
        RETURNING id, name, address
      `,
      [name, address?.trim() ?? '']
    );

    return rows[0];
  }

  static async existsActiveById(id: string, client?: DbClient): Promise<boolean> {
    const db = this.getDb(client);
    const { rows } = await db.query<{ exists: boolean }>(
      `
        SELECT EXISTS(
          SELECT 1
          FROM warehouses
          WHERE id = $1
            AND is_deleted = FALSE
        ) AS exists
      `,
      [id]
    );

    return rows[0]?.exists ?? false;
  }
}
