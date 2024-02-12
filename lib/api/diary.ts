'use server';

import useSQL from 'lib/api/connection-pool';
import { PoolClient } from 'pg';
import { auth } from 'lib/auth';

import { DiaryServer } from 'lib/type-def';

let pageNumber: number;

const addDiary = async (diary: DiaryServer) => {
  console.log('diary added! ------------------------------------------------------------------------------');
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

const readDiaries = async (isLazyLoading: boolean) => {
  const session = await auth();
  if (!session?.user) throw new Error('Error : Unauthorized User.');

  if (!isLazyLoading) pageNumber = 0;

  const userId = Number(session.user.id);
  const limit = 10;
  const offset = pageNumber * limit;

  pageNumber++;

  return useSQL<DiaryServer[]>(async (conn: PoolClient) => {
    return conn.query('SELECT * FROM diaries WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset]);
  });
};

export { addDiary, readDiaries };
