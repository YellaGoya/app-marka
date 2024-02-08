'use client';

import indexedDb from 'app/_lib/indexed-db';
import { useEffect, useRef, useCallback } from 'react';
import { useRecoilState } from 'recoil';

import WriteForm from 'app/_components/dirary/write-form';
import TodoList from 'app/_components/dirary/todo-list';
import { diariesState, onEditDiaryIdState } from 'app/_lib/recoil';
import Button from 'app/_components/common/button';

import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

import css from 'app/_components/dirary/my-diaries.module.css';

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
    <div className={css.diariesContainer}>
      {diaries &&
        diaries.map((diary, idx) => {
          return (
            <Diary
              key={diary.diary_id}
              lastDiaryRef={diaries.length - 1 === idx ? lastDiaryRef : null}
              diary={diary}
              idx={idx}
              removeDiary={removeDiaryHandler}
            />
          );
        })}
    </div>
  );
};

const Diary = ({ diary, idx, lastDiaryRef, removeDiary }) => {
  const [onEditDiaryID, setOnEditDiaryID] = useRecoilState(onEditDiaryIdState);

  const diaryRef = useRef(null);

  useEffect(() => {
    diaryRef.current.style.minHeight = `${diaryRef.current.getBoundingClientRect().height}px`;
  }, [diaryRef]);

  return (
    <>
      <article ref={diaryRef} className={css.diaryContainer}>
        {onEditDiaryID === diary.diary_id ? (
          <WriteForm diaryId={diary.diary_id} idx={idx} />
        ) : (
          <div ref={lastDiaryRef ? lastDiaryRef : null}>
            <span className={css.diaryTitle}>
              {diary.title}
              <div className={css.diaryButtonContainer}>
                <Button
                  onClick={() => {
                    setOnEditDiaryID(diary.diary_id);
                  }}
                >
                  <EditRoundedIcon />
                </Button>
                <Button
                  onClick={() => {
                    removeDiary(diary.diary_id, idx);
                  }}
                >
                  <DeleteRoundedIcon />
                </Button>
              </div>
              <div style={{ width: '1px', height: '1px' }} />
            </span>
            <div dangerouslySetInnerHTML={{ __html: diary.content_html }} className={css.diaryCotentContainer} />
            <div>
              <TodoList todoList={{ extracted: diary.extracted_todos, manual: diary.manual_todos }} diaryId={diary.diary_id} />
            </div>
          </div>
        )}
      </article>
    </>
  );
};

export default MyDiaries;
