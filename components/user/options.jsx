'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';

import global from 'app/globals.module.css';
import common from './common.module.css';

const Options = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  return (
    <div className={clsx(global.cardContainer, { [global.loaded]: isLoaded })} style={{ marginBottom: '24px' }}>
      <h1 className={common.userTitle}>에디터 마카 색상 변경</h1>
    </div>
  );
};

export default Options;
