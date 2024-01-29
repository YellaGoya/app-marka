'use client';

import indexedDb from 'app/_lib/indexed-db';
import { useState, useEffect } from 'react';

const MyDiaries = () => {
  const { readAll } = indexedDb('Diaries');
  const [diaries, setDiaries] = useState([]);

  useEffect(() => {
    getMyDiaries();
  }, []);

  const getMyDiaries = async () => {
    let diaries = [];
    try {
      diaries = await readAll();
      console.log(diaries[0]);
      setDiaries(diaries);
    } catch {
      return new Error('Error: getMyDiaries.');
    }
  };

  return (
    <section>
      {diaries.map((diary) => {
        return (
          <article key={diary.diary_id}>
            <h4>{diary.title}</h4>
            <div dangerouslySetInnerHTML={{ __html: diary.content_html }} />
          </article>
        );
      })}
    </section>
  );
};

export default MyDiaries;
