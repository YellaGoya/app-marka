'use server';

import useSQL from 'lib/api/connection-pool';

import { AuthError } from 'next-auth';
import { headers } from 'next/headers';
import { z } from 'zod';
import bcrypt from 'bcrypt';

import { signIn } from 'lib/auth';
import { Waiting } from 'lib/type-def';
import { PoolClient } from 'pg';

import { checkUserByTag, checkUserByEmail } from 'lib/api/user';

export const authenticate = async (prevState: string | undefined, formData: FormData) => {
  try {
    const loginValuesObj = Object.fromEntries(formData.entries());

    await signIn('credentials', { ...loginValuesObj, redirect: false });

    return { success: true };
  } catch (error) {
    console.log(error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: '( ! ) 잘못된 태그 정보 입니다.' };
        default:
          return { success: false, error: '( ! ) 연결이 불안정합니다. 다시 시도 해주세요.' };
      }
    }

    return { success: false, error: '( ! ) 연결이 불안정합니다. 다시 시도 해주세요.' };
  }
};

const waitingSchema = z
  .object({
    tag: z.string().min(2, '( ! ) 닉네임은 2글자 이상이어야 합니다.'),
    email: z.string().email('( ! ) 유효한 이메일을 입력해주세요.'),
    password: z.string().min(10, '( ! ) 비밀번호는 10자 이상이어야 합니다.'),
    confirmPassword: z.string(),
  })
  .refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
    message: '( ! ) 비밀번호와 비밀번호 확인이 일치하지 않습니다.',
    path: ['confirmPassword'],
  })
  .refine(
    async (data: { tag: string }) => {
      const isDuplicated = await checkUserByTag(data.tag);
      return !isDuplicated;
    },
    {
      message: '( ! ) 이미 등록된 태그입니다.',
      path: ['tag'],
    },
  )
  .refine(
    async (data: { email: string }) => {
      const isDuplicated = await checkUserByEmail(data.email);
      return !isDuplicated;
    },
    {
      message: '( ! ) 이미 등록된 이메일입니다.',
      path: ['email'],
    },
  );

export const putOnWaitingList = async (prevState: Waiting, formData: FormData) => {
  try {
    const validatedFields = await waitingSchema.safeParseAsync({
      tag: formData.get('tag'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Regist.',
      };
    }

    const { tag, email, password } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const date = new Date();
    const time = date.toISOString();

    return useSQL((conn: PoolClient) => {
      return conn.query(
        `
      INSERT INTO waiting (tag, email, password, listed_at)
      VALUES ($1, $2, $3, $4)
      `,
        [tag, email, hashedPassword, time],
      );
    }).then(() => {
      return { ...prevState, success: true };
    });
  } catch (error) {
    return { success: false, message: 'Error : Failed to regist.' };
  }
};

export const test = async () => {
  try {
    const forwardedFor = headers().get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(':')[0] : headers().get('x-real-ip');

    console.log('hello :', ip);
    // res.status(200).json({ ip });
  } catch {
    // res.status(429).json({ error: 'Too Many Requests' });
    console.log('strike');
  }
};
