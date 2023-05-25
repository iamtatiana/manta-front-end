// @ts-nocheck
import {
  faEllipsis
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Icon from 'components/Icon';
import { useConfig } from 'contexts/configContext';
import { ThemeContext } from 'contexts/themeContext';
import PropTypes from 'prop-types';
import { useContext, useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';

const MenuItem = ({ link, name, icon }) => (
  <a
    className="flex items-center justify-between text-sm p-1.5 font-mono font-medium cursor-pointer hover:font-bold hover:bg-green-light-half rounded  px-3"
    href={link}
    target="_blank"
    rel="noopener noreferrer">
    <Icon
      name={icon}
      className="w-6 h-6 items-center text-xl text-black hover:text-link dark:text-white dark:hover:text-link"
    />
    <div className="font-red-hat-mono h-6 text-black dark:text-white ">
      {name}
    </div>
  </a>
);

MenuItem.propTypes = {
  link: PropTypes.string,
  name: PropTypes.string,
  icon: PropTypes.any
};

const ChangeThemeMenuItem = ({ theme, setTheme, name, icon }) => (
  <div
    className="flex items-center justify-between text-sm p-1.5 font-mono font-medium cursor-pointer hover:font-bold"
    onClick={() => {
      setTheme(theme);
    }}>
    <div className="w-10/12 h-5 text-black hover:text-link dark:text-white dark:hover:text-link">
      {name}
    </div>
    <FontAwesomeIcon
      icon={icon}
      className="items-center w-4 h-5 text-xl text-white dark:hover:text-link"
    />
  </div>
);

ChangeThemeMenuItem.propTypes = {
  theme: PropTypes.string,
  setTheme: PropTypes.func,
  name: PropTypes.string,
  icon: PropTypes.any
};

const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const config = useConfig();

  const links = {
    DISCORD_URL: 'https://discord.gg/PRDBTChSsF',
    TELEGRAM_URL: 'https://t.me/mantanetworkofficial',
    MEDIUM_URL: 'https://mantanetwork.medium.com/',
    CALAMARI_GUIDE_URL: 'https://docs.manta.network/docs/Introduction',
    CALAMARI_BUG_REPORT: 'https://discord.gg/PRDBTChSsF',
    DOLPHIN_GUIDE_URL: 'https://docs.manta.network/docs/Introduction',
    DOLPHIN_BUG_REPORT:
      'https://docs.google.com/forms/d/e/1FAIpQLScAIuDuztZoKHOlpJNC-9FlVdYJpMBLcztQCvT3IQ0FGe7GaA/viewform',
    DOLPHIN_FAUCET_URL:
      'https://docs.manta.network/docs/guides/MantaPay#get-testnet-tokens'
  };

  const DotMenuContent = () => (
    <div className="w-60 flex-column flex-grow mt-3 bg-fifth rounded-lg gap-y-4 py-4 px-1 absolute right-0 top-full z-50 border border-white-light">
      <MenuItem
        link={config.CALAMARI_URL}
        name={'Calamari Website'}
        icon="CalamariWebsite"
      />
      <MenuItem link={config.TWITTER_URL} name={'Twitter'} icon="Twitter" />
      <MenuItem link={links.DISCORD_URL} name={'Discord'} icon="Discord" />
      <MenuItem link={links.TELEGRAM_URL} name={'Telegram'} icon="Telegram" />
      <MenuItem link={links.MEDIUM_URL} name={'Medium'} icon="Medium" />
      {config.NETWORK_NAME === 'Dolphin' ? (
        <MenuItem link={links.DOLPHIN_GUIDE_URL} name={'Docs'} icon="Docs" />
      ) : null}
      {config.NETWORK_NAME === 'Dolphin' ? (
        <MenuItem
          link={links.DOLPHIN_BUG_REPORT}
          name={'Bug Report'}
          icon="BugReport"
        />
      ) : null}
      {config.NETWORK_NAME === 'Calamari' ? (
        <MenuItem link={links.CALAMARI_GUIDE_URL} name={'Docs'} icon="Docs" />
      ) : null}
      {config.NETWORK_NAME === 'Calamari' ? (
        <MenuItem
          link={links.CALAMARI_BUG_REPORT}
          name={'Bug Report'}
          icon="BugReport"
        />
      ) : null}
    </div>
  );

  return (
    <div className="relative">
      <OutsideClickHandler onOutsideClick={() => setIsOpen(false)}>
        <div
          className="bg-semitransparent flex gap-3 px-3 py-2.25 font-black border border-white-light cursor-pointer rounded-lg"
          onClick={() => {
            isOpen ? setIsOpen(false) : setIsOpen(true);
          }}>
          <FontAwesomeIcon icon={faEllipsis} className="text-xl text-white" />
        </div>
        {isOpen && <DotMenuContent />}
      </OutsideClickHandler>
    </div>
  );
};

export default Menu;
