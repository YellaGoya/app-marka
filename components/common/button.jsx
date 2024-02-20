/* eslint-disable react/button-has-type */
import clsx from 'clsx';

import css from 'components/common/button.module.css';

const Button = ({ children, onClick, className, selected, disabled, type, ariaDisabled }) => {
  return (
    <button
      type={type || 'button'}
      aria-disabled={ariaDisabled}
      className={clsx(css.button, className ? className : css.buttonBasic, { [css.selected]: selected }, { [css.disabledButton]: disabled })}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
