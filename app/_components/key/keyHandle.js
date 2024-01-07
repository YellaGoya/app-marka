'use client';

import { useState, useRef } from 'react';

import * as stylex from '@stylexjs/stylex';
import styles from './keyHandle.style.js';

const KeyHandle = () => {
  const [keyValue, setKeyValue] = useState('');
  const [keyLog, setKeyLog] = useState('');

  const logRef = useRef(null);

  const keyDownHandler = (e) => {
    // 키가 눌려있을 때 추가적인 입력을 막는다.
    if (e.repeat) return;

    setKeyValue(e.code);

    // 만약 logRef 의 높이가 vh를 넘어가면 keyLog를 초기화
    if (logRef.current.scrollHeight > window.innerHeight) {
      const lastN = keyLog.lastIndexOf('\n');
      setKeyLog(e.code + '\n' + keyLog.slice(0, lastN));
    } else {
      setKeyLog(e.code + '\n' + keyLog);
    }

    console.log(e.code);
  };

  const keyUpHandler = (e) => {
    console.log(e.code);
  };

  const changeHandler = () => {
    setKeyValue('');
  };

  return (
    <div>
      <input
        {...stylex.props(styles.input)}
        value={keyValue}
        onKeyDown={(e) => {
          keyDownHandler(e);
        }}
        onKeyUp={(e) => {
          keyUpHandler(e);
        }}
        onChange={() => {
          changeHandler();
        }}
      />
      <div {...stylex.props(styles.log)} ref={logRef}>
        {keyLog}
      </div>
    </div>
  );
};

export default KeyHandle;
