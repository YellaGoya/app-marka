'use client';

import indexedDb from 'app/_lib/indexed-db';
import { useEffect, useRef, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import clsx from 'clsx';

import TodoList from 'app/_components/dirary/todo-list';
import { diariesState } from 'app/_lib/recoil';

import css from 'app/_components/dirary/my-diaries.module.css';
import global from 'app/globals.module.css';

const MyDiaries = () => {
  const { readDiaries } = indexedDb('Diaries');
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
        setDiaries((prevDiareis) => {
          return [...prevDiareis, ...newDiaries];
        });
      else setDiaries(newDiaries);
    } catch {
      return new Error('Error: getMyDiaries.');
    }
  });

  return (
    <>
      {diaries &&
        diaries.map((diary) => {
          return (
            <div ref={diaries.indexOf(diary) === diaries.length - 1 ? lastDiaryRef : undefined} key={diary.diary_id}>
              <article className={css.diariesContainer}>
                <h3>{diary.title}</h3>
                <div dangerouslySetInnerHTML={{ __html: diary.content_html }} className={css.diaryCotentContainer} />
                <div>
                  <TodoList todoList={{ extracted: diary.extracted_todos, manual: diary.manual_todos }} diaryId={diary.diary_id} />
                </div>
              </article>
              {diaries.indexOf(diary) === diaries.length - 1 ? null : <div className={clsx(global.divLine)} />}
            </div>
          );
        })}
    </>
  );
};

export default MyDiaries;
