'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

import { followingCountState } from 'lib/recoil';
import { readFollowingDiaries } from 'lib/api/diary';

import JoinFullOutlinedIcon from '@mui/icons-material/JoinFullOutlined';
import * as global from 'app/global.module.css';
import * as css from './others-diaries.module.css';

const dayArray = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

const OthersDiaries = () => {
  const { status } = useSession();
  const [isLoaded, setIsLoaded] = useState(false);

  const followingCount = useRecoilValue(followingCountState);

  const [diaries, setDiaries] = useState([]);
  const [diariesPageNumber, setDiariesPageNumber] = useState(0);

  const observer = useRef();

  const lastDiaryRef = useCallback(
    (node) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          getDiaries();
        }
      });
      if (node) observer.current.observe(node);
    },
    [status, diariesPageNumber],
  );

  useEffect(() => {
    if (status === 'authenticated' && followingCount) getDiaries();
  }, [status, followingCount]);

  const getDiaries = async () => {
    try {
      const res = await readFollowingDiaries(diariesPageNumber);

      console.log(res);
      setDiaries((prevDiaries) => (diariesPageNumber ? [...prevDiaries, ...res.diaries] : res.diaries));

      if (!diariesPageNumber) setIsLoaded(true);

      setDiariesPageNumber(res.newPageNumber);
    } catch {}
  };

  const getKoreanDay = (idx) => {
    return dayArray[idx];
  };

  return (
    <section className={clsx(css.cardContainer, { [global.loaded]: isLoaded })}>
      {diaries.length !== 0 &&
        diaries.map((diary, idx) => {
          const createAt = new Date(diary.created_at);
          // createAt 의 요일을 한글로
          const day = createAt.getDay();
          const createAtDay = getKoreanDay(day);

          return (
            <div key={diary.diary_id} ref={diaries.length - 1 === idx ? lastDiaryRef : null} className={css.diaryCard}>
              <h3>{diary.title}</h3>
              <span style={{ backgroundColor: (day === 0 || day === 6) && '#ffd8d8' }}>{createAtDay}</span>

              <h4>{diary.tag}</h4>
              <p>({diary.email})</p>
              <TodoList extracted={diary.extracted_todos} manual={diary.manual_todos} />
            </div>
          );
        })}
    </section>
  );
};

const TodoList = ({ extracted, manual }) => {
  return (
    (extracted.length !== 0 || manual.length !== 0) && (
      <div className={css.todoList}>
        <div className={global.divLine} />
        <ul>
          {extracted.length !== 0 &&
            extracted.map((todo) => {
              const value = todo[1];
              return (
                <li key={todo[0]}>
                  <JoinFullOutlinedIcon style={{ fill: value.done ? '#ffbe00' : null }} />
                  <span>{value.text}</span>
                </li>
              );
            })}
          {manual.length !== 0 &&
            manual.map((todo) => {
              const value = todo[1];
              return (
                <li key={todo[0]}>
                  <JoinFullOutlinedIcon style={{ fill: value.done ? '#ffbe00' : null }} />
                  <span>{value.text}</span>
                </li>
              );
            })}
        </ul>
      </div>
    )
  );
};

export default OthersDiaries;
