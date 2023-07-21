// @ts-nocheck
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Icon from 'components/Icon';
import { useConfig } from 'contexts/configContext';
import PropTypes from 'prop-types';
import { useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';

const MenuItem = ({ link, name, icon }) => (
  <a
    className="flex items-center justify-between text-sm p-1.5 font-mono font-medium cursor-pointer hover:font-bold  hover:bg-green-light-half rounded  px-3"
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
    MAINNET_GUIDE_URL: 'https://docs.manta.network/docs/Introduction',
    MAINNET_BUG_REPORT: 'https://discord.gg/PRDBTChSsF'
  };

  const DotMenuContent = () => (
    <div className="w-60 flex-column flex-grow mt-3 bg-fifth rounded-lg gap-y-4 py-4 px-1 absolute right-0 top-full z-50 border border-white-light">
      {/* {theme === themeType.Dark ? <ChangeThemeMenuItem theme={themeType.Light} setTheme={setTheme} name={'Light Mode'} icon={faSun} /> : <ChangeThemeMenuItem theme={themeType.Dark} setTheme={setTheme} name={'Dark Mode'} icon={faMoon} />} */}
      {config.NETWORK_NAME === 'Calamari' ? (
        <MenuItem
          link={config.CALAMARI_URL}
          name={'Calamari Website'}
          icon="CalamariWebsite"
        />
      ) : (
        <MenuItem
          link={config.MANTA_URL}
          name={'Manta Website'}
          icon="MantaWebsite"
        />
      )}

      <MenuItem link={config.TWITTER_URL} name={'Twitter'} icon="Twitter" />
      <MenuItem link={links.DISCORD_URL} name={'Discord'} icon="Discord" />
      <MenuItem link={links.TELEGRAM_URL} name={'Telegram'} icon="Telegram" />
      <MenuItem link={links.MEDIUM_URL} name={'Medium'} icon="Medium" />
      <MenuItem link={links.MAINNET_GUIDE_URL} name={'Docs'} icon="Docs" />
      <MenuItem
        link={links.MAINNET_BUG_REPORT}
        name={'Bug Report'}
        icon="BugReport"
      />
    </div>
  );

  return (
    <div className="relative">
      <OutsideClickHandler onOutsideClick={() => setIsOpen(false)}>
        <div
          className="bg-fifth flex gap-3 px-4 py-2.5 font-black border border-white-light cursor-pointer rounded-xl"
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
