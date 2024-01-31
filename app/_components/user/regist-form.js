'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { putOnWaitingList } from 'app/_lib/action/user';

import { test } from 'app/_lib/action/user';

const RegistForm = () => {
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(putOnWaitingList, initialState);

  return (
    <div>
      <form action={dispatch}>
        <label>
          닉네임:
          <input type="text" name="nickname" />
          <div id="nickname-error" aria-live="polite" aria-atomic="true">
            {state.errors?.nickname && state.errors.nickname.map((error) => <p key={error}>{error}</p>)}
          </div>
        </label>

        <label>
          이메일:
          <input type="email" name="email" />
          <div id="email-error" aria-live="polite" aria-atomic="true">
            {state.errors?.email && state.errors.email.map((error) => <p key={error}>{error}</p>)}
          </div>
        </label>

        <label>
          비밀번호:
          <input type="password" name="password" />
          <div id="password-error" aria-live="polite" aria-atomic="true">
            {state.errors?.password && state.errors.password.map((error) => <p key={error}>{error}</p>)}
          </div>
        </label>

        <label>
          비밀번호 확인:
          <input type="password" name="confirmPassword" />
          <div id="confirmPassword-error" aria-live="polite" aria-atomic="true">
            {state.errors?.confirmPassword && state.errors.confirmPassword.map((error) => <p key={error}>{error}</p>)}
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
    <button type="submit" aria-disabled={pending}>
      Log in
    </button>
  );
};

export default RegistForm;
