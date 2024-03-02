/* eslint-disable @typescript-eslint/no-explicit-any */
import { openDB, IDBPDatabase } from 'idb';
import { Diary, History } from 'lib/type-def';

// 싱글턴 인스턴스를 저장할 변수를 정의합니다.
let dbInstance: IDBPDatabase | null = null;
let cursorKey: IDBValidKey | undefined;

const initDB = async (): Promise<IDBPDatabase> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB('AppMarka', 21, {
    upgrade(db) {
      if (db.objectStoreNames.contains('diaries')) {
        db.deleteObjectStore('diaries');
      }

      if (db.objectStoreNames.contains('history')) {
        db.deleteObjectStore('history');
      }

      const diariesStore = db.createObjectStore('diaries', { keyPath: 'diary_id' });
      diariesStore.createIndex('created_at_index', 'created_at', { unique: false });

      const historyStore = db.createObjectStore('history', { keyPath: 'diary_id' });
      historyStore.createIndex('time_index', 'time', { unique: false });
    },
  });

  return dbInstance;
};

const useTransaction = async (transaction: (tx: any) => Promise<any>, mode: IDBTransactionMode) => {
  if (!dbInstance) dbInstance = await initDB();

  const tx = dbInstance.transaction(['diaries', 'history'], mode);
  let result;
  try {
    result = await transaction(tx);
    await tx.done;
  } catch (error) {
    tx.abort();

    throw error;
  }

  return result;
};

// useCallback을 사용하여 함수 재생성 방지
const addDiary = async (diary: Diary, time: number) => {
  useTransaction(async (tx: any) => {
    await tx.objectStore('diaries').add(diary);
    await tx.objectStore('history').add({
      diary_id: diary.diary_id,
      time,
      action: 'add',
    });
  }, 'readwrite');
};

const updateDiary = async (diary: Diary, time: number) => {
  useTransaction(async (tx: any) => {
    await tx.objectStore('diaries').put(diary);
    await tx.objectStore('history').put({
      diary_id: diary.diary_id,
      time,
      action: 'update',
    });
  }, 'readwrite');
};

// eslint-disable-next-line max-params
const updateStatus = async (place: 'extracted' | 'manual', diary_id: number, todo_id: string, status: boolean, time: number) => {
  const todoType = place === 'extracted' ? 'extracted_todos' : 'manual_todos';

  useTransaction(async (tx: any) => {
    const diary: Diary = await tx.objectStore('diaries').get(diary_id);

    const idx = diary[todoType].findIndex(([id]) => id === todo_id);
    diary[todoType][idx][1].done = status;

    await tx.objectStore('diaries').put(diary);

    await tx.objectStore('history').put({
      diary_id: diary.diary_id,
      time,
      action: 'update',
    });
  }, 'readwrite');
};

const removeDiary = async (diary_id: number, time: number) => {
  useTransaction(async (tx: any) => {
    await tx.objectStore('diaries').delete(diary_id);
    await tx.objectStore('history').put({
      diary_id,
      time,
      action: 'remove',
    });
  }, 'readwrite');
};

const readDiary = async (diary_id: number): Promise<Diary | undefined> => {
  return useTransaction(async (tx: any) => {
    return tx.objectStore('diaries').get(diary_id);
  }, 'readwrite');
};

const readDiaries = async (isLazy: boolean): Promise<Diary[]> => {
  return useTransaction(async (tx: any) => {
    const index = tx.objectStore('diaries').index('created_at_index');

    let cursor;
    if (isLazy) {
      const keyRange = IDBKeyRange.upperBound(cursorKey);
      cursor = await index.openCursor(keyRange, 'prev');
    } else {
      cursor = await index.openCursor(null, 'prev');
    }

    const list: Diary[] = [];

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

const changeHistory = async (histories: History[]): Promise<void> => {
  useTransaction(async (tx: any) => {
    for (const history of histories) {
      await tx.objectStore('history').put(history);
    }
  }, 'readwrite');
};

const getHistories = async (): Promise<History[]> => {
  return useTransaction(async (tx: any) => {
    return tx.objectStore('history').getAll();
  }, 'readonly');
};

export { addDiary, updateDiary, updateStatus, removeDiary, readDiary, readDiaries, changeHistory, getHistories };
