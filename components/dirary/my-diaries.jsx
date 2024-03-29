'use client';

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

import { getServerTime } from 'lib/api/time';
import * as clientDB from 'lib/indexed-db';
import * as serverDB from 'lib/api/diary';
import { diariesState, onEditDiaryIdState, errorState } from 'lib/recoil';

import WriteForm from 'components/dirary/write-form';
import TodoList from 'components/dirary/todo-list';
import Button from 'components/common/button';

import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

import css from 'components/dirary/my-diaries.module.css';
import global from 'app/global.module.css';

const MyDiaries = () => {
  const { status } = useSession();

  const [diaries, setDiaries] = useRecoilState(diariesState);
  const [onEditDiaryID, setOnEditDiaryID] = useRecoilState(onEditDiaryIdState);

  const [isLoaded, setIsLoaded] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);

  const setError = useSetRecoilState(errorState);

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
    [status, pageNumber],
  );

  const getMyDiaries = async ({ isLazy }) => {
    if (status === 'loading') return;
    let newDiaries;

    try {
      if (status === 'authenticated') {
        // 글작성시에 새로고침 된 페이지는 pageNumber가 0이므로 1로 설정
        const res = await serverDB.readDiaries(isLazy ? pageNumber || 1 : 0);
        newDiaries = res.diaries;

        setPageNumber(res.newPageNumber);
      } else {
        newDiaries = await clientDB.readDiaries(isLazy);
      }

      if (!newDiaries) return;

      setDiaries((prevDiaries) => (isLazy ? [...prevDiaries, ...newDiaries] : newDiaries));

      if (!isLazy) setIsLoaded(true);
    } catch {
      setError(<h4>다이어리 목록을 불러오는 중 문제가 발생했습니다.</h4>);
    }
  };

  const removeDiary = useCallback(
    async (diaryId, idx) => {
      let time;
      let timestamp;

      try {
        time = await getServerTime();
        timestamp = new Date(time).getTime();
      } catch {
        const date = new Date();

        time = date.toISOString();
        timestamp = date.getTime();
      }

      try {
        if (status === 'authenticated') {
          diaryId = Number(diaryId.slice(-13));

          await serverDB.removeDiary(diaryId, timestamp);
        }

        await clientDB.removeDiary(diaryId, timestamp);

        setDiaries((prevDiaries) => prevDiaries.filter((_, index) => index !== idx));
      } catch (error) {
        setError(<h4>다이어리 제거 중 문제가 발생했습니다.</h4>);
      }
    },
    [status],
  );

  return diaries && diaries.length > 0 ? (
    <section className={clsx(css.diariesContainer, { [global.loaded]: isLoaded })}>
      {diaries.map((diary, idx) => {
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
    </section>
  ) : (
    <article className={clsx(global.emptyDiaryContainer, { [global.loaded]: isLoaded })}>
      <h2>새로운 다이어리를 추가해 보세요.</h2>
      <p>Marka를 사용해 볼 좋은 기회입니다.</p>
    </article>
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
