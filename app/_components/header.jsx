import Link from 'next/link';

import GiteRoundedIcon from '@mui/icons-material/GiteRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import css from 'app/_components/header.module.css';

const Header = () => {
  return (
    <header className={css.header}>
      <nav className={css.nav}>
        <Link href="/">
          <GiteRoundedIcon />
        </Link>
        <Link href="/setting/login">
          <SettingsRoundedIcon />
        </Link>
      </nav>
    </header>
  );
};

export default Header;
