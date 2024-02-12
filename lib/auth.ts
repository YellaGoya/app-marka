/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';

import { getUser } from 'lib/api/user';
import { authConfig } from 'lib/auth.config';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize({ tag, password }: any) {
        const user = await getUser(tag);

        if (user.length === 0) return null;
        const passwordsMatch = await bcrypt.compare(password, user[0].password);

        if (passwordsMatch) return user[0] as any;
      },
    }),
  ],
});
