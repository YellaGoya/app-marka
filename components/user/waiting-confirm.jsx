'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

import { getWaitingList, approveUser } from 'lib/api/user';

const WaitingConfirm = () => {
  const { data: session, status } = useSession();

  const [isAdmin, setIsAdmin] = useState(false);
  const [waitingList, setWaitingList] = useState([]);

  useEffect(() => {
    if (status === 'authenticated' && session.user.tag === 'roscoe') {
      setIsAdmin(true);
      getWaitingList().then((data) => {
        setWaitingList(data);
      });
    } else {
      setIsAdmin(false);
    }
  }, [status]);

  return (
    isAdmin && (
      <section>
        <ul>
          {waitingList &&
            waitingList.map((user) => {
              return (
                <li
                  key={user.list_id}
                  onClick={() => {
                    approveUser(user.list_id);
                  }}
                >
                  {user.tag} {user.listed_at.toString()}
                </li>
              );
            })}
        </ul>
      </section>
    )
  );
};

export default WaitingConfirm;
