'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

import * as clientDB from 'lib/indexed-db';
import * as serverDB from 'lib/api/diary';

const SyncChecker = () => {
  const { status } = useSession();
  useEffect(() => {
    console.log(status);
    if (status === 'authenticated') sync();
  }, [status]);

  const sync = async () => {
    const clientHistories = await clientDB.getHistories();
    const serverHistories = await serverDB.getHistories();

    console.log(serverHistories);

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
      server: { add: [], update: [], remove: [] },
      client: { add: [], update: [], remove: [] },
    };

    clientHistories.forEach((clientHistory) => {
      const serverHistory = serverHistoriesMap[clientHistory.diary_id];

      if (!serverHistory) needs.server.add.push(clientHistory);
      else if (Number(clientHistory.time) > Number(serverHistory.time)) {
        if (clientHistory.action === 'update') needs.server.update.push(clientHistory);
        else needs.server.remove.push(clientHistory);
      }
    });

    serverHistories.forEach((serverHistory) => {
      const clientHistory = clientHistoriesMap[serverHistory.diary_id];

      if (!clientHistory) needs.client.add.push(serverHistory);
      else if (Number(serverHistory.time) > Number(clientHistory.time)) {
        if (serverHistory.action === 'update') needs.client.update.push(serverHistory);
        else needs.client.remove.push(serverHistory);
      }
    });

    for (const [side, actions] of Object.entries(needs)) {
      for (const [action, histories] of Object.entries(actions)) {
        console.log(`${side}Need${action.charAt(0).toUpperCase() + action.slice(1)}`, histories);
      }
    }
  };

  return <div>syncChecker</div>;
};

export default SyncChecker;
