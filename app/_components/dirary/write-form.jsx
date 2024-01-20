'use client';

import { useRef, useState, useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { todoListState } from 'app/_lib/recoil';
import SlateEditor from 'app/_components/dirary/slate-editor';

import BeenhereOutlinedIcon from '@mui/icons-material/BeenhereOutlined';
import DoDisturbOnRoundedIcon from '@mui/icons-material/DoDisturbOnRounded';
import css from 'app/_components/dirary/write-form.module.css';

const WriteForm = () => {
  const editorRef = useRef();
  const [todoList, setTodoList] = useRecoilState(todoListState);
  const [timeNow, setTimeNow] = useState(null);

  useEffect(() => {
    setTimeNow(new Date());
  }, []);

  /** TodoList 에서 클릭시 삭제 */
  const handleClick = (path) => {
    const newTodoList = new Map(todoList);
    newTodoList.delete(path);
    setTodoList(newTodoList);

    const x = parseInt(path % 100000, 10);
    const y = parseInt((path - x) / 100000, 10);

    editorRef.current.unCodeBlock([y, x]);
  };

  /** 제목 input 영역 클릭시 가장 끝으로 focus 이동 */
  const inputClickHandler = (event) => {
    setTimeout(() => {
      event.target.setSelectionRange(event.target.value.length, event.target.value.length);
    }, 0);

    event.target.scrollLeft = event.target.scrollWidth;
  };

  /** 제목 input 영역의 enter 키 submit 이벤트 차단 */
  const enterKeyHandler = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      if (event.target.value === '' && timeNow) {
        event.target.value = timeNow.toLocaleString('ko-KR');
      }
    }
  };

  return (
    <div className={css.newWriteContainer}>
      <form className={css.form}>
        <input
          className={css.title}
          type="text"
          maxLength="50"
          placeholder={timeNow ? timeNow.toLocaleString('ko-KR') : null}
          onFocus={(event) => {
            inputClickHandler(event);
          }}
          onKeyPress={(event) => {
            enterKeyHandler(event);
          }}
        />
        <div className={css.divLine} />
        <SlateEditor ref={editorRef} />
        <div className={css.divLine} />

        <ul className={css.todoList}>
          {Array.from(todoList).map((todo) => {
            return (
              <li key={todo[0]} className={css.todoItem}>
                <BeenhereOutlinedIcon />
                {todo[1]}
                <button
                  className={css.todoDelete}
                  type="button"
                  onClick={() => {
                    handleClick(todo[0]);
                  }}
                >
                  <DoDisturbOnRoundedIcon />
                </button>
              </li>
            );
          })}
        </ul>
      </form>
    </div>
  );
};

export default WriteForm;
