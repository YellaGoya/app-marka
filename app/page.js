import * as stylex from '@stylexjs/stylex';
import styles from './page.style.js';

import KeyHandle from '@/app/_components/key/keyHandle.js';

const Home = () => {
  return (
    <main {...stylex.props(styles.main)}>
      <div>key-event-viewer</div>
      <KeyHandle />
    </main>
  );
};

export default Home;
