/* eslint-disable @typescript-eslint/no-explicit-any */
import { openDB, IDBPDatabase } from 'idb';
import { getServerTime } from 'lib/action/time';
import { Diary } from 'lib/type-def';

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

const useTransaction = async (transaction: (tx: any) => Promise<any>, mode: IDBTransactionMode) => {
  if (!dbInstance) dbInstance = await initDB('Diaries');

  const tx = dbInstance.transaction('Diaries', mode);
  const result = await transaction(tx);
  await tx.done;

  return result;
};

// useCallback을 사용하여 함수 재생성 방지
const addDiary = async (diary: Diary): Promise<void> => {
  return useTransaction(async (tx: any) => {
    await tx.store.add(diary);
  }, 'readwrite');
};

const updateDiary = async (diary: Diary): Promise<void> => {
  let time;
  try {
    time = await getServerTime();
  } catch {
    const date = new Date();

    time = date.toISOString();
  }

  diary.updated_at = time;

  useTransaction(async (tx: any) => {
    await tx.store.put(diary);
  }, 'readwrite');
};

const updateStatus = async (place: 'extracted' | 'manual', diary_id: number, todo_id: string, status: boolean): Promise<void> => {
  const todoType = place === 'extracted' ? 'extracted_todos' : 'manual_todos';

  useTransaction(async (tx: any) => {
    const diary: Diary = await tx.store.get(diary_id);

    const idx = diary[todoType].findIndex(([id]) => id === todo_id);
    diary[todoType][idx][1].done = status;

    await tx.store.put(diary);
  }, 'readwrite');
};

const removeDiary = async (diary_id: number): Promise<void> => {
  return useTransaction(async (tx: any) => {
    await tx.store.delete(diary_id);
  }, 'readwrite');
};

const readDiary = async (diary_id: number): Promise<Diary | undefined> => {
  return useTransaction(async (tx: any) => {
    return tx.store.get(diary_id);
  }, 'readwrite');
};

const readDiaries = async (isLazy: boolean): Promise<Diary[]> => {
  return useTransaction(async (tx: any) => {
    const index = tx.store.index('created_at_index');

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

export { addDiary, updateDiary, updateStatus, removeDiary, readDiary, readDiaries };
