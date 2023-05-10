import React, { useEffect } from 'react';
import { useModal } from 'hooks';
import { useNavigate } from 'react-router-dom';
import Icon from 'components/Icon';

function IPBlockingModal() {
  const { ModalWrapper, showModal } = useModal({ closeDisabled: true });
  const navigate = useNavigate();

  useEffect(() => {
    showModal();
  }, []);

  const onClickNav = (name: string, path: string) => {
    if (name === 'NPO') {
      window.open(
        'https://npo.manta.network/calamari/sbt?utm_source=Application&utm_campaign=zkBAB&utm_medium=Organic&utm_term=Global&utm_content=MantaPay',
        '_blank',
        'noopener'
      );
      return;
    }
    navigate(path);
  };

  const navs = [
    {
      name: 'NPO',
      path: 'npo'
    },
    {
      name: 'Bridge',
      path: '/calamari/bridge'
    },
    {
      name: '$KMA Staking',
      path: '/calamari/stake'
    }
  ];

  return (
    <ModalWrapper>
      <div className="w-140 bg-fourth -mx-6 -my-4 rounded-lg p-6">
        <div className="text-xl leading-6">
          MANTAPAY IS NOT AVAILABLE IN YOUR LOCATION
        </div>
        <div className="text-sm text-secondary leading-5 my-4">
          It appears that this connecting is from a prohibited region (United
          States, China, Iran, Cuba, North Korea, Syria, Myanmar (Burma), the
          regions of Crimea, Donetsk or Luhansk). If you're using a VPN, try
          disabling it.
        </div>
        {navs.map(({ name, path }) => (
          <button
            key={path}
            onClick={() => onClickNav(name, path)}
            className="mt-6 flex items-center justify-between px-4 border border-solid border-white border-opacity-10 bg-white bg-opacity-5 w-full h-12 cursor-hover text-sm cursor-pointer rounded-lg">
            <span>{name}</span>
            <Icon className="w-2 h-2" name="right" />
          </button>
        ))}
      </div>
    </ModalWrapper>
  );
}

export default IPBlockingModal;
