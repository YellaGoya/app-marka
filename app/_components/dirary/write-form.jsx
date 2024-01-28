'use client';

import { useRef, useState, useEffect } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useDebouncedCallback } from 'use-debounce';
import clsx from 'clsx';

import { todoListState } from 'app/_lib/recoil';
import SlateEditor from 'app/_components/dirary/slate-editor';

import JoinFullOutlinedIcon from '@mui/icons-material/JoinFullOutlined';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import LowPriorityRoundedIcon from '@mui/icons-material/LowPriorityRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import BookmarkAddRoundedIcon from '@mui/icons-material/BookmarkAddRounded';
import css from 'app/_components/dirary/write-form.module.css';

const WriteForm = () => {
  const editorRef = useRef();
  const [todoList, setTodoList] = useRecoilState(todoListState);
  const [timeNow, setTimeNow] = useState(null);
  const [keyNumber, setKeyNumber] = useState(0);

  useEffect(() => {
    setTimeNow(new Date());

    // const idb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

    // const indexed = window.indexedDB.open('appMarka');

    // indexed.onsuccess = () => {};
  }, []);

  const extractTodoList = () => {
    editorRef.current.extractTodoList();
  };

  const saveDiary = () => {
    console.log(editorRef.current.extractDiary());
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

  const newTodoItem = () => {
    setTodoList((prev) => {
      const list = new Map(prev.manual);

      list.set(`diary-${keyNumber}`, {
        status: false,
        text: '새로운 일',
      });

      return {
        ...prev,
        manual: list,
      };
    });

    setKeyNumber((prev) => prev + 1);
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
          <div className={css.todoListContainer}>
            {todoList.diary.size > 0 ? (
              <>
                <h4 className={css.todoCategoryTitle}>다이어리</h4>
                <ul className={css.todoList}>
                  {Array.from(todoList.diary).map((todo) => {
                    return <TodoList key={todo[0]} todo={todo} place="diary" />;
                  })}
                </ul>
              </>
            ) : null}
            <span className={css.todoCategoryTitle} style={todoList.diary.size > 0 ? { marginTop: '16px' } : null}>
              추가
              <button
                type="button"
                className={css.button}
                style={{ marginTop: '3px', marginLeft: '3px' }}
                onClick={() => {
                  newTodoItem();
                }}
              >
                <BookmarkAddRoundedIcon />
              </button>
            </span>
            {todoList.manual.size > 0 ? (
              <>
                <ul className={css.todoList}>
                  {Array.from(todoList.manual).map((todo) => {
                    return <TodoList key={todo[0]} todo={todo} place="manual" />;
                  })}
                </ul>
              </>
            ) : null}
          </div>

          <fieldset className={css.buttonContainer}>
            <button type="button" className={css.button} onClick={extractTodoList}>
              <LowPriorityRoundedIcon style={{ width: '1.7rem', height: '1.7rem', marginRight: '10px' }} />
            </button>
            <button type="button" className={css.button} onClick={saveDiary}>
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
  const [isEditing, setIsEditing] = useState(false);
  const [todoTitle, setTodoTitle] = useState(todo[1].text);

  const titleRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      titleRef.current.focus();
    }
  }, [isEditing]);

  const titleChangeHandler = (event) => {
    setTodoTitle(event.target.value);
    updateTodoText(event.target.value);
  };

  const keyDownHandler = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      setIsEditing(false);
    }
  };

  const updateTodoText = useDebouncedCallback((text) => {
    setTodoList((prev) => {
      const list = new Map(prev[place]);

      list.set(todo[0], {
        status: list.get(todo[0]).status,
        text,
      });

      return {
        ...prev,
        [place]: list,
      };
    });
  }, 300);

  return (
    <li className={clsx(css.todoItem, { [css.todoItemDeleted]: isDeleted })}>
      <JoinFullOutlinedIcon
        style={{ fill: todo[1].status ? '#ffbe00' : '#ccc' }}
        onClick={() => {
          statusChangeHandler(setTodoList, todo[0], place);
        }}
      />
      <div className={clsx(css.todoTitleContainer, { [css.todoTitleNotEditing]: !isEditing })}>
        <button
          className={css.todoDelete}
          type="button"
          onClick={() => {
            setIsDeleted(true);
            deleteHandler(setTodoList, todo[0], place);
          }}
        >
          <DeleteRoundedIcon />
        </button>
        {isEditing ? (
          <input
            ref={titleRef}
            value={todoTitle}
            className={css.todoInput}
            onChange={(event) => {
              titleChangeHandler(event);
            }}
            onKeyDown={(event) => {
              keyDownHandler(event);
            }}
            onBlur={() => {
              setIsEditing(false);
            }}
          />
        ) : (
          <span
            className={css.todoTitle}
            onClick={() => {
              setIsEditing(true);
            }}
          >
            {todo[1].text}
          </span>
        )}
      </div>
    </li>
  );
};

/** 투두리스트 done, undone 상태 처리 */
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

/** 투두리스트 삭제 전 transition 적용 및 제거 */
const deleteHandler = (setList, key, place) => {
  // transition 이 끝난 0.5초 뒤에 삭제
  setTimeout(() => {
    setList((prev) => {
      const list = new Map(prev[place]);

      list.delete(key);

      return {
        ...prev,
        [place]: list,
      };
    });
  }, 500);
};

export default WriteForm;
