// @ts-nocheck
import NETWORK from 'constants/NetworkConstants';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import OutsideClickHandler from 'react-outside-click-handler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { useSubstrate } from 'contexts/substrateContext';
import classNames from 'classnames';
import { useNavigate, useLocation } from 'react-router-dom';
import { useConfig } from 'contexts/configContext';
import { useTxStatus } from 'contexts/txStatusContext';
import Icon from 'components/Icon';

const ChainDropdownItem = ({ prevSubPath, node, activeNode }) => {
  const selectedNetwork = activeNode.name === node.name;
  const curSubPath = node.path;
  const navigate = useNavigate();
  const location = useLocation();

  ChainDropdownItem.propTypes = {
    prevSubPath: PropTypes.string,
    node: PropTypes.object,
    activeNode: PropTypes.object
  };

  const handleNavClick = (pre, cur) => {
    navigate(`${location.pathname.replace(pre, cur)}`);
  };

  return (
    <div
      onClick={() => handleNavClick(prevSubPath, curSubPath)}
      className="cursor-pointer border border-white-light bg-white bg-opacity-5 rounded-lg py-3 pl-3.5"
      key={node.name}>
      <div className="flex items-center gap-5 w-full">
        <Icon
          name={node.logo || (node.name as string).toLowerCase()}
          className="w-6 h-6"
        />
        <div className="unselectable-text text-white w-32">
          {node.name}&nbsp;
          {node.testnet ? 'Testnet' : 'Network'}
        </div>
        <div className="ml-1">
          {selectedNetwork ? (
            <Icon name={'greenCheck'} className="w-4 h-4" />
          ) : (
            <Icon name={'unfilledCircle'} className="w-4 h-4" />
          )}
        </div>
      </div>
    </div>
  );
};

const ChainSelector = () => {
  const config = useConfig();
  const { socket } = useSubstrate();
  const { txStatus } = useTxStatus();
  const prevSubPath = `/${config.NETWORK_NAME.toLowerCase()}`;

  const nodes = config.NODES;
  const activeNode = nodes.find((node) => node.url === socket);
  const [showNetworkList, setShowNetworkList] = useState(false);

  const disabled = txStatus?.isProcessing();
  const onClickChainSelector = () =>
    !disabled && setShowNetworkList(!showNetworkList);

  return (
    <OutsideClickHandler onOutsideClick={() => setShowNetworkList(false)}>
      <div
        className="relative font-red-hat-mono text-sm"
        onClick={onClickChainSelector}>
        <div
          className={classNames(
            'logo-content flex items-center lg:flex relative cursor-pointer w-56',
            { disabled: disabled }
          )}>
          <div className="logo">
            <Icon
              name={
                activeNode.logo || (activeNode.name as string).toLowerCase()
              }
              className="w-7 h-7"
            />
          </div>
          <div>
            <div className="mb-0 pl-5 unselectable-text text-white">
              {activeNode.name}&nbsp;
              {activeNode.testnet ? 'Testnet' : 'Network'}
            </div>
          </div>
          <div className="text-white ml-4">
            <FontAwesomeIcon icon={showNetworkList ? faAngleUp : faAngleDown} />
          </div>
        </div>
        {showNetworkList && (
          <div
            className={classNames(
              'unselectable-text flex flex-col w-68 gap-4 bg-fifth rounded-lg p-4',
              'absolute left-0 top-16 z-50 border border-white-light font-light text-secondary'
            )}>
            <div>Select a network</div>
            {nodes.map((node) => (
              <ChainDropdownItem
                key={node.name}
                node={node}
                activeNode={activeNode}
                prevSubPath={prevSubPath}
              />
            ))}
          </div>
        )}
      </div>
    </OutsideClickHandler>
  );
};

export default ChainSelector;
