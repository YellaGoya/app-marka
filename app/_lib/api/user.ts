import pool from 'app/_lib/api/connection-pool';
import { User } from 'app/_lib/type-def';

export const getUser = async (email: string) => {
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

export const getUserByEmail = async (email: string) => {
  const conn = await pool.connect();

  try {
    const data = await conn.query<User>('SELECT nickname FROM users WHERE email = $1 UNION SELECT nickname FROM waiting WHERE email = $1', [email]);

    return data.rows.length > 0;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user data.');
  } finally {
    conn.release();
  }
};
