'use client';

import SlateEditor from 'app/_components/dirary/slate-editor';

import css from 'app/_components/dirary/write-form.module.css';

const WriteForm = () => {
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
        <SlateEditor />
        <div className={css.DivLine} />
      </form>
    </div>
  );
};

export default WriteForm;
