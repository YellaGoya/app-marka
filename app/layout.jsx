import { jua } from 'app/fonts';
import Header from 'app/_components/header';
import RecoilProvider from 'app/_components/recoil-provider';

import 'app/globals.css';
import css from 'app/layout.module.css';

export const metadata = {
  title: 'Marka',
  description: 'Diray and Todo.',
};

const RootLayout = ({ children }) => {
  return (
    <html lang="kr" className={jua.className}>
      {/* <html lang="kr" className={`${hyRGothic.variable} ${lusitana.variable}`}> */}
      <body className={css.body}>
        <Header />
        <RecoilProvider>{children}</RecoilProvider>
      </body>
    </html>
  );
};

export default RootLayout;
