import { openDB, IDBPDatabase } from 'idb';
import { getServerTime } from 'app/_lib/action/time';
import { Diary } from 'app/_lib/type-def';

// 싱글턴 인스턴스를 저장할 변수를 정의합니다.
let dbInstance: IDBPDatabase | null = null;

async function initDB(storeName: string): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB('AppMarka', 9, {
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
}

const indexedDb = (storeName: string) => {
  // 인스턴스 제공자 함수로 수정합니다.
  const getDb = async () => {
    if (!dbInstance) dbInstance = await initDB(storeName);
    return dbInstance;
  };

  // useCallback을 사용하여 함수 재생성 방지
  const addDiary = async (diary: Diary): Promise<void> => {
    const db = await getDb();

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
  };

  const updateDiary = async (diary: Diary): Promise<void> => {
    const db = await getDb();

    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.put(diary);
    await tx.done;
  };

  type TodoType = 'extracted_todos' | 'manual_todos';

  const updateStatus = async (place: 'extracted' | 'manual', diaryId: string, todoId: string, status: boolean): Promise<void> => {
    let todoType: TodoType;
    if (place === 'extracted') todoType = 'extracted_todos';
    else todoType = 'manual_todos';

    const db = await getDb();

    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const diary: Diary = await store.get(diaryId);

    const idx = diary[todoType].findIndex(([todo_id]) => todo_id === todoId);
    console.log(place);
    diary[todoType][idx][1].done = status;

    await store.put(diary);
    await tx.done;
  };

  const removeDiary = async (id: number): Promise<void> => {
    const db = await getDb();

    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.delete(id);
    await tx.done;
  };

  const readDiary = async (id: number): Promise<Diary | undefined> => {
    const db = await getDb();

    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const diary: Diary = await store.get(id);
    await tx.done;
    return diary;
  };

  const readAll = async (): Promise<Diary[] | undefined> => {
    const db = await getDb();

    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const list: Diary[] = await store.getAll();
    await tx.done;
    return list;
  };

  return { addDiary, updateDiary, updateStatus, removeDiary, readDiary, readAll };
};

export default indexedDb;
