'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { useSession } from 'next-auth/react';

import * as clientDB from 'lib/indexed-db';
import * as serverDB from 'lib/api/diary';
import { diariesState, onEditDiaryIdState } from 'lib/recoil';

import WriteForm from 'components/dirary/write-form';
import TodoList from 'components/dirary/todo-list';
import Button from 'components/common/button';

import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

import css from 'components/dirary/my-diaries.module.css';

const MyDiaries = () => {
  const { status } = useSession();

  const [diaries, setDiaries] = useRecoilState(diariesState);

  useEffect(() => {
    if (status !== 'loading') getMyDiaries(false);
  }, [status]);

  const observer = useRef();

  const lastDiaryRef = useCallback(
    (node) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          getMyDiaries();
        }
      });
      if (node) observer.current.observe(node);
    },
    [status],
  );

  const getMyDiaries = async (isLazyLoading = true) => {
    if (status === 'loading') return;

    try {
      const readDiaries = status === 'authenticated' ? serverDB.readDiaries : clientDB.readDiaries;
      const newDiaries = await readDiaries(isLazyLoading);

      setDiaries((prevDiaries) => (isLazyLoading ? [...prevDiaries, ...newDiaries] : newDiaries));
    } catch (error) {
      throw new Error(`Error getting diaries: ${error}`);
    }
  };

  const removeDiaryHandler = async (diaryId, idx) => {
    try {
      if (status === 'authenticated') diaryId = parseDiaryId(diaryId);

      await clientDB.removeDiary(diaryId, status === 'authenticated');
      setDiaries((prevDiaries) => prevDiaries.filter((_, index) => index !== idx));
    } catch (error) {
      console.error(`Failed to remove diary: ${error}`);
    }
  };

  const parseDiaryId = (diaryId) => {
    return Number(diaryId.slice(-13));
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
