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

        if (!user) return null;
        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (passwordsMatch) return user as any;
      },
    }),
  ],
});
