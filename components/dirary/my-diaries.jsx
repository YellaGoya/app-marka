'use client';

import { useEffect, useState, useRef, useCallback, memo, use } from 'react';
import { useRecoilState } from 'recoil';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

import * as clientDB from 'lib/indexed-db';
import * as serverDB from 'lib/api/diary';
import { diariesState, onEditDiaryIdState } from 'lib/recoil';

import WriteForm from 'components/dirary/write-form';
import TodoList from 'components/dirary/todo-list';
import Button from 'components/common/button';

import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

import css from 'components/dirary/my-diaries.module.css';
import global from 'app/globals.module.css';

const MyDiaries = () => {
  const { status } = useSession();

  const [diaries, setDiaries] = useRecoilState(diariesState);
  const [onEditDiaryID, setOnEditDiaryID] = useRecoilState(onEditDiaryIdState);

  const [isLoaded, setIsLoaded] = useState(false);

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
      setIsLoaded(true);
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
    <div className={clsx(css.diariesContainer, { [global.loaded]: isLoaded })}>
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
  const readRef = useRef(null);
  const [minHeight, setMinHeight] = useState(0);
  const [todoList, setTodoList] = useState({
    extracted: new Map(diary.extracted_todos),
    manual: new Map(diary.manual_todos),
  });

  useEffect(() => {
    setTodoList({
      extracted: new Map(diary.extracted_todos),
      manual: new Map(diary.manual_todos),
    });
  }, [diary]);

  useEffect(() => {
    setMinHeight(diaryRef.current.clientHeight);
    setContainerMinHeight(`${diaryRef.current.clientHeight}px`);
    if (readRef && readRef.current) readRef.current.style.position = 'absolute';
  }, [diaryRef]);

  useEffect(() => {
    if (onEditDiaryID !== diary.diary_id && minHeight) {
      setContainerMinHeight(`${minHeight}px`);
    }
  }, [onEditDiaryID]);

  const setContainerMinHeight = (value) => {
    diaryRef.current.style.minHeight = value;
  };

  return (
    <article ref={diaryRef} className={css.diaryContainer}>
      <div ref={readRef} className={clsx(css.diaryRead, { [css.diaryHidden]: onEditDiaryID === diary.diary_id })}>
        <span ref={lastDiaryRef} className={css.diaryTitle}>
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
        <TodoList todoList={todoList} setTodoList={setTodoList} diaryId={diary.diary_id} />
      </div>
      {onEditDiaryID === diary.diary_id && <WriteForm diaryId={diary.diary_id} idx={idx} setContainerMinHeight={setContainerMinHeight} />}
    </article>
  );
}, onEditing);

export default MyDiaries;
