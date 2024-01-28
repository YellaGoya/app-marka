import { useEffect, useState, useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';

import { getServerTime } from 'app/_lib/action/time';

import { Diary } from 'app/_lib/type-def';

interface DiaryEntry {
  id?: number;
  // 여기에 다른 diary 엔트리 속성을 추가하세요.
  // 예: content: string;
}

const indexedDb = (storeName: string) => {
  const [db, setDb] = useState<IDBPDatabase | null>(null);

  useEffect(() => {
    async function initDB() {
      const db = await openDB('AppMarka', 8, {
        upgrade(db) {
          db.deleteObjectStore(storeName);

          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'diary_id' });
          }
        },
      });

      setDb(db);
    }

    initDB();

    return () => {
      db?.close();
    };
  }, [storeName]);

  // useCallback을 사용하여 함수 재생성 방지
  const addDiary = useCallback(
    async (diary: Diary): Promise<void> => {
      if (!db) return;

      let time;
      let timestamp;
      try {
        time = await getServerTime();
        timestamp = new Date(time).getTime();
      } catch (error) {
        console.error('Failed to fetch server time:', error);

        const date = new Date();

        time = date.toISOString();
        timestamp = date.getTime();
      }

      diary.diary_id = timestamp;
      diary.created_at = time;
      diary.updated_at = time;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.add(diary);
      await tx.done;
    },
    [db, storeName],
  );

  const updateDiary = useCallback(
    async (diary: DiaryEntry): Promise<void> => {
      if (!db) return;

      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.put(diary);
      await tx.done;
    },
    [db, storeName],
  );

  const removeDiary = useCallback(
    async (id: number): Promise<void> => {
      if (!db) return;

      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.delete(id);
      await tx.done;
    },
    [db, storeName],
  );

  const readDiary = useCallback(
    async (id: number): Promise<DiaryEntry | undefined> => {
      if (!db) return;

      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const diary: DiaryEntry = await store.get(id);
      await tx.done;
      return diary;
    },
    [db, storeName],
  );

  const readAll = useCallback(async (): Promise<DiaryEntry[] | undefined> => {
    if (!db) return;

    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const list: DiaryEntry[] = await store.getAll();
    await tx.done;
    return list;
  }, [db, storeName]);

  return { addDiary, updateDiary, removeDiary, readDiary, readAll };
};

export default indexedDb;
