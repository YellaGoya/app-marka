'use client';

import { useRef, useState, useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import clsx from 'clsx';

import { getServerTime } from 'app/_lib/action/time';
import { diariesState, onEditDiaryIdState } from 'app/_lib/recoil';
import indexedDb from 'app/_lib/indexed-db';

import SlateEditor from 'app/_components/dirary/slate-editor';
import TodoList from 'app/_components/dirary/todo-list';
import Button from 'app/_components/common/button';

import LowPriorityRoundedIcon from '@mui/icons-material/LowPriorityRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import css from 'app/_components/dirary/write-form.module.css';
import global from 'app/globals.module.css';

const WriteForm = ({ diaryId, idx }) => {
  const onEdit = Boolean(diaryId);

  const editorRef = useRef();

  const [timeNow, setTimeNow] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [diaryTitle, setDiaryTitle] = useState('');
  const [todoList, setTodoList] = useState({ extracted: [], manual: [] });
  const [slateIsEmpty, setSlateIsEmpty] = useState(!onEdit);
  const [diary, setDiary] = useState(null);

  const setDiaries = useSetRecoilState(diariesState);
  const setOnEditDiaryID = useSetRecoilState(onEditDiaryIdState);

  const { addDiary, readDiary, readDiaries, updateDiary } = indexedDb('Diaries');

  useEffect(() => {
    getServerTime()
      .then((result) => {
        const serverTime = new Date(result);
        const year = serverTime.getFullYear();
        const month = serverTime.getMonth() + 1;
        const day = serverTime.getDate();
        const dateString = `${year}. ${month}. ${day}.`;

        setTimeNow(dateString);
      })
      .catch(() => {
        setOnEditDiaryID(null);
      });

    if (onEdit) {
      readDiary(diaryId).then((diary) => {
        setDiary(diary);

        setDiaryTitle(diary.title);
        setTodoList({ extracted: new Map(diary.extracted_todos), manual: new Map(diary.manual_todos) });

        setIsLoaded(true);
      });
    } else {
      setIsLoaded(true);
    }
  }, []);

  const extractTodoList = () => {
    editorRef.current.extractTodoList(setTodoList);
  };

  const saveDiary = () => {
    const contentHtml = editorRef.current.extractDiary();

    if (onEdit) {
      const extracted = Array.from(todoList.extracted.entries());
      const manual = Array.from(todoList.manual.entries());

      updateDiary({
        diary_id: diary.diary_id,
        title: diaryTitle ? diaryTitle : timeNow,
        content_html: contentHtml,
        extracted_todos: extracted,
        manual_todos: manual,
        created_at: diary.created_at,
      }).then(() => {
        setOnEditDiaryID(null);

        setDiaries((prevDiaries) => {
          const updatedDiaries = [...prevDiaries];

          updatedDiaries[idx] = {
            ...diary,
            title: diaryTitle ? diaryTitle : timeNow,
            content_html: contentHtml,
            extracted_todos: extracted,
            manual_todos: manual,
          };

          return updatedDiaries;
        });
      });
    } else {
      addDiary({
        title: diaryTitle ? diaryTitle : timeNow,
        content_html: contentHtml,
        extracted_todos: Array.from(todoList.extracted.entries()),
        manual_todos: Array.from(todoList.manual.entries()),
        is_secret: false,
      }).then(() => {
        setDiaryTitle('');
        editorRef.current.emptyDiary();
        setTodoList({ extracted: [], manual: [] });
        updateMyDiaries();
      });
    }

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
    <div className={clsx(css.newWriteContainer, { [css.editContainer]: onEdit }, { [css.loadedContainer]: isLoaded })}>
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
        {diary || !onEdit ? <SlateEditor ref={editorRef} setSlateIsEmpty={setSlateIsEmpty} contentHtml={diary ? diary.content_html : null} /> : null}

        <div className={global.divLine} />

        <section className={css.bottom}>
          <TodoList todoList={todoList} setTodoList={setTodoList} onEdit={onEdit} />
          <fieldset className={css.buttonContainer}>
            <Button disabled={slateIsEmpty} onClick={extractTodoList}>
              <LowPriorityRoundedIcon />
            </Button>
            <Button disabled={slateIsEmpty} onClick={saveDiary}>
              <SaveRoundedIcon />
            </Button>
          </fieldset>
        </section>
      </form>
    </div>
  );
};

export default WriteForm;
