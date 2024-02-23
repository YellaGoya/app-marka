import Greeting from 'components/user/greeting';
import Options from 'components/user/options';
import WaitingConfirm from 'components/user/waiting-confirm';

const Setting = () => {
  return (
    <>
      <Options />
      <Greeting />
      <WaitingConfirm />
    </>
  );
};

export default Setting;
