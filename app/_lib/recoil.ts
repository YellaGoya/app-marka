import { atom } from 'recoil';

export const todoListState = atom({
  key: 'todoListState',
  default: { extracted: [], manual: [] },
});

export const slateIsEmptyState = atom({
  key: 'slateIsEmptyState',
  default: true,
});

export const diariesState = atom({
  key: 'diariesState',
  default: [],
});
