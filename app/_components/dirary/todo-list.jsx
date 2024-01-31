'use client';

import { useState, useEffect, useRef } from 'react';
import { useSetRecoilState } from 'recoil';
import { useDebouncedCallback } from 'use-debounce';
import clsx from 'clsx';

import { todoListState } from 'app/_lib/recoil';

import JoinFullOutlinedIcon from '@mui/icons-material/JoinFullOutlined';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import BookmarkAddRoundedIcon from '@mui/icons-material/BookmarkAddRounded';

import css from 'app/_components/dirary/todo-list.module.css';
import global from 'app/globals.module.css';

const TodoList = ({ todoList, setTodoList }) => {
  const extractedArray = Array.from(todoList.extracted);
  const manualArray = Array.from(todoList.manual);

  const [keyNumber, setKeyNumber] = useState(0);

  if (!setTodoList) console.log(manualArray);

  let newTodoItem;
  if (setTodoList)
    newTodoItem = () => {
      setTodoList((prev) => {
        const list = new Map(prev.manual);

        list.set(`manual-${keyNumber}`, {
          done: false,
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
    <div className={css.todoListContainer}>
      {extractedArray && extractedArray.length > 0 && (
        <>
          <h4 className={css.todoCategoryTitle}>다이어리</h4>
          <ul className={css.todoList}>
            {Array.from(extractedArray).map((todo) => {
              return <TodoItem key={todo[0]} todo={todo} place="extracted" />;
            })}
          </ul>
        </>
      )}

      {((manualArray && manualArray.length > 0) || setTodoList) && (
        <span className={css.todoCategoryTitle} style={extractedArray && extractedArray.length > 0 ? { marginTop: '16px' } : null}>
          추가
          {setTodoList && (
            <button
              type="button"
              className={global.button}
              style={{ marginTop: '3px', marginLeft: '3px' }}
              onClick={() => {
                newTodoItem();
              }}
            >
              <BookmarkAddRoundedIcon />
            </button>
          )}
        </span>
      )}
      {manualArray && manualArray.length > 0 && (
        <>
          <ul className={css.todoList}>
            {Array.from(manualArray).map((todo) => {
              return <TodoItem key={todo[0]} todo={todo} place="manual" />;
            })}
          </ul>
        </>
      )}
    </div>
  );
};

const TodoItem = ({ todo, place = 'extracted' }) => {
  if (!todo) return;
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
        done: list.get(todo[0]).done,
        text,
      });

      return {
        ...prev,
        [place]: list,
      };
    });
  }, 300);

  /** 투두리스트 done, undone 상태 처리 */
  const statusChangeHandler = (key, place) => {
    setTodoList((prev) => {
      const list = new Map(prev[place]);

      list.set(key, {
        done: !list.get(key).done,
        text: list.get(key).text,
      });

      return {
        ...prev,
        [place]: list,
      };
    });
  };

  /** 투두리스트 삭제 전 transition 적용 및 제거 */
  const deleteHandler = (key, place) => {
    // transition 이 끝난 0.5초 뒤에 삭제
    setTimeout(() => {
      setTodoList((prev) => {
        const list = new Map(prev[place]);

        list.delete(key);

        return {
          ...prev,
          [place]: list,
        };
      });
    }, 500);
  };

  return (
    <li className={clsx(css.todoItem, { [css.todoItemDeleted]: isDeleted })}>
      <JoinFullOutlinedIcon
        style={{ fill: todo[1].done ? '#ffbe00' : '#ccc' }}
        onClick={() => {
          statusChangeHandler(todo[0], place);
        }}
      />
      <div className={clsx(css.todoTitleContainer, { [css.todoTitleNotEditing]: !isEditing })}>
        <button
          className={css.todoDelete}
          type="button"
          onClick={() => {
            setIsDeleted(true);
            deleteHandler(todo[0], place);
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

export default TodoList;
