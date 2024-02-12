'use client';

import { useFormState, useFormStatus } from 'react-dom';

import { authenticate } from 'lib/action/user';
import Button from 'components/common/button';
import { useEffect } from 'react';
// import { resourceLimits } from 'worker_threads';

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
      <form action={dispatch}>
        <input type="text" name="tag" placeholder="tag" />
        <input type="password" name="password" placeholder="password" />
        <LoginButton />
      </form>
      <div aria-live="polite" aria-atomic="true">
        {result.error && <p className="text-sm text-red-500">{result.error}</p>}
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
