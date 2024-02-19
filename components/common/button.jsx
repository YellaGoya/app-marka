import clsx from 'clsx';

import { gothicA1 } from 'app/fonts';
import global from 'app/globals.module.css';

const Button = ({ children, onClick, className, selected, disabled }) => {
  return (
    <button
      type="button"
      className={clsx(
        global.button,
        className ? className : global.buttonBasic,
        { [global.selected]: selected },
        { [global.disabledButton]: disabled },
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
