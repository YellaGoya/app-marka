import Header from 'app/_components/header';
import { lusitana, notoSerifKorean } from 'app/fonts';

import 'app/globals.css';
import css from 'app/layout.module.css';

export const metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

const RootLayout = ({ children }) => {
  return (
    <html lang="kr" className={`${lusitana.variable} ${notoSerifKorean.variable}`}>
      <body className={css.body}>
        <Header />
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
