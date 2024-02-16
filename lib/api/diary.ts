'use server';

import useSQL from 'lib/api/connection-pool';
import { PoolClient } from 'pg';
import { auth } from 'lib/auth';

import { Diary } from 'lib/type-def';

let pageNumber: number;

const getSessionUser = async () => {
  const session = await auth();
  if (!session?.user) throw new Error('Authorization error: Unauthorized User.');

  return session.user;
};

const addDiary = async (diary: Diary) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);
  const diary_id = String(id) + String(diary.diary_id);

  const { rowCount } = await useSQL(async (conn: PoolClient) => {
    return conn.query(
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
  });

  if (!rowCount) throw new Error('PostgreSql error: failed to add diary.');
};

const updateDiary = async (diary: Diary) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);
  const diary_id = String(id) + String(diary.diary_id);

  const { rowCount } = await useSQL(async (conn: PoolClient) => {
    return conn.query(
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
  });

  if (!rowCount) throw new Error('PostgreSql error: failed to update diary.');
};

const updateStatus = async (place: 'extracted' | 'manual', diary_id: number | string, todo_id: string, status: boolean) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);
  diary_id = String(id) + String(diary_id);

  const todoType = place === 'extracted' ? 'extracted_todos' : 'manual_todos';

  const { rowCount } = await useSQL(async (conn: PoolClient) => {
    const { rows } = await conn.query(`SELECT ${todoType} FROM diaries WHERE user_id = $1 AND diary_id = $2`, [user_id, diary_id]);

    const extracted_todos = rows[0][todoType];

    const idx = extracted_todos.findIndex(([id]: [string]) => id === todo_id);

    extracted_todos[idx][1].done = status;

    return conn.query(`UPDATE diaries SET ${todoType} = $1 WHERE user_id = $2 AND diary_id = $3`, [
      JSON.stringify(extracted_todos),
      user_id,
      diary_id,
    ]);
  });

  if (!rowCount) throw new Error('Error: Update status failed.');
};

const removeDiary = async (diary_id: number | string) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);
  diary_id = String(id) + String(diary_id);

  const { rowCount } = await useSQL(async (conn: PoolClient) => {
    return conn.query('DELETE FROM diaries WHERE user_id = $1 AND diary_id = $2', [user_id, diary_id]);
  });

  if (!rowCount) throw new Error('Error: Remove Failed.');
};

const readDiary = async (diary_id: string) => {
  const { id } = await getSessionUser();

  const user_id = Number(id);

  const { rows } = await useSQL(async (conn: PoolClient) => {
    return conn.query('SELECT * FROM diaries WHERE user_id = $1 AND diary_id = $2', [user_id, diary_id]);
  });

  return rows[0];
};

const readDiaries = async (isLazyLoading: boolean) => {
  const { id } = await getSessionUser();

  if (!isLazyLoading) pageNumber = 0;

  const user_id = Number(id);
  const limit = 10;
  const offset = pageNumber * limit;

  pageNumber++;

  const { rows } = await useSQL(async (conn: PoolClient) => {
    return conn.query('SELECT * FROM diaries WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [user_id, limit, offset]);
  });

  return rows;
};

export { addDiary, updateDiary, updateStatus, removeDiary, readDiary, readDiaries };
