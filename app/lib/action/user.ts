'use server';

import pool from '@/app/lib/api/connection-pool';

import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import bcrypt from 'bcrypt';

import { signIn } from '@/app/lib/auth';
import { Waiting } from '@/app/lib/type-def';

export const authenticate = async (prevState: string | undefined, formData: FormData) => {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }

    throw error;
  }
};

const waitingSchema = z
  .object({
    nickname: z.string().min(2, '닉네임은 2글자 이상이어야 합니다.'),
    email: z.string().email('유효한 이메일을 입력해주세요.'),
    password: z.string().min(10, '비밀번호는 10자 이상이어야 합니다.'),
    confirmPassword: z.string(),
  })
  .refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
    message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

export const putOnWaitingList = async (prevState: Waiting, formData: FormData) => {
  const validatedFields = waitingSchema.safeParse({
    nickname: formData.get('nickname'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Regist.',
    };
  }

  const { nickname, email, password } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);
  const date = new Date().toISOString().split('T')[0];

  const conn = await pool.connect();

  try {
    await conn.query(
      `
    INSERT INTO waiting (nickname, email, password, listed_at)
    VALUES ($1, $2, $3, $4)
    `,
      [nickname, email, hashedPassword, date],
    );
  } catch (error) {
    return { message: 'Database Error: Failed to Regist.' };
  } finally {
    conn.release();
    redirect('/');
  }
};
