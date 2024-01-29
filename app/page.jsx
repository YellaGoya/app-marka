import WriteForm from 'app/_components/dirary/write-form';
import MyDiaries from 'app/_components/dirary/my-diaries';

import css from 'app/page.module.css';

const Home = () => {
  return (
    <main className={css.main}>
      <WriteForm />
      <MyDiaries />
    </main>
  );
};

export default Home;
