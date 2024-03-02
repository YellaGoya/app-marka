'use client';

import { useRecoilState } from 'recoil';
import { errorState } from 'lib/recoil';

import Button from 'components/common/button';

import KeyboardBackspaceRoundedIcon from '@mui/icons-material/KeyboardBackspaceRounded';

import * as global from 'app/global.module.css';
import * as css from './error-handler.module.css';

const ErrorHandler = () => {
  const [error, setError] = useRecoilState(errorState);
  return (
    error && (
      <div className={css.errorHandlerContainer}>
        {error}
        <Button
          className={global.textButton}
          onClick={() => {
            setError(null);
          }}
        >
          <span>닫기</span>
          <KeyboardBackspaceRoundedIcon />
        </Button>
      </div>
    )
  );
};

export default ErrorHandler;
