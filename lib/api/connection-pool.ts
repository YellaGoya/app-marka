/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 8,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const useSQL = async (query: any): Promise<any> => {
  const conn = await pool.connect();

  try {
    const data = await query(conn);

    return data;
  } finally {
    conn.release();
  }
};

export default useSQL;
