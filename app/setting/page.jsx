import Greeting from 'components/user/greeting';
import Options from 'components/user/options';
import WaitingConfirm from 'components/user/waiting-confirm';

import global from 'app/globals.module.css';

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
