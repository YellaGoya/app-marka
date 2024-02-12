/* eslint-disable @typescript-eslint/no-explicit-any */
import { openDB, IDBPDatabase } from 'idb';
import { getServerTime } from 'lib/action/time';
import { DiaryClient } from 'lib/type-def';

// 싱글턴 인스턴스를 저장할 변수를 정의합니다.
let dbInstance: IDBPDatabase | null = null;
let cursorKey: IDBValidKey | undefined;

const initDB = async (storeName: string): Promise<IDBPDatabase> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB('AppMarka', 11, {
    upgrade(db) {
      if (db.objectStoreNames.contains(storeName)) {
        // storeName Object Store가 이미 존재한다면 삭제 후 다시 생성합니다.
        db.deleteObjectStore(storeName);
      }

      const store = db.createObjectStore(storeName, { keyPath: 'diary_id' });
      store.createIndex('created_at_index', 'created_at', { unique: false });
    },
  });

  return dbInstance;
};

const useTransaction = async (transaction: any, mode: IDBTransactionMode) => {
  if (!dbInstance) dbInstance = await initDB('Diaries');

  const tx = dbInstance.transaction('Diaries', mode);
  const store = tx.objectStore('Diaries');
  const result = await transaction(store);
  await tx.done;

  return result;
};

// useCallback을 사용하여 함수 재생성 방지
const addDiary = async (diary: DiaryClient): Promise<void> => {
  useTransaction(async (store: any) => {
    await store.add(diary);
  }, 'readwrite');
};

const updateDiary = async (diary: DiaryClient): Promise<void> => {
  let time;
  try {
    time = await getServerTime();
  } catch (error) {
    console.error('Failed to fetch server time:', error);

    const date = new Date();
    time = date.toISOString();
  }

  diary.updated_at = time;

  useTransaction(async (store: any) => {
    await store.put(diary);
  }, 'readwrite');
};

const updateStatus = async (place: 'extracted' | 'manual', diaryId: string, todoId: string, status: boolean): Promise<void> => {
  const todoType = place === 'extracted' ? 'extracted_todos' : 'manual_todos';

  useTransaction(async (store: any) => {
    const diary: DiaryClient = await store.get(diaryId);

    const idx = diary[todoType].findIndex(([todo_id]) => todo_id === todoId);
    diary[todoType][idx][1].done = status;

    await store.put(diary);
  }, 'readwrite');
};

const removeDiary = async (diary_id: number): Promise<void> => {
  useTransaction(async (store: any) => {
    await store.delete(diary_id);
  }, 'readwrite');
};

const readDiary = async (id: number): Promise<DiaryClient | undefined> => {
  return useTransaction(async (store: any) => {
    return store.get(id);
  }, 'readwrite');
};

const readDiaries = async (isLazyLoading: boolean): Promise<DiaryClient[]> => {
  return useTransaction(async (store: any) => {
    const index = store.index('created_at_index');

    let cursor;
    if (isLazyLoading) {
      const keyRange = IDBKeyRange.upperBound(cursorKey);
      cursor = await index.openCursor(keyRange, 'prev');
    } else {
      cursor = await index.openCursor(null, 'prev');
    }

    const list: DiaryClient[] = [];

    let count = 0;
    while (cursor && count < 10) {
      list.push(cursor.value);

      cursor = await cursor.continue();
      cursorKey = cursor?.key;

      count++;
    }

    return list;
  }, 'readonly');
};

export { addDiary, updateDiary, updateStatus, removeDiary, readDiary, readDiaries };
