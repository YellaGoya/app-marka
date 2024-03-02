'use client';

import { useRecoilState } from 'recoil';
import { errorState } from 'lib/recoil';

import Button from 'components/common/button';

import * as global from 'app/global.module.css';
import * as css from './error-handler.module.css';

const ErrorHandler = () => {
  const [error, setError] = useRecoilState(errorState);
  return (
    error && (
      <div className={css.errorHandlerContainer}>
        <h4>{error}</h4>
        <Button
          className={global.textButton}
          onClick={() => {
            setError(null);
          }}
        >
          <span>닫기</span>
        </Button>
      </div>
    )
  );
};

export default ErrorHandler;
