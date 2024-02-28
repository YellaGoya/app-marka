'use server';

import useSQL from 'lib/api/connection-pool';
import { PoolClient } from 'pg';
import { auth } from 'lib/auth';

import { Diary, History } from 'lib/type-def';

const getSessionUser = async () => {
  const session = await auth();
  if (!session?.user) throw new Error('Authorization error: Unauthorized User.');

  return session.user;
};

const addDiary = async (diary: Diary, time: number) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);
  const diary_id = String(id) + String(diary.diary_id);

  const action = 'add';

  await useSQL(async (conn: PoolClient) => {
    try {
      await conn.query('BEGIN');

      await conn.query(
        `INSERT INTO diaries (user_id, diary_id, title, content_html, extracted_todos, manual_todos, created_at, updated_at, is_secret)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          user_id,
          diary_id,
          diary.title,
          diary.content_html,
          JSON.stringify(diary.extracted_todos), // JSON 배열을 문자열로 직렬화
          JSON.stringify(diary.manual_todos), // 마찬가지로 JSON 배열을 문자열로 직렬화
          diary.created_at,
          diary.updated_at,
          diary.is_secret,
        ],
      );

      await conn.query(
        `INSERT INTO history (diary_id, user_id, time, action)
        VALUES ($1, $2, $3, $4)`,
        [diary_id, user_id, time, action],
      );

      await conn.query('COMMIT');
    } catch {
      await conn.query('ROLLBACK');

      throw new Error('PostgreSql error: failed to add diary.');
    }
  });
};

const updateDiary = async (diary: Diary, time: number) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);
  const diary_id = String(id) + String(diary.diary_id);

  const action = 'update';

  await useSQL(async (conn: PoolClient) => {
    try {
      await conn.query('BEGIN');

      await conn.query(
        `UPDATE diaries
      SET
        title = $1,
        content_html = $2,
        extracted_todos = $3,
        manual_todos = $4,
        updated_at = $5,
        is_secret = $6
      WHERE user_id = $7 AND diary_id = $8`,
        [
          diary.title,
          diary.content_html,
          JSON.stringify(diary.extracted_todos),
          JSON.stringify(diary.manual_todos),
          diary.updated_at,
          diary.is_secret,
          user_id,
          diary_id,
        ],
      );

      await conn.query(
        `UPDATE history
        SET time = $3, action = $4
        WHERE diary_id = $1 AND user_id = $2;`,
        [diary_id, user_id, time, action],
      );

      await conn.query('COMMIT');
    } catch {
      await conn.query('ROLLBACK');

      throw new Error('PostgreSql error: failed to update diary.');
    }
  });
};

// eslint-disable-next-line max-params
const updateStatus = async (place: 'extracted' | 'manual', diary_id: number | string, todo_id: string, status: boolean, time: number) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);
  diary_id = String(id) + String(diary_id);

  const action = 'update';
  const todoType = place === 'extracted' ? 'extracted_todos' : 'manual_todos';

  await useSQL(async (conn: PoolClient) => {
    try {
      const { rows } = await conn.query(`SELECT ${todoType} FROM diaries WHERE user_id = $1 AND diary_id = $2`, [user_id, diary_id]);

      const extracted_todos = rows[0][todoType];

      const idx = extracted_todos.findIndex(([id]: [string]) => id === todo_id);

      extracted_todos[idx][1].done = status;

      await conn.query(
        `UPDATE diaries SET ${todoType} = $1 
      WHERE user_id = $2 AND diary_id = $3`,
        [JSON.stringify(extracted_todos), user_id, diary_id],
      );

      await conn.query(
        `UPDATE history
        SET time = $3, action = $4
        WHERE diary_id = $1 AND user_id = $2;`,
        [diary_id, user_id, time, action],
      );

      await conn.query('COMMIT');
    } catch {
      await conn.query('ROLLBACK');

      throw new Error('PostgreSql error: failed to update status.');
    }
  });
};

const removeDiary = async (diary_id: number | string, time: number) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);
  diary_id = String(id) + String(diary_id);

  const action = 'remove';

  await useSQL(async (conn: PoolClient) => {
    try {
      await conn.query('BEGIN');

      await conn.query('DELETE FROM diaries WHERE user_id = $1 AND diary_id = $2', [user_id, diary_id]);

      await conn.query(
        `UPDATE history
        SET time = $3, action = $4
        WHERE diary_id = $1 AND user_id = $2;`,
        [diary_id, user_id, time, action],
      );

      await conn.query('COMMIT');
    } catch {
      await conn.query('ROLLBACK');

      throw new Error('PostgreSql error: failed to remove diary.');
    }
  });
};

const readDiary = async (diary_id: string) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);

  const { rows } = await useSQL(async (conn: PoolClient) => {
    return conn.query(
      `SELECT * FROM diaries 
    WHERE user_id = $1 AND diary_id = $2`,
      [user_id, diary_id],
    );
  });

  return rows[0];
};

const readDiaries = async (pageNumber: number) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);
  const limit = 10;
  const offset = pageNumber * limit;

  pageNumber++;

  const { rows } = await useSQL(async (conn: PoolClient) => {
    return conn.query(
      `SELECT * FROM diaries 
    WHERE user_id = $1 
    ORDER BY created_at 
    DESC LIMIT $2 OFFSET $3`,
      [user_id, limit, offset],
    );
  });

  return { diaries: rows, newPageNumber: rows.length ? pageNumber : pageNumber - 1 };
};

const readFollowingDiaries = async (pageNumber: number) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);
  const limit = 20;
  const offset = pageNumber * limit;

  pageNumber++;

  const { rows } = await useSQL(async (conn: PoolClient) => {
    return conn.query(
      `SELECT diaries.diary_id, diaries.title, diaries.created_at, diaries.extracted_todos, diaries.manual_todos, users.tag, users.email 
      FROM diaries JOIN users ON diaries.user_id = users.user_id WHERE diaries.user_id 
      IN ( SELECT following.user_to FROM following WHERE following.user_from = $1 ) 
      AND diaries.is_secret = false 
      ORDER BY diaries.created_at 
      DESC LIMIT $2 OFFSET $3`,
      [user_id, limit, offset],
    );
  });

  return { diaries: rows, newPageNumber: rows.length ? pageNumber : pageNumber - 1 };
};

const changeHistory = async (histories: History[]) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);

  await useSQL(async (conn: PoolClient) => {
    try {
      await conn.query('BEGIN');

      for (const history of histories) {
        const { diary_id, time, action } = history;
        await conn.query(
          `INSERT INTO history (diary_id, user_id, time, action)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (diary_id)
          DO UPDATE SET time = $3, action = $4`,
          [String(user_id) + String(diary_id), time, action],
        );
      }

      await conn.query('COMMIT');
    } catch {
      await conn.query('ROLLBACK');

      throw new Error('PostgreSql error: failed to change history.');
    }
  });
};

const getHistories = async () => {
  const { id } = await getSessionUser();

  const user_id = Number(id);

  const { rows } = await useSQL(async (conn: PoolClient) => {
    return conn.query(
      `SELECT * FROM history 
    WHERE user_id = $1`,
      [user_id],
    );
  });

  return rows;
};

export { addDiary, updateDiary, updateStatus, removeDiary, readDiary, readDiaries, readFollowingDiaries, changeHistory, getHistories };
