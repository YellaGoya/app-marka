'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

import GiteRoundedIcon from '@mui/icons-material/GiteRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import css from 'components/header.module.css';

const Header = () => {
  const pathname = usePathname();

  return (
    <header className={css.header}>
      <nav className={css.nav}>
        <Link href="/" className={clsx({ [css.selectedLink]: pathname === '/' })}>
          <GiteRoundedIcon />
        </Link>
        <Link href="/setting" className={clsx({ [css.selectedLink]: pathname === '/setting' })}>
          <SettingsRoundedIcon />
        </Link>
      </nav>
    </header>
  );
};

export default Header;
