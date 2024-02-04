'use client';

import indexedDb from 'app/_lib/indexed-db';
import { useEffect, useRef, useCallback } from 'react';
import { useRecoilState } from 'recoil';

import TodoList from 'app/_components/dirary/todo-list';
import { diariesState } from 'app/_lib/recoil';

import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

import css from 'app/_components/dirary/my-diaries.module.css';
import global from 'app/globals.module.css';

const MyDiaries = () => {
  const { readDiaries, removeDiary } = indexedDb('Diaries');
  const [diaries, setDiaries] = useRecoilState(diariesState);

  useEffect(() => {
    getMyDiaries(false);
  }, []);

  const observer = useRef();

  const lastDiaryRef = useCallback((node) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        getMyDiaries();
      }
    });
    if (node) observer.current.observe(node);
  }, []);

  const getMyDiaries = useCallback(async (isLazyLoading = true) => {
    try {
      const newDiaries = await readDiaries(isLazyLoading);

      if (isLazyLoading)
        setDiaries((prevDiaries) => {
          return [...prevDiaries, ...newDiaries];
        });
      else setDiaries(newDiaries);
    } catch {
      return new Error('Error: getMyDiaries.');
    }
  });

  const removeDiaryHandler = (diaryId, idx) => {
    removeDiary(diaryId).then(() => {
      setDiaries((prevDiaries) => {
        const removedDiaries = [...prevDiaries];
        removedDiaries.splice(idx, 1);

        return removedDiaries;
      });
    });
  };

  return (
    <>
      {diaries &&
        diaries.map((diary, idx) => {
          return (
            <div
              ref={diaries.indexOf(diary) === diaries.length - 1 ? lastDiaryRef : undefined}
              key={diary.diary_id}
              style={diaries.indexOf(diary) === diaries.length - 1 ? { paddingBottom: '150px' } : null}
            >
              <article className={css.diariesContainer}>
                <span className={css.diariesTitle}>
                  {diary.title}
                  <div className={css.diariesButtonContainer}>
                    <button type="button" className={global.button}>
                      <EditRoundedIcon />
                    </button>
                    <button
                      type="button"
                      className={global.button}
                      onClick={() => {
                        removeDiaryHandler(diary.diary_id, idx);
                      }}
                    >
                      <DeleteRoundedIcon />
                    </button>
                  </div>
                  <div style={{ width: '1px', height: '1px' }} />
                </span>
                <div dangerouslySetInnerHTML={{ __html: diary.content_html }} className={css.diaryCotentContainer} />
                <div>
                  <TodoList todoList={{ extracted: diary.extracted_todos, manual: diary.manual_todos }} diaryId={diary.diary_id} />
                </div>
              </article>
              {diaries.indexOf(diary) === diaries.length - 1 ? null : <div className={global.divLine} style={{ width: 'calc(100% - 60px)' }} />}
            </div>
          );
        })}
    </>
  );
};

export default MyDiaries;
