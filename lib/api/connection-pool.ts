/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 8,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const useSQL = async <T>(query: any): Promise<T[]> => {
  const conn = await pool.connect();

  try {
    const data = await query(conn);

    return data?.rows;
  } catch (error) {
    console.error('Database Error:', error);

    throw error;
  } finally {
    conn.release();
  }
};

export default useSQL;
