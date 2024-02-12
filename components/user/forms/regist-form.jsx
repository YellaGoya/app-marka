'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { putOnWaitingList } from 'lib/action/user';
import { test } from 'lib/action/user';
import Button from 'components/common/button';
import { useEffect } from 'react';

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
      <form action={dispatch}>
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

      <Button
        onClick={() => {
          backward();
        }}
      >
        뒤로
      </Button>
    </div>
  );
};

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button type="submit" aria-disabled={pending}>
      Log in
    </button>
  );
};

export default RegistForm;
