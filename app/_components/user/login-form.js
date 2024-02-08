'use client';

import { useFormState, useFormStatus } from 'react-dom';

import { authenticate } from 'app/_lib/action/user';
import Button from 'app/_components/common/button';

const LoginForm = ({ backward }) => {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);
  // email, password를 받는 로그인 Form
  return (
    <div>
      <form action={dispatch}>
        <input type="email" name="email" placeholder="email" />
        <input type="password" name="password" placeholder="password" />
        <LoginButton />
      </form>
      <div aria-live="polite" aria-atomic="true">
        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      </div>
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

const LoginButton = () => {
  const { pending } = useFormStatus();

  return (
    <button type="submit" aria-disabled={pending}>
      Log in
    </button>
  );
};

export default LoginForm;
