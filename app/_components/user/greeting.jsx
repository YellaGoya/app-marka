'use client';

import { useState } from 'react';

import LoginForm from 'app/_components/user/login-form';
import RegistForm from 'app/_components/user/regist-form';
import Button from 'app/_components/common/button';

import css from './greeting.module.css';

const Greeting = () => {
  const [tab, setTab] = useState(0);
  return (
    <div className={css.greetingContainer}>
      {tab === 0 ? (
        <>
          <Button
            onClick={() => {
              setTab(1);
            }}
          >
            데이터베이스 연동
          </Button>
          <Button
            onClick={() => {
              setTab(2);
            }}
          >
            태그 등록
          </Button>
        </>
      ) : tab === 1 ? (
        <LoginForm
          backward={() => {
            setTab(0);
          }}
        />
      ) : tab === 2 ? (
        <RegistForm
          backward={() => {
            setTab(0);
          }}
        />
      ) : (
        <>
          <div>데이터베이스 연동 완료</div>
        </>
      )}
    </div>
  );
};

export default Greeting;
