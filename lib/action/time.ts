'use server';

export const getServerTime = async () => {
  const serverTime = new Date().toISOString();
  return serverTime;
};
