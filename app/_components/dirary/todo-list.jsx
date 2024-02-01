'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import clsx from 'clsx';

import indexedDb from 'app/_lib/indexed-db';

import JoinFullOutlinedIcon from '@mui/icons-material/JoinFullOutlined';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';

import css from 'app/_components/dirary/todo-list.module.css';
import global from 'app/globals.module.css';

const TodoList = ({ todoList, setTodoList, diaryId }) => {
  const isWrite = Boolean(setTodoList);
  if (!isWrite) {
    const list = {
      extracted: new Map(todoList.extracted),
      manual: new Map(todoList.manual),
    };
    [todoList, setTodoList] = useState(list);
  }

  const { extracted } = todoList;
  const { manual } = todoList;

  const [keyNumber, setKeyNumber] = useState(0);

  let newTodoItem;
  if (isWrite)
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
    <div
      className={css.todoListContainer}
      style={isWrite ? { paddingTop: '4px' } : extracted && extracted.size === 0 && manual && manual.size === 0 ? null : { marginTop: '40px' }}
    >
      {extracted && extracted.size > 0 && (
        <>
          <h4 className={css.todoCategoryTitle}>다이어리</h4>
          <ul className={css.todoList}>
            {Array.from(extracted).map((todo) => {
              return <TodoItem key={todo[0]} todo={todo} place="extracted" setTodoList={setTodoList} diaryId={diaryId} />;
            })}
          </ul>
        </>
      )}

      {((manual && manual.size > 0) || isWrite) && (
        <span className={css.todoCategoryTitle} style={extracted && extracted.size > 0 ? { marginTop: '16px' } : null}>
          <span>추가</span>
          {isWrite && (
            <button
              type="button"
              className={global.button}
              onClick={() => {
                newTodoItem();
              }}
            >
              <AddBoxRoundedIcon />
            </button>
          )}
        </span>
      )}
      {manual && manual.size > 0 && (
        <>
          <ul className={css.todoList}>
            {Array.from(manual).map((todo) => {
              return <TodoItem key={todo[0]} todo={todo} place="manual" setTodoList={setTodoList} isWrite={isWrite} diaryId={diaryId} />;
            })}
          </ul>
        </>
      )}
    </div>
  );
};

const TodoItem = ({ todo, place = 'extracted', setTodoList, isWrite, diaryId }) => {
  if (!todo) return;
  const [isDeleted, setIsDeleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [todoTitle, setTodoTitle] = useState(todo[1].text);

  const titleRef = useRef(null);

  let updateStatus;
  if (!isWrite) {
    ({ updateStatus } = indexedDb('Diaries'));
  }

  useEffect(() => {
    if (isEditing) {
      titleRef.current.focus();
    }
  }, [isEditing]);

  const titleChangeHandler = (event) => {
    setTodoTitle(event.target.value);
    console.log('hey');
    updateTodoText(event.target.value);
  };

  const titleOnBlurHandler = () => {
    if (!todoTitle) {
      setTodoTitle('---');
      updateTodoText('---');
    }

    setIsEditing(false);
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

  /** 투두리스트 done, undone 상태 토글 처리 */
  const updateTodoStatus = async (todoId, done) => {
    console.log(place);
    let apiResult = true;

    if (!isWrite)
      await updateStatus(place, diaryId, todoId, done).catch(() => {
        apiResult = false;
      });

    // API 결과에 따라 상태 업데이트
    if (apiResult) {
      setTodoList((prev) => {
        const list = new Map(prev[place]);

        list.set(todoId, {
          done,
          text: list.get(todoId).text,
        });

        return {
          ...prev,
          [place]: list,
        };
      });
    }
  };

  /** 투두리스트 삭제 전 transition 적용 및 제거 */
  const deleteHandler = (todoId) => {
    // transition 이 끝난 0.5초 뒤에 삭제
    setTimeout(() => {
      setTodoList((prev) => {
        const list = new Map(prev[place]);

        list.delete(todoId);

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
          updateTodoStatus(todo[0], !todo[1].done);
        }}
      />
      <div className={clsx(css.todoTitleContainer, { [css.todoTitleNotEditing]: !isEditing })}>
        {isWrite && (
          <button
            className={css.todoDelete}
            type="button"
            onClick={() => {
              setIsDeleted(true);
              deleteHandler(todo[0]);
            }}
          >
            <DeleteRoundedIcon />
          </button>
        )}

        {isWrite && isEditing ? (
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
              titleOnBlurHandler();
            }}
          />
        ) : (
          <span
            className={css.todoTitle}
            onClick={() => {
              if (isWrite) setIsEditing(true);
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
