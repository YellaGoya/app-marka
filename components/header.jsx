'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

import GiteRoundedIcon from '@mui/icons-material/GiteRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import css from 'components/header.module.css';
import { useEffect } from 'react';

const Header = () => {
  const { status } = useSession();

  // 로컬 스토리지에 저장된 code-bg-color 값을 가져온다.
  // 존재하면 그 색을 전역 변수로 설정한다.
  useEffect(() => {
    const codeColor = localStorage.getItem('code-color');
    const codeBgColor = localStorage.getItem('code-bg-color');
    if (codeColor && codeBgColor) {
      document.documentElement.style.setProperty('--code-color', codeColor);
      document.documentElement.style.setProperty('--code-bg-color', codeBgColor);
    }
  }, []);

  const pathname = usePathname();

  return (
    <header className={css.header}>
      <nav className={css.nav}>
        <Link href="/" className={clsx({ [css.selectedLink]: pathname === '/' })}>
          <GiteRoundedIcon />
        </Link>
        {status === 'authenticated' && (
          <Link href="/explore" className={clsx({ [css.selectedLink]: pathname === '/explore' })}>
            <AutoAwesomeRoundedIcon />
          </Link>
        )}
        <Link href="/setting" className={clsx({ [css.selectedLink]: pathname === '/setting' })}>
          <SettingsRoundedIcon />
        </Link>
      </nav>
    </header>
  );
};

export default Header;
