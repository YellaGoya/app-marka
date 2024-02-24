/* eslint-disable react/button-has-type */
import { forwardRef } from 'react';
import clsx from 'clsx';

import css from 'components/common/button.module.css';

const Button = forwardRef(({ children, onClick, className, selected, disabled, type, ariaDisabled, style }, ref) => {
  return (
    <button
      ref={ref}
      type={type || 'button'}
      aria-disabled={ariaDisabled}
      className={clsx(css.button, className ? className : css.buttonBasic, { [css.selected]: selected }, { [css.disabledButton]: disabled })}
      style={style}
      onClick={onClick}
    >
      {children}
    </button>
  );
});

export default Button;
