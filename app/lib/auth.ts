/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import PostgresAdapter from '@auth/pg-adapter';
import bcrypt from 'bcrypt';
import pool from '@/app/lib/api/connection-pool';

import { userByEmail } from '@/app/lib/api/user';
import { authConfig } from '@/app/lib/auth.config';

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PostgresAdapter(pool),
  providers: [
    Credentials({
      async authorize({ email, password }: any) {
        const user = await userByEmail(email);

        if (user.length === 0) return null;
        const passwordsMatch = await bcrypt.compare(password, user[0].password);
        if (passwordsMatch) return user[0] as any;
      },
    }),
  ],
});
