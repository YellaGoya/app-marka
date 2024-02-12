import Greeting from 'components/user/greeting';
import Options from 'components/user/options';
import WaitingConfirm from 'components/user/waiting-confirm';

const Setting = () => {
  return (
    <main>
      <Options />
      <Greeting />
      <WaitingConfirm />
    </main>
  );
};

export default Setting;
