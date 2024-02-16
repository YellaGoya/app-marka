'use client';

import { useEffect, useRef, useCallback, useState, memo } from 'react';
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
  const [onEditDiaryID, setOnEditDiaryID] = useRecoilState(onEditDiaryIdState);

  useEffect(() => {
    if (status !== 'loading') getMyDiaries({ isLazy: false });
  }, [status]);

  const observer = useRef();

  const lastDiaryRef = useCallback(
    (node) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          getMyDiaries({ isLazy: true });
        }
      });
      if (node) observer.current.observe(node);
    },
    [status],
  );

  const getMyDiaries = async ({ isLazy }) => {
    if (status === 'loading') return;

    try {
      const newDiaries = status === 'authenticated' ? await serverDB.readDiaries(isLazy) : await clientDB.readDiaries(isLazy);

      setDiaries((prevDiaries) => (isLazy ? [...prevDiaries, ...newDiaries] : newDiaries));
    } catch {}
  };

  const removeDiary = useCallback(
    async (diaryId, idx) => {
      if (status === 'authenticated') diaryId = Number(diaryId.slice(-13));

      try {
        if (status === 'authenticated') await serverDB.removeDiary(diaryId);
        await clientDB.removeDiary(diaryId);

        setDiaries((prevDiaries) => prevDiaries.filter((_, index) => index !== idx));
      } catch (error) {
        console.error(`Failed to remove diary: ${error}`);
      }
    },
    [status],
  );

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
              removeDiary={removeDiary}
              setOnEditDiaryID={setOnEditDiaryID}
              onEditDiaryID={onEditDiaryID}
            />
          );
        })}
    </div>
  );
};

const onEditing = (prevProps, nextProps) => {
  return prevProps.onEditDiaryID !== nextProps.diary.diary_id && nextProps.onEditDiaryID !== nextProps.diary.diary_id;
};

const Diary = memo(({ diary, idx, lastDiaryRef, removeDiary, onEditDiaryID, setOnEditDiaryID }) => {
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
          <div ref={lastDiaryRef}>
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
}, onEditing);

export default MyDiaries;
