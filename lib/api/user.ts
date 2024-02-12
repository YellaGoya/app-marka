/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import useSQL from 'lib/api/connection-pool';
import { User } from 'lib/type-def';
import { PoolClient } from 'pg';

type Exists = { exists: boolean };

const getUser = async (tag: string): Promise<User[]> => {
  return useSQL<User>((conn: PoolClient) => {
    return conn.query('SELECT user_id, tag, email, password FROM users WHERE tag = $1', [tag]);
  });
};

const checkUserByTag = async (tag: string): Promise<boolean> => {
  const result = await useSQL<Exists>((conn: PoolClient) => {
    return conn.query('SELECT EXISTS (SELECT 1 FROM users WHERE tag = $1 UNION SELECT 1 FROM waiting WHERE tag = $1)', [tag]);
  });

  return result[0].exists;
};

const checkUserByEmail = async (email: string): Promise<boolean> => {
  const result = await useSQL<Exists>((conn: PoolClient) => {
    return conn.query('SELECT EXISTS (SELECT 1 FROM users WHERE email = $1 UNION SELECT 1 FROM waiting WHERE email = $1)', [email]);
  });

  return result[0].exists;
};

const getWaitingList = async (): Promise<User[]> => {
  const result = await useSQL<User>((conn: PoolClient) => {
    return conn.query('SELECT list_id, tag, email, listed_at FROM waiting');
  });

  return result;
};

const approveUser = async (list_id: number): Promise<any> => {
  const result = await useSQL(async (conn: PoolClient) => {
    try {
      // waiting 테이블에서 승인할 사용자의 정보를 가져온다.
      const { rows } = await conn.query('SELECT * FROM waiting WHERE list_id = $1', [list_id]);
      const user = rows[0];

      if (user) {
        const date = new Date();
        const time = date.toISOString();

        // users 테이블에 사용자 정보를 삽입한다.
        await conn.query('INSERT INTO users (tag, email, password, created_at) VALUES ($1, $2, $3, $4)', [user.tag, user.email, user.password, time]);

        // waiting 테이블에서 승인된 사용자를 제거한다.
        await conn.query('DELETE FROM waiting WHERE list_id = $1', [list_id]);
      }

      await conn.query('COMMIT');
    } catch (error) {
      await conn.query('ROLLBACK');
      console.error('approveUser Transaction Error:', error);

      throw new Error('Failed to approve user.');
    }
  });

  return result;
};

export { getUser, checkUserByTag, checkUserByEmail, getWaitingList, approveUser };
