'use server';

import useSQL from 'lib/api/connection-pool';
import { PoolClient } from 'pg';
import { auth } from 'lib/auth';

import { DiaryServer } from 'lib/type-def';

let pageNumber: number;

const addDiary = async (diary: DiaryServer) => {
  const session = await auth();
  if (!session?.user) throw new Error('Error : Unauthorized User.');

  diary.user_id = Number(session.user.id);
  diary.diary_id = String(session.user.id) + String(diary.diary_id);

  await useSQL(async (conn: PoolClient) => {
    return conn.query(
      `INSERT INTO diaries (user_id, diary_id, title, content_html, extracted_todos, manual_todos, created_at, updated_at, is_secret)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        diary.user_id,
        diary.diary_id,
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
};

const updateDiary = async (diary: DiaryServer) => {
  const session = await auth();
  if (!session?.user) throw new Error('Error : Unauthorized User.');

  const user_id = Number(session.user.id);

  await useSQL(async (conn: PoolClient) => {
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
        diary.diary_id,
      ],
    );
  });
};

const removeDiary = async (diary_id: number | string) => {
  const session = await auth();
  if (!session?.user) throw new Error('Error : Unauthorized User.');

  diary_id = String(session.user.id) + String(diary_id);

  const user_id = Number(session.user.id);

  const { rowCount } = await useSQL(async (conn: PoolClient) => {
    return conn.query('DELETE FROM diaries WHERE user_id = $1 AND diary_id = $2', [user_id, diary_id]);
  });

  if (!rowCount) throw new Error('Error : Unauthorized User.');
};

const readDiary = async (diary_id: string) => {
  const session = await auth();
  if (!session?.user) throw new Error('Error : Unauthorized User.');

  const user_id = Number(session.user.id);

  const { rows } = await useSQL(async (conn: PoolClient) => {
    return conn.query('SELECT * FROM diaries WHERE user_id = $1 AND diary_id = $2', [user_id, diary_id]);
  });

  console.log(rows[0]);

  return rows[0];
};

const readDiaries = async (isLazyLoading: boolean) => {
  const session = await auth();
  if (!session?.user) throw new Error('Error : Unauthorized User.');

  if (!isLazyLoading) pageNumber = 0;

  const user_id = Number(session.user.id);
  const limit = 10;
  const offset = pageNumber * limit;

  pageNumber++;

  const { rows } = await useSQL(async (conn: PoolClient) => {
    return conn.query('SELECT * FROM diaries WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [user_id, limit, offset]);
  });

  return rows;
};

export { addDiary, updateDiary, removeDiary, readDiary, readDiaries };
