import { DbClient, query } from '../config/db';

export interface Deliverer {
  id: string;
  name: string;
}

export class DelivererRepository {
  private static getDb(client?: DbClient): DbClient {
    return (client ?? { query }) as DbClient;
  }

  static async findAll(): Promise<Deliverer[]> {
    const { rows } = await query<Deliverer>(
      `
        SELECT id, name
        FROM deliverers
        WHERE is_deleted = FALSE
        ORDER BY name ASC
      `
    );

    return rows;
  }

  static async findByName(name: string): Promise<Deliverer | null> {
    const { rows } = await query<Deliverer>(
      `
        SELECT id, name
        FROM deliverers
        WHERE LOWER(name) = LOWER($1)
          AND is_deleted = FALSE
        LIMIT 1
      `,
      [name]
    );

    return rows[0] ?? null;
  }

  static async create(name: string): Promise<Deliverer> {
    const { rows } = await query<Deliverer>(
      `
        INSERT INTO deliverers (name)
        VALUES ($1)
        RETURNING id, name
      `,
      [name]
    );

    return rows[0];
  }

  static async existsById(id: string, client?: DbClient): Promise<boolean> {
    const db = this.getDb(client);
    const { rows } = await db.query<{ exists: boolean }>(
      `
        SELECT EXISTS(
          SELECT 1
          FROM deliverers
          WHERE id = $1
            AND is_deleted = FALSE
        ) AS exists
      `,
      [id]
    );

    return rows[0]?.exists ?? false;
  }
}
