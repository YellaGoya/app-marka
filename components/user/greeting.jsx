'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getSession } from 'next-auth/react';

import { signOut } from 'next-auth/react';

import LoginForm from 'components/user/forms/login-form';
import RegistForm from 'components/user/forms/regist-form';
import Button from 'components/common/button';

import css from './greeting.module.css';

const Greeting = () => {
  const { status } = useSession();
  useEffect(() => {
    if (status === 'authenticated') {
      setTab(3);
    }

    if (status === 'unauthenticated') {
      setTab(0);
    }
  }, [status]);

  const [tab, setTab] = useState(null);

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
          forward={() => {
            setTab(3);
            getSession();
          }}
        />
      ) : tab === 2 ? (
        <RegistForm
          backward={() => {
            setTab(0);
          }}
          forward={() => {
            setTab(4);
          }}
        />
      ) : tab === 3 ? (
        <div>
          데이터베이스 연동 완료
          <Button
            onClick={() => {
              signOut({ redirect: false }).then(() => {
                setTab(0);
                getSession();
              });
            }}
          >
            hello
          </Button>
        </div>
      ) : tab === 4 ? (
        <div>대기자 명단에 등록 완료</div>
      ) : null}
    </div>
  );
};

export default Greeting;
