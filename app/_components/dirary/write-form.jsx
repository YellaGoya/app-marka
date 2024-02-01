'use client';

import { useRef, useState, useEffect } from 'react';
import { useRecoilState, useSetRecoilState, useRecoilValue } from 'recoil';
import clsx from 'clsx';

import { getServerTime } from 'app/_lib/action/time';
import { todoListState, slateIsEmptyState, diariesState } from 'app/_lib/recoil';
import indexedDb from 'app/_lib/indexed-db';

import SlateEditor from 'app/_components/dirary/slate-editor';
import TodoList from 'app/_components/dirary/todo-list';

import LowPriorityRoundedIcon from '@mui/icons-material/LowPriorityRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import css from 'app/_components/dirary/write-form.module.css';
import global from 'app/globals.module.css';

const WriteForm = () => {
  const editorRef = useRef();
  const [timeNow, setTimeNow] = useState(null);

  const [diaryTitle, setDiaryTitle] = useState('');
  const [todoList, setTodoList] = useRecoilState(todoListState);

  const slateIsEmpty = useRecoilValue(slateIsEmptyState);

  const { addDiary, readDiaries } = indexedDb('Diaries');
  const setDiaries = useSetRecoilState(diariesState);

  useEffect(() => {
    getServerTime().then((result) => {
      const serverTime = new Date(result);
      const year = serverTime.getFullYear();
      const month = serverTime.getMonth() + 1;
      const day = serverTime.getDate();
      const dateString = `${year}. ${month}. ${day}.`;

      setTimeNow(dateString);
    });
  }, []);

  const extractTodoList = () => {
    editorRef.current.extractTodoList();
  };

  const saveDiary = () => {
    const contentHtml = editorRef.current.extractDiary();

    addDiary({
      title: diaryTitle ? diaryTitle : timeNow,
      content_html: contentHtml,
      extracted_todos: Array.from(todoList.extracted.entries()),
      manual_todos: Array.from(todoList.manual.entries()),
      is_secret: false,
    }).then(() => {
      editorRef.current.emptyDiary();
      setTodoList({ extracted: [], manual: [] });

      updateMyDiaries();
    });

    // updateDiary({ id: 1, title: 'test2', content: 'helloworld!2');
  };

  const updateMyDiaries = async () => {
    try {
      const diaries = await readDiaries(false);
      setDiaries(diaries);
    } catch {
      return new Error('Error: getMyDiaries.');
    }
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
        event.target.value = timeNow;
      }
    }
  };

  return (
    <div className={css.newWriteContainer}>
      <form className={css.form}>
        <input
          value={diaryTitle}
          className={css.title}
          type="text"
          maxLength="50"
          placeholder={timeNow ? timeNow : null}
          onChange={(event) => {
            setDiaryTitle(event.target.value);
          }}
          onFocus={(event) => {
            inputClickHandler(event);
          }}
          onKeyPress={(event) => {
            enterKeyHandler(event);
          }}
        />

        <div className={global.divLine} />
        <SlateEditor ref={editorRef} />
        <div className={global.divLine} />

        <section className={css.bottom}>
          <TodoList todoList={todoList} setTodoList={setTodoList} />
          <fieldset className={css.buttonContainer}>
            <button type="button" className={clsx(global.button, { [global.disabledButton]: slateIsEmpty })} onClick={extractTodoList}>
              <LowPriorityRoundedIcon style={{ width: '1.7rem', height: '1.7rem', marginRight: '10px' }} />
            </button>
            <button type="button" className={clsx(global.button, css.save, { [global.disabledButton]: slateIsEmpty })} onClick={saveDiary}>
              <SaveRoundedIcon />
            </button>
          </fieldset>
        </section>
      </form>
    </div>
  );
};

export default WriteForm;
