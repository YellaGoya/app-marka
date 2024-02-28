import { gothicA1 } from 'app/fonts';
import Header from 'components/header';
import RecoilProvider from 'contexts/recoil-provider';
import AuthProvider from 'contexts/auth-provider';

import 'app/global.css';
import global from 'app/global.module.css';
import SyncChecker from 'components/common/syncChecker';

export const metadata = {
  title: 'Marka',
  description: 'Diray and Todo.',
};

const RootLayout = ({ children }) => {
  return (
    <html lang="kr" className={gothicA1.className}>
      {/* <html lang="kr" className={`${hyRGothic.variable} ${lusitana.variable}`}> */}
      <body>
        <AuthProvider>
          <RecoilProvider>
            <Header />
            <main className={global.main}>
              {children}
              <SyncChecker />
            </main>
          </RecoilProvider>
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
