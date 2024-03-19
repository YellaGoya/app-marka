'use client';

import { SessionProvider } from 'next-auth/react';

const AuthProvider = ({ children }) => {
  return <SessionProvider basePath="/app-marka/api/auth">{children}</SessionProvider>;
};

export default AuthProvider;
