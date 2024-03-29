import { gothicA1 } from 'app/fonts';
import Header from 'components/header';
import RecoilProvider from 'contexts/recoil-provider';
import AuthProvider from 'contexts/auth-provider';

import 'app/global.css';
import global from 'app/global.module.css';
import SyncChecker from 'components/common/sync-checker';
import ErrorHandler from 'components/common/error-handler';

export const metadata = {
  applicationName: 'Marka',
  title: 'Marka',
  description: 'Diray and Todo.',
  manifest: '/app-marka/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Marka',
  },
  // openGraph: {
  //   type: 'website',
  //   siteName: 'Marka',
  //   title: {
  //     default: 'Marka',
  //   },
  //   description: 'Diray and Todo.',
  // },
  // twitter: {
  //   card: 'summary',
  //   title: {
  //     default: 'Marka',
  //   },
  //   description: 'Diray and Todo.',
  // },
};

const RootLayout = ({ children }) => {
  return (
    <html lang="kr" className={gothicA1.className}>
      <body>
        <AuthProvider>
          <RecoilProvider>
            <Header />
            <SyncChecker />
            <main className={global.main}>{children}</main>
            <ErrorHandler />
          </RecoilProvider>
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
