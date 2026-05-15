import { DbClient, query } from '../config/db';

export interface DivisionOption {
  id: string;
  name: string;
}

export interface DepartmentOption {
  id: string;
  division_id: string;
  name: string;
}

export class OrganizationRepository {
  private static getDb(client?: DbClient): DbClient {
    return (client ?? { query }) as DbClient;
  }

  static async findAllDivisions(): Promise<DivisionOption[]> {
    const { rows } = await query<DivisionOption>(
      `
        SELECT id, name
        FROM division
        WHERE is_deleted = FALSE
        ORDER BY name ASC
      `
    );

    return rows;
  }

  static async findAllDepartments(divisionId?: string): Promise<DepartmentOption[]> {
    const params: string[] = [];
    const whereClause = divisionId
      ? 'WHERE is_deleted = FALSE AND division_id = $1'
      : 'WHERE is_deleted = FALSE';
    if (divisionId) {
      params.push(divisionId);
    }

    const { rows } = await query<DepartmentOption>(
      `
        SELECT id, division_id, name
        FROM department
        ${whereClause}
        ORDER BY name ASC
      `,
      params
    );

    return rows;
  }

  static async findDivisionByName(name: string): Promise<DivisionOption | null> {
    const { rows } = await query<DivisionOption>(
      `
        SELECT id, name
        FROM division
        WHERE LOWER(name) = LOWER($1)
          AND is_deleted = FALSE
        LIMIT 1
      `,
      [name]
    );

    return rows[0] ?? null;
  }

  static async createDivision(name: string): Promise<DivisionOption> {
    const { rows } = await query<DivisionOption>(
      `
        INSERT INTO division (name)
        VALUES ($1)
        RETURNING id, name
      `,
      [name]
    );

    return rows[0];
  }

  static async findDepartmentByDivisionAndName(
    divisionId: string,
    name: string
  ): Promise<DepartmentOption | null> {
    const { rows } = await query<DepartmentOption>(
      `
        SELECT id, division_id, name
        FROM department
        WHERE division_id = $1
          AND LOWER(name) = LOWER($2)
          AND is_deleted = FALSE
        LIMIT 1
      `,
      [divisionId, name]
    );

    return rows[0] ?? null;
  }

  static async createDepartment(divisionId: string, name: string): Promise<DepartmentOption> {
    const { rows } = await query<DepartmentOption>(
      `
        INSERT INTO department (division_id, name)
        VALUES ($1, $2)
        RETURNING id, division_id, name
      `,
      [divisionId, name]
    );

    return rows[0];
  }

  static async divisionExistsById(id: string, client?: DbClient): Promise<boolean> {
    const db = this.getDb(client);
    const { rows } = await db.query<{ exists: boolean }>(
      `
        SELECT EXISTS(
          SELECT 1
          FROM division
          WHERE id = $1
            AND is_deleted = FALSE
        ) AS exists
      `,
      [id]
    );

    return rows[0]?.exists ?? false;
  }

  static async departmentExistsById(id: string, client?: DbClient): Promise<boolean> {
    const db = this.getDb(client);
    const { rows } = await db.query<{ exists: boolean }>(
      `
        SELECT EXISTS(
          SELECT 1
          FROM department
          WHERE id = $1
            AND is_deleted = FALSE
        ) AS exists
      `,
      [id]
    );

    return rows[0]?.exists ?? false;
  }
}
