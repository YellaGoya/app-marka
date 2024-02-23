'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';

import { putOnWaitingList } from 'lib/action/user';

import Button from 'components/common/button';

import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import PasswordRoundedIcon from '@mui/icons-material/PasswordRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import common from '../common.module.css';

const RegistForm = ({ backward, forward }) => {
  const initialState = { success: null, message: null, errors: {} };
  const [result, dispatch] = useFormState(putOnWaitingList, initialState);

  useEffect(() => {
    if (result && result.success) {
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
        <PersonRoundedIcon />

        <label>
          <div>
            <input type="text" name="tag" placeholder=" " />
            <span>태그(ID)</span>
          </div>
          <div id="tag-error" aria-live="polite" aria-atomic="true">
            {result && result.errors?.tag && result.errors.tag.map((error) => <p key={error}>{error}</p>)}
          </div>
        </label>
        <label>
          <div>
            <input type="email" name="email" placeholder=" " />
            <span>이메일</span>
          </div>
          <div id="email-error" aria-live="polite" aria-atomic="true">
            {result && result.errors?.email && result.errors.email.map((error) => <p key={error}>{error}</p>)}
          </div>
        </label>

        <PasswordRoundedIcon />

        <label>
          <div>
            <input type="password" name="password" placeholder=" " />
            <span>비밀번호</span>
          </div>
          <div id="password-error" aria-live="polite" aria-atomic="true">
            {result && result.errors?.password && result.errors.password.map((error) => <p key={error}>{error}</p>)}
          </div>
        </label>

        <label>
          <div>
            <input type="password" name="confirmPassword" placeholder=" " />
            <span>비밀번호 확인</span>
          </div>
          <div id="confirmPassword-error" aria-live="polite" aria-atomic="true">
            {result && result.errors?.confirmPassword && result.errors.confirmPassword.map((error) => <p key={error}>{error}</p>)}
          </div>
        </label>

        <SubmitButton />
      </form>
    </div>
  );
};

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button className={common.buttonSubmit} type="submit" aria-disabled={pending}>
      <span>등록</span>
      <ExitToAppRoundedIcon />
    </Button>
  );
};

export default RegistForm;
