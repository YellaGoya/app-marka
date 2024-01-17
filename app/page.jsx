import WriteForm from 'app/_components/dirary/write-form';

import css from 'app/page.module.css';

const Home = () => {
  return (
    <main className={css.main}>
      <WriteForm />
    </main>
  );
};

export default Home;
