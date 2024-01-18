'use client';

import { useRef, useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { todoListState } from 'app/_lib/recoil';
import SlateEditor from 'app/_components/dirary/slate-editor';

import css from 'app/_components/dirary/write-form.module.css';

const WriteForm = () => {
  const editorRef = useRef();
  const [todoList, setTodoList] = useRecoilState(todoListState);

  // useEffect(() => {
  //   console.log(todoList);
  // }, [todoList]);

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
    event.target.focus();
    event.target.setSelectionRange(event.target.value.length, event.target.value.length);

    event.target.scrollLeft = event.target.scrollWidth;
  };

  /** 제목 input 영역의 enter 키 submit 이벤트 차단 */
  const enterKeyHandler = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  return (
    <div className={css.newWriteContainer}>
      <form className={css.form}>
        <input
          className={css.title}
          type="text"
          maxLength="50"
          placeholder="제목 입력"
          onClick={(event) => {
            inputClickHandler(event);
          }}
          onKeyPress={(event) => {
            enterKeyHandler(event);
          }}
        />
        <div className={css.DivLine} />
        <SlateEditor ref={editorRef} />
        <div className={css.DivLine} />

        <div>
          {Array.from(todoList).map((todo) => {
            return (
              <div
                key={todo[0]}
                onClick={() => {
                  handleClick(todo[0]);
                }}
              >
                {todo[1]}
              </div>
            );
          })}
        </div>
      </form>
    </div>
  );
};

export default WriteForm;
