import { atom } from 'recoil';

export const diariesState = atom({
  key: 'diariesState',
  default: [],
});

export const onEditDiaryIdState = atom({
  key: 'onEditDiaryIdState',
  default: null,
});
