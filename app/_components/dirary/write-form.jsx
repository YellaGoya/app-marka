'use client';

import { useRef, useState, useEffect } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import clsx from 'clsx';

import { todoListState } from 'app/_lib/recoil';
import SlateEditor from 'app/_components/dirary/slate-editor';

import JoinFullOutlinedIcon from '@mui/icons-material/JoinFullOutlined';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import LowPriorityRoundedIcon from '@mui/icons-material/LowPriorityRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import css from 'app/_components/dirary/write-form.module.css';

const WriteForm = () => {
  const editorRef = useRef();
  const todoList = useRecoilValue(todoListState);
  const [timeNow, setTimeNow] = useState(null);

  useEffect(() => {
    setTimeNow(new Date());
  }, []);

  useEffect(() => {}, []);

  const extractHandler = () => {
    editorRef.current.extractTodoList();
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
        <section className={css.bottom}>
          <ul className={css.todoList}>
            {Array.from(todoList.diary).map((todo) => {
              return <TodoList key={todo[0]} todo={todo} place="diary" />;
            })}
          </ul>
          <fieldset className={css.buttonContainer}>
            <button
              type="button"
              className={css.button}
              onClick={() => {
                extractHandler();
              }}
            >
              <LowPriorityRoundedIcon style={{ width: '1.7rem', height: '1.7rem', marginRight: '10px' }} />
            </button>
            <button type="button" className={css.button}>
              <SaveRoundedIcon />
            </button>
          </fieldset>
        </section>
      </form>
    </div>
  );
};

const TodoList = ({ todo, place = 'diary' }) => {
  const setTodoList = useSetRecoilState(todoListState);
  const [isDeleted, setIsDeleted] = useState(false);

  return (
    <li className={clsx(css.todoItem, { [css.todoItemDeleted]: isDeleted })}>
      <JoinFullOutlinedIcon
        style={{ fill: todo[1].status ? '#ffbe00' : '#ccc' }}
        onClick={() => {
          statusChangeHandler(setTodoList, todo[0], place);
        }}
      />
      <div className={css.todoTitle}>
        <button
          className={css.todoDelete}
          type="button"
          onClick={() => {
            setIsDeleted(true);
            // deleteHandler(setTodoList, todo[0], place);
          }}
        >
          <DeleteRoundedIcon />
        </button>
        {todo[1].text}
      </div>
    </li>
  );
};

const statusChangeHandler = (setList, key, place) => {
  setList((prev) => {
    const list = new Map(prev[place]);

    list.set(key, {
      status: !list.get(key).status,
      text: list.get(key).text,
    });

    return {
      ...prev,
      [place]: list,
    };
  });
};

const deleteHandler = (setList, key, place) => {
  setList((prev) => {
    const list = new Map(prev[place]);

    list.delete(key);

    return {
      ...prev,
      [place]: list,
    };
  });
};

export default WriteForm;
