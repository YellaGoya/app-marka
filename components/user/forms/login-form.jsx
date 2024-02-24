'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { authenticate } from 'lib/action/user';
import Button from 'components/common/button';
import { useEffect } from 'react';
// import { resourceLimits } from 'worker_threads';

import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import CloudSyncRoundedIcon from '@mui/icons-material/CloudSyncRounded';
import global from 'app/global.module.css';
import common from '../common.module.css';

const LoginForm = ({ backward, forward }) => {
  const initialState = { success: null, errors: {} };
  // const [result, dispatch] = useFormState(authenticate, initialState);
  const [result, setResult] = useState({ success: null, error: null });

  const loginDispatch = async (form) => {
    try {
      setResult(await authenticate(initialState, form));
      // console.log('no problem here.');
    } catch {
      console.log('error occured.');
    }
  };

  useEffect(() => {
    if (result && result.success) {
      forward();
    }
  }, [result]);

  return (
    <div>
      <h1 className={global.title}>
        <Button
          className={common.buttonBack}
          onClick={() => {
            backward();
          }}
        >
          <UndoRoundedIcon />
        </Button>
        &nbsp;&nbsp;|&nbsp;&nbsp;데이터베이스 연동
      </h1>
      <form className={common.form} action={loginDispatch}>
        <label>
          <div>
            <input type="text" name="tag" autoComplete="off" placeholder=" " />
            <span>태그</span>
          </div>
        </label>
        <label>
          <div>
            <input type="password" name="password" placeholder=" " />
            <span>비밀번호</span>
          </div>
          <div aria-live="polite" aria-atomic="true">
            {result && result.error && <p>{result.error}</p>}
          </div>
        </label>
        <LoginButton />
      </form>
    </div>
  );
};

const LoginButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button className={common.buttonSubmit} type="submit" aria-disabled={pending}>
      <span>연동</span>
      <CloudSyncRoundedIcon />
    </Button>
  );
};

export default LoginForm;
