import { atom } from 'recoil';

export const diariesState = atom({
  key: 'diariesState',
  default: [],
});

export const onEditDiaryIdState = atom({
  key: 'onEditDiaryIdState',
  default: null,
});

export const codeColorState = atom({
  key: 'codeColorState',
  default: { default: '#ddd', user: null },
});

export const followingCountState = atom({
  key: 'followingCountState',
  default: '',
});
