'use client';

import { useState, useEffect, forwardRef } from 'react';

import ReactDOM from 'react-dom';

import css from 'components/dirary/slate-components.module.css';
import clsx from 'clsx';

export const Button = forwardRef(({ onEdit, ...props }, ref) => (
  <span {...props} ref={ref} className={clsx(css.button, onEdit ? css.aaa : css.bbb)} />
));

export const Icon = forwardRef(({ ...props }, ref) => <span {...props} ref={ref} className={clsx(css.icon)} />);

export const Menu = forwardRef(({ ...props }, ref) => <div {...props} ref={ref} data-test-id="menu" className={clsx(css.menu)} />);

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
