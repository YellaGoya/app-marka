import { Lusitana, Noto_Serif_KR } from 'next/font/google';

export const lusitana = Lusitana({
  subsets: ['latin'],
  variable: '--font-lusitana',
  weight: '400',
});

export const notoSerifKorean = Noto_Serif_KR({
  preload: false,
  variable: '--font-nskr',
  weight: '300',
});
