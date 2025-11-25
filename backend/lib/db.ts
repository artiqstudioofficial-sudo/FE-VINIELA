import 'dotenv/config';

import mysql, { Pool, PoolOptions } from 'mysql2/promise';

let pool: Pool | null = null;

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

const poolConfig: PoolOptions = {
  host: env('DB_HOST'),
  user: env('DB_USER'),
  password: env('DB_PASSWORD'),
  database: env('DB_NAME'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export function getDb(): Pool {
  if (!pool) {
    pool = mysql.createPool(poolConfig);
  }
  return pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = getDb();
  const [rows] = await db.query(sql, params);
  return rows as T[];
}
