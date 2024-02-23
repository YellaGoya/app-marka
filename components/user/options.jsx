'use client';

import { useState, useEffect } from 'react';
import { SliderPicker } from 'react-color';
import clsx from 'clsx';

import css from './options.module.css';
import global from 'app/globals.module.css';
import common from './common.module.css';

const Options = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [color, setColor] = useState({ hex: '#dddddd' });

  useEffect(() => {
    setIsLoaded(true);

    const codeBgColor = localStorage.getItem('code-bg-color');
    if (codeBgColor) setColor(codeBgColor);
  }, []);

  const handleChange = (color) => {
    setColor(color);
    const hexColor = color.hex.replace('#', '');

    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    const codeColor = yiq >= 128 ? '#000000' : '#ffffff';

    localStorage.setItem('code-color', codeColor);
    localStorage.setItem('code-bg-color', color.hex);

    document.documentElement.style.setProperty('--code-color', codeColor);
    document.documentElement.style.setProperty('--code-bg-color', color.hex);
  };

  const backToDefault = () => {
    setColor('#dddddd');

    localStorage.removeItem('code-color');
    localStorage.removeItem('code-bg-color');

    document.documentElement.style.setProperty('--code-color', '#000000');
    document.documentElement.style.setProperty('--code-bg-color', '#dddddd');
  };

  return (
    <div className={clsx(global.cardContainer, { [global.loaded]: isLoaded })} style={{ marginBottom: '24px' }}>
      <h1 className={common.userTitle}>
        <span>에디터 마카</span>&nbsp;색상 변경
      </h1>
      <SliderPicker className={css.sliderContainer} color={color} onChange={handleChange} />
      <code className={css.code}>(미리보기) 나랏말싸미 둥귁에 달아 ···</code>
      <code className={clsx(css.code, css.default)} onClick={backToDefault}>
        (기본) #dddddd
      </code>
    </div>
  );
};

export default Options;
