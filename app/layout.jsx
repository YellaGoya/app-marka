import { jua } from 'app/fonts';
import Header from 'components/header';
import RecoilProvider from 'contexts/recoil-provider';
import AuthProvider from 'contexts/auth-provider';

import 'app/globals.css';
import global from 'app/globals.module.css';

export const metadata = {
  title: 'Marka',
  description: 'Diray and Todo.',
};

const RootLayout = ({ children }) => {
  return (
    <html lang="kr" className={jua.className}>
      {/* <html lang="kr" className={`${hyRGothic.variable} ${lusitana.variable}`}> */}
      <body>
        <Header />
        <AuthProvider>
          <RecoilProvider>
            <main className={global.main}>{children}</main>
          </RecoilProvider>
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
