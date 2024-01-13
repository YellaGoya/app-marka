import pool from '@/app/lib/api/connection-pool';
import { User } from '@/app/lib/type-def';

export const userByEmail = async (email: string) => {
  const conn = await pool.connect();

  try {
    const data = await conn.query<User>('SELECT * FROM users WHERE email = $1', [email]);

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user data.');
  } finally {
    conn.release();
  }
};
