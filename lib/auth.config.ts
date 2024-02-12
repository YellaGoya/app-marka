/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (token?.email === user?.email) {
        token.tag = (user as any).tag;
        token.id = (user as any).user_id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).tag = token.tag;
        (session.user as any).id = token.id;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
// export const authConfig = {
//   pages: {
//     signIn: '/auth/login',
//   },
//   providers: [],
//   callbacks: {
//     authorized({ auth, request: { nextUrl } }) {
//       // const isOnDashboard = nextUrl.pathname.startsWith('/auth/regist');

//       // if (isOnDashboard) {
//       //   if (isLoggedIn) return true;
//       //   return true; // Redirect unauthenticated users to login page
//       // }

//       // if (isLoggedIn) {
//       //   return Response.redirect(new URL('/auth/regist', nextUrl));
//       // }

//       return true;
//     },
//   },
// } satisfies NextAuthConfig;
