'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';

import { putOnWaitingList } from 'lib/action/user';
import { test } from 'lib/action/user';

import Button from 'components/common/button';

import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import common from '../common.module.css';

const RegistForm = ({ backward, forward }) => {
  const initialState = { success: null, message: null, errors: {} };
  const [result, dispatch] = useFormState(putOnWaitingList, initialState);

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
        &nbsp;&nbsp;|&nbsp;&nbsp;태그 등록
      </h1>
      <form className={common.form} action={dispatch}>
        <label>
          태그:
          <input type="text" name="tag" />
          <div id="tag-error" aria-live="polite" aria-atomic="true">
            {result.errors?.tag && result.errors.tag.map((error) => <p key={error}>{error}</p>)}
          </div>
        </label>

        <label>
          이메일:
          <input type="email" name="email" />
          <div id="email-error" aria-live="polite" aria-atomic="true">
            {result.errors?.email && result.errors.email.map((error) => <p key={error}>{error}</p>)}
          </div>
        </label>

        <label>
          비밀번호:
          <input type="password" name="password" />
          <div id="password-error" aria-live="polite" aria-atomic="true">
            {result.errors?.password && result.errors.password.map((error) => <p key={error}>{error}</p>)}
          </div>
        </label>

        <label>
          비밀번호 확인:
          <input type="password" name="confirmPassword" />
          <div id="confirmPassword-error" aria-live="polite" aria-atomic="true">
            {result.errors?.confirmPassword && result.errors.confirmPassword.map((error) => <p key={error}>{error}</p>)}
          </div>
        </label>

        <SubmitButton />
      </form>
      <button
        type="button"
        onClick={() => {
          test();
        }}
      >
        test!!!
      </button>
    </div>
  );
};

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" aria-disabled={pending}>
      등록 완료
    </Button>
  );
};

export default RegistForm;
