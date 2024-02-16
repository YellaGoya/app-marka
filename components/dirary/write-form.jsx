'use client';

import { useRef, useState, useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

import { getServerTime } from 'lib/action/time';
import { diariesState, onEditDiaryIdState } from 'lib/recoil';
import * as clientDB from 'lib/indexed-db';
import * as serverDB from 'lib/api/diary';

import SlateEditor from 'components/dirary/slate-editor';
import TodoList from 'components/dirary/todo-list';
import Button from 'components/common/button';

import LowPriorityRoundedIcon from '@mui/icons-material/LowPriorityRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import css from 'components/dirary/write-form.module.css';
import global from 'app/globals.module.css';

const WriteForm = ({ diaryId, idx }) => {
  const { status } = useSession();

  const onEdit = Boolean(diaryId);

  const editorRef = useRef();

  const [timeNow, setTimeNow] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [diaryTitle, setDiaryTitle] = useState('');
  const [todoList, setTodoList] = useState({ extracted: new Map(), manual: new Map() });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSecret, setIsSecret] = useState(false);
  const [slateIsEmpty, setSlateIsEmpty] = useState(!onEdit);
  const [diary, setDiary] = useState(null);

  const setDiaries = useSetRecoilState(diariesState);
  const setOnEditDiaryID = useSetRecoilState(onEditDiaryIdState);

  useEffect(() => {
    let time;

    getServerTime()
      .then((result) => {
        time = new Date(result);
      })
      .catch(() => {
        time = new Date();
      })
      .finally(() => {
        const year = time.getFullYear();
        const month = time.getMonth() + 1;
        const day = time.getDate();
        const dateString = `${year}. ${month}. ${day}.`;

        setTimeNow(dateString);
      });

    if (onEdit) {
      loadDiary();
    } else {
      setIsLoaded(true);
    }
  }, []);

  const loadDiary = async () => {
    try {
      const prevDiary = status === 'authenticated' ? await serverDB.readDiary(diaryId) : await clientDB.readDiary(diaryId);

      const { title, extracted_todos, manual_todos } = prevDiary;

      setDiary(prevDiary);
      setDiaryTitle(title);
      setTodoList({ extracted: new Map(extracted_todos), manual: new Map(manual_todos) });

      setIsLoaded(true);
    } catch (error) {
      console.error(`Failed to fetch diary: ${error}`);
    }
  };

  const extractTodoList = () => {
    editorRef.current.extractTodoList(setTodoList);
  };

  const saveDiary = async () => {
    const contentHtml = editorRef.current.extractDiary();
    const extracted = Array.from(todoList.extracted.entries());
    const manual = Array.from(todoList.manual.entries());

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

    const newDiary = {
      diary_id: onEdit ? diary.diary_id : timestamp,
      title: diaryTitle ? diaryTitle : timeNow,
      content_html: contentHtml,
      extracted_todos: extracted,
      manual_todos: manual,
      created_at: onEdit ? diary.created_at : time,
      updated_at: time,
      is_secret: isSecret,
    };

    const onUpdateDiary = () => {
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
    };

    const onAddDiary = async () => {
      setDiaryTitle('');
      setTodoList({ extracted: [], manual: [] });

      editorRef.current.emptyDiary();

      try {
        const diaries = status === 'authenticated' ? await serverDB.readDiaries(false) : await clientDB.readDiaries(false);

        setDiaries(diaries);
      } catch (error) {
        location.reload();
      }
    };

    const action = onEdit ? 'updateDiary' : 'addDiary';
    const handler = onEdit ? onUpdateDiary : onAddDiary;

    if (onEdit && status === 'authenticated') newDiary.diary_id = Number(newDiary.diary_id.slice(-13));

    try {
      if (status === 'authenticated') await serverDB[action](newDiary);
      console.log('tetet');
      await clientDB[action](newDiary);

      handler();
    } catch (error) {
      console.error(error.message);
    }
  };

  /** 제목 input 영역 클릭시 가장 끝으로 focus 이동 */
  const inputClickHandler = (event) => {
    const input = event.target;

    setTimeout(() => {
      const { length } = input.value;

      input.setSelectionRange(length, length);
      input.scrollLeft = input.scrollWidth;
    }, 0);
  };

  /** 제목 input 영역의 enter 키 submit 이벤트 차단 */
  const enterKeyHandler = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      const input = event.target;

      if (input.value === '' && timeNow) {
        input.value = timeNow;
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
