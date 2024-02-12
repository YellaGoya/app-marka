'use client';

import { useState, useEffect, forwardRef } from 'react';

import ReactDOM from 'react-dom';

import css from 'components/dirary/slate-components.module.css';
import clsx from 'clsx';

export const Button = forwardRef(({ className, active, reversed, ...props }, ref) => (
  <span {...props} ref={ref} className={clsx(className, css.button, reversed ? css.aaa : active ? css.black : css.ccc)} />
));

export const Icon = forwardRef(({ className, ...props }, ref) => <span {...props} ref={ref} className={clsx(className, css.icon)} />);

export const Menu = forwardRef(({ className, ...props }, ref) => (
  <div {...props} ref={ref} data-test-id="menu" className={clsx(className, css.menu)} />
));

export const Portal = ({ children }) => {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  if (isBrowser) {
    return ReactDOM.createPortal(children, document.body);
  }

  return null;
};
