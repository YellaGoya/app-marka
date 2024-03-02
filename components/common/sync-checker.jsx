'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRecoilState } from 'recoil';
import clsx from 'clsx';

import { isSyncedState } from 'lib/recoil';

import * as clientDB from 'lib/indexed-db';
import * as serverDB from 'lib/api/diary';

import * as css from './sync-checker.module.css';

const SyncChecker = () => {
  const { status } = useSession();
  const [isSynced, setIsSynced] = useRecoilState(isSyncedState);
  const [syncProcessing, setSyncProcessing] = useState(false);
  const [syncTransition, setSyncTransition] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && !isSynced) sync();
  }, [status, isSynced]);

  const sync = async () => {
    setSyncProcessing(true);
    setSyncTransition(true);

    const clientHistories = await clientDB.getHistories();
    const serverHistories = await serverDB.getHistories();

    const clientHistoriesMap = clientHistories.reduce((map, history) => {
      map[history.diary_id] = history;
      return map;
    }, {});
    const serverHistoriesMap = serverHistories.reduce((map, history) => {
      history.diary_id = Number(history.diary_id.slice(-13));
      map[history.diary_id] = history;
      return map;
    }, {});

    const needs = {
      server: [],
      client: [],
    };

    clientHistories.forEach((clientHistory) => {
      const serverHistory = serverHistoriesMap[clientHistory.diary_id];

      if (!serverHistory) needs.server.push(clientHistory);
      else if (Number(clientHistory.time) > Number(serverHistory.time)) {
        if (clientHistory.action === 'update') needs.server.push(clientHistory);
        else needs.server.push(clientHistory);
      }
    });

    serverHistories.forEach((serverHistory) => {
      const clientHistory = clientHistoriesMap[serverHistory.diary_id];

      if (!clientHistory) needs.client.push(serverHistory);
      else if (Number(serverHistory.time) > Number(clientHistory.time)) {
        if (serverHistory.action === 'update') needs.client.push(serverHistory);
        else needs.client.push(serverHistory);
      }
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [_, histories] of Object.entries(needs)) {
        for (const history of histories) {
          await dataTransfer(history);
        }
      }

      setIsSynced(true);
    } catch {
      // 될때까지 시도
      sync();
    }

    setSyncTransition(false);
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 300));
    setSyncProcessing(false);
  };

  const dataTransfer = async (history) => {
    const sourceDB = history.user_id ? serverDB : clientDB;
    const targetDB = history.user_id ? clientDB : serverDB;

    if (history.user_id) history.time = Number(history.time);

    if (history.action === 'add' || history.action === 'update') {
      const actionType = history.action === 'add' ? 'addDiary' : 'updateDiary';

      const diary = await sourceDB.readDiary(history.diary_id);

      diary.diary_id = history.diary_id;
      diary.created_at = new Date(diary.created_at).toISOString();
      diary.updated_at = new Date(diary.updated_at).toISOString();

      await targetDB[actionType](diary, history.time);
    }

    if (history.action === 'remove') {
      targetDB.removeDiary(history.diary_id, history.time);
    }
  };

  return syncProcessing && <div className={clsx(css.syncProcessContainer, { [css.show]: syncTransition })}>동기화 중...</div>;
};

export default SyncChecker;
