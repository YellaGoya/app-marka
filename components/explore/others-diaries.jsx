'use client';

import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { followingCountState } from 'lib/recoil';
import { readFollowingDiaries } from 'lib/api/diary';

import JoinFullOutlinedIcon from '@mui/icons-material/JoinFullOutlined';
import * as global from 'app/global.module.css';
import * as css from './others-diaries.module.css';

const dayArray = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

const OthersDiaries = () => {
  const followingCount = useRecoilValue(followingCountState);

  const [diaries, setDiaries] = useState([]);

  useEffect(() => {
    if (followingCount) getDiaries();
  }, [followingCount]);

  const getDiaries = async () => {
    const res = await readFollowingDiaries();
    setDiaries(res);

    console.log(res);
  };

  const getKoreanDay = (idx) => {
    return dayArray[idx];
  };

  return (
    <section className={css.cardContainer}>
      {diaries.length !== 0 &&
        diaries.map((diary) => {
          const createAt = new Date(diary.created_at);
          // createAt 의 요일을 한글로
          const day = createAt.getDay();
          const createAtDay = getKoreanDay(day);

          const todoList = {
            extracted: diary.extracted_todos,
            manual: diary.manual_todos,
          };
          return (
            <div key={diary.diary_id} className={css.diaryCard}>
              <h3>{diary.title}</h3>
              <p>{createAtDay}</p>
              <h4>{diary.tag}</h4>
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
