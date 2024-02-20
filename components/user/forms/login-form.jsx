'use client';

import { useFormState, useFormStatus } from 'react-dom';

import { authenticate } from 'lib/action/user';
import Button from 'components/common/button';
import { useEffect } from 'react';
// import { resourceLimits } from 'worker_threads';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import common from '../common.module.css';

const LoginForm = ({ backward, forward }) => {
  const initialState = { success: null, error: null };
  const [result, dispatch] = useFormState(authenticate, initialState);

  useEffect(() => {
    if (result.success) {
      forward();
    }
  }, [result]);

  return (
    <div>
      <h1 className={common.userTitle}>
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
      <form className={common.form} action={dispatch}>
        <input type="text" name="tag" placeholder="태그" autoComplete="off" />
        <input type="password" name="password" placeholder="비밀번호" />
        <div aria-live="polite" aria-atomic="true">
          {result.error && <p className="text-sm text-red-500">{result.error}</p>}
        </div>
        <LoginButton />
      </form>
    </div>
  );
};

const LoginButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" aria-disabled={pending}>
      연동
    </Button>
  );
};

export default LoginForm;
