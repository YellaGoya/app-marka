'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getSession } from 'next-auth/react';
import clsx from 'clsx';

import { signOut } from 'next-auth/react';

import LoginForm from 'components/user/forms/login-form';
import RegistForm from 'components/user/forms/regist-form';
import Button from 'components/common/button';

import CloudSyncRoundedIcon from '@mui/icons-material/CloudSyncRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import css from './greeting.module.css';
import global from 'app/global.module.css';

const Greeting = () => {
  const { status } = useSession();

  const [tab, setTab] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') {
      setTab(3); // 3
    }

    if (status === 'unauthenticated') {
      setTab(0); // 0
    }
  }, [status]);

  return (
    <>
      <div className={clsx(global.cardContainer, css.syncContainer, { [global.loaded]: tab !== null })}>
        {tab === 0 ? (
          <>
            <h1 className={global.title}>
              <span>기존 데이터</span>를 연동할 수 있습니다.
            </h1>
            <span className={css.buttonWrapper}>
              <Button
                className={global.textButton}
                onClick={() => {
                  setTab(1);
                }}
              >
                <span>데이터베이스 연동</span>
                <CloudSyncRoundedIcon />
              </Button>
              <Button
                className={global.textButton}
                onClick={() => {
                  setTab(2);
                }}
              >
                <span>태그 등록</span>
                <ExitToAppRoundedIcon />
              </Button>
            </span>
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
          <>
            <h1 className={global.title}>데이터베이스 연동이 완료 되었습니다.</h1>
            <span className={css.buttonWrapper}>
              <Button
                className={global.textButton}
                onClick={() => {
                  signOut({ redirect: false }).then(() => {
                    setTab(0);
                    getSession();
                  });
                }}
              >
                <span>연동 해제</span>
                <LogoutRoundedIcon />
              </Button>
            </span>
          </>
        ) : tab === 4 ? (
          <>
            <h1 className={global.title}>태그 신청이 완료 되었습니다.</h1>
            <p style={{ fontSize: '14px', marginTop: '-20px', marginBottom: '20px' }}>* 관리자의 승인 후 이용 가능.</p>
            <Button
              className={global.textButton}
              onClick={() => {
                setTab(0);
              }}
            >
              <span>처음으로</span>
              <PlayCircleOutlineRoundedIcon />
            </Button>
          </>
        ) : null}
      </div>
      <span className={clsx(global.poweredBy, { [global.loaded]: tab !== null })}>Powered by ahnsehyeok.</span>
    </>
  );
};

export default Greeting;
