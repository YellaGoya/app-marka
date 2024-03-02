/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import useSQL from 'lib/api/connection-pool';
import { User, FollowingPage, SearchResultPage } from 'lib/type-def';
import { PoolClient } from 'pg';
import { auth } from 'lib/auth';

const getSessionUser = async () => {
  const session = await auth();
  if (!session?.user) throw new Error('Authorization error: Unauthorized User.');

  return session.user;
};

const getUser = async (tag: string): Promise<User> => {
  const { rows } = await useSQL((conn: PoolClient) => {
    return conn.query('SELECT user_id, tag, email, password FROM users WHERE tag = $1', [tag]);
  });

  return rows[0];
};

const getUsersByTag = async (tag: string, pageNumber: number): Promise<SearchResultPage> => {
  const { id } = await getSessionUser();

  const user_id = Number(id);
  const limit = 15;
  const offset = pageNumber * limit;

  pageNumber++;

  const { rows } = await useSQL((conn: PoolClient) => {
    return conn.query(
      'SELECT users.user_id, users.tag, users.email, COALESCE(following.following_id, 0) as following_id FROM users LEFT JOIN following ON users.user_id = following.user_to AND following.user_from = $1 WHERE users.tag LIKE $2 LIMIT $3 OFFSET $4',
      [user_id, tag + '%', limit, offset],
    );
  });

  return { result: rows, newPageNumber: rows.length ? pageNumber : pageNumber - 1 };
};

const getFollowingCount = async (): Promise<number> => {
  const { id } = await getSessionUser();

  const user_id = Number(id);

  const { rows } = await useSQL((conn: PoolClient) => {
    return conn.query('SELECT COUNT(*) FROM following WHERE user_from = $1', [user_id]);
  });

  return rows[0].count;
};

const getFollowingList = async (pageNumber: number): Promise<FollowingPage> => {
  throw new Error('Not implemented yet.');
  const { id } = await getSessionUser();

  const user_id = Number(id);
  const limit = 15;
  const offset = pageNumber * limit;

  pageNumber++;

  const { rows } = await useSQL((conn: PoolClient) => {
    return conn.query(
      'SELECT f.following_id, f.user_to AS user_id, u.tag, u.email FROM following AS f JOIN users AS u ON f.user_to = u.user_id WHERE f.user_from = $1 LIMIT $2 OFFSET $3',
      [user_id, limit, offset],
    );
  });

  return { following: rows, newPageNumber: rows.length ? pageNumber : pageNumber - 1 };
};

const addFollowing = async (target_id: number): Promise<number> => {
  const { id } = await getSessionUser();

  const user_id = Number(id);

  const { rows } = await useSQL((conn: PoolClient) => {
    return conn.query('INSERT INTO following (user_from, user_to) VALUES ($1, $2) RETURNING following_id', [user_id, target_id]);
  });

  return rows[0].following_id;
};

const deleteFollowing = async (following_id: number) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);

  const { rowCount } = await useSQL((conn: PoolClient) => {
    return conn.query('DELETE FROM following WHERE following_id = $1 AND user_from = $2', [following_id, user_id]);
  });

  if (!rowCount) throw new Error('PostgreSql error: failed to delete following.');
};

const checkUserByTag = async (tag: string): Promise<boolean> => {
  const { rows } = await useSQL((conn: PoolClient) => {
    return conn.query('SELECT EXISTS (SELECT 1 FROM users WHERE tag = $1 UNION SELECT 1 FROM waiting WHERE tag = $1)', [tag]);
  });

  return rows[0].exists;
};

const checkUserByEmail = async (email: string): Promise<boolean> => {
  const { rows } = await useSQL((conn: PoolClient) => {
    return conn.query('SELECT EXISTS (SELECT 1 FROM users WHERE email = $1 UNION SELECT 1 FROM waiting WHERE email = $1)', [email]);
  });

  return rows[0].exists;
};

const getWaitingList = async (): Promise<User[]> => {
  const session = await auth();
  if (!session?.user) throw new Error('Authorization error: Unauthorized User.');

  const { rows } = await useSQL((conn: PoolClient) => {
    return conn.query('SELECT list_id, tag, email, listed_at FROM waiting');
  });

  return rows;
};

const approveUser = async (list_id: number): Promise<any> => {
  const session = await auth();
  if (!session?.user) throw new Error('Authorization error: Unauthorized User.');

  await useSQL(async (conn: PoolClient) => {
    try {
      await conn.query('BEGIN');
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

      throw new Error('Failed to approve user.');
    }
  });
};

export {
  getUser,
  getUsersByTag,
  getFollowingCount,
  getFollowingList,
  addFollowing,
  deleteFollowing,
  checkUserByTag,
  checkUserByEmail,
  getWaitingList,
  approveUser,
};
