'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useDebouncedCallback } from 'use-debounce';
import clsx from 'clsx';

import { getServerTime } from 'lib/api/time';
import * as clientDB from 'lib/indexed-db';
import * as serverDB from 'lib/api/diary';
import Button from 'components/common/button';

import JoinFullOutlinedIcon from '@mui/icons-material/JoinFullOutlined';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';

import css from 'components/dirary/todo-list.module.css';

const TodoList = ({ todoList, setTodoList, diaryId, onEdit, addTodoItem }) => {
  const isWrite = !diaryId;

  const { extracted, manual } = todoList;

  return (
    <div
      className={clsx(css.todoListContainer, { [css.editListContainer]: onEdit })}
      style={isWrite ? { paddingTop: '4px' } : extracted && extracted.size === 0 && manual && manual.size === 0 ? null : { marginTop: '40px' }}
    >
      {extracted && extracted.size > 0 && (
        <>
          <h4 className={css.todoCategoryTitle}>다이어리</h4>
          <ul className={css.todoList}>
            {Array.from(extracted).map((todo) => {
              return <TodoItem key={todo[0]} todo={todo} place="extracted" setTodoList={setTodoList} isWrite={isWrite} diaryId={diaryId} />;
            })}
          </ul>
        </>
      )}

      {((manual && manual.size > 0) || isWrite) && (
        <span className={css.todoCategoryTitle} style={extracted && extracted.size > 0 ? { marginTop: '16px' } : null}>
          <span>추가</span>
          {isWrite && (
            <Button onClick={addTodoItem}>
              <AddBoxRoundedIcon />
            </Button>
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
  const { status } = useSession();

  if (!todo) return;
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
    setTodoList((prevTodoList) => {
      const list = new Map(prevTodoList[place]);

      list.set(todo[0], {
        done: list.get(todo[0]).done,
        text,
      });

      return {
        ...prevTodoList,
        [place]: list,
      };
    });
  }, 300);

  /** 투두리스트 done, undone 상태 토글 처리 */
  const updateTodoStatus = async (todoId, done) => {
    let time;
    let timestamp;

    try {
      time = await getServerTime();
      timestamp = new Date(time).getTime();
    } catch (error) {
      const date = new Date();

      time = date.toISOString();
      timestamp = date.getTime();
    }

    try {
      if (!isWrite) {
        if (status === 'authenticated') {
          diaryId = Number(diaryId.slice(-13));

          await serverDB.updateStatus(place, diaryId, todoId, done, timestamp);
        }

        await clientDB.updateStatus(place, diaryId, todoId, done, timestamp);
      }

      setTodoList((prevTodoList) => {
        const list = new Map(prevTodoList[place]);

        list.set(todoId, {
          done,
          text: list.get(todoId).text,
        });

        return {
          ...prevTodoList,
          [place]: list,
        };
      });
    } catch {
      // DB가 수정되지 않으면 아무런 변화가 없도록
    }
  };

  /** 투두리스트 삭제 전 transition 적용 및 제거 */
  const deleteHandler = (todoId) => {
    // transition 이 끝난 0.5초 뒤에 삭제
    setTimeout(() => {
      setTodoList((prevTodoList) => {
        const list = new Map(prevTodoList[place]);

        list.delete(todoId);

        return {
          ...prevTodoList,
          [place]: list,
        };
      });
    }, 500);
  };

  return (
    <li className={clsx(css.todoItem, { [css.todoItemDeleted]: isDeleted })}>
      <Button
        className={css.todoStatus}
        onClick={() => {
          updateTodoStatus(todo[0], !todo[1].done);
        }}
      >
        <JoinFullOutlinedIcon style={{ fill: todo[1].done ? '#ffbe00' : null }} />
      </Button>
      <div className={clsx(css.todoTitleContainer, { [css.todoTitleNotEditing]: !isEditing })}>
        {isWrite && (
          <Button
            className={css.todoDelete}
            onClick={() => {
              setIsDeleted(true);
              deleteHandler(todo[0]);
            }}
          >
            <DeleteRoundedIcon />
          </Button>
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
