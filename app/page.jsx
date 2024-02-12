import WriteForm from 'components/dirary/write-form';
import MyDiaries from 'components/dirary/my-diaries';

import global from 'app/globals.module.css';

const Home = () => {
  return (
    <main className={global.main}>
      <WriteForm />
      <MyDiaries />
    </main>
  );
};

export default Home;
