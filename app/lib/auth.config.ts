import { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/auth/login',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isOnDashboard = nextUrl.pathname.startsWith('/auth/regist');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return true; // Redirect unauthenticated users to login page
      }

      if (isLoggedIn) {
        return Response.redirect(new URL('/auth/regist', nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
