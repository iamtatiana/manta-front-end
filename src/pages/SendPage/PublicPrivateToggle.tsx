// @ts-nocheck
import React from 'react';
import classNames from 'classnames';
import { useTxStatus } from 'contexts/txStatusContext';
import PropTypes from 'prop-types';
import Icon from 'components/Icon';

const PublicPrivateToggle = ({ isPrivate, onToggle, prefix }) => {
  const { txStatus } = useTxStatus();
  const disabled = txStatus?.isProcessing();

  const onClick = () => {
    !disabled && onToggle();
  };

  let buttonId;
  if (isPrivate) {
    buttonId = `${prefix}PrivateTogglePublic`;
  } else {
    buttonId = `${prefix}PublicTogglePrivate`;
  }

  return (
    <>
      <div
        id={buttonId}
        onClick={onClick}
        className={classNames(
          'flex cursor-pointer private-public-toggle-hover unselectable-text',
          'rounded-full bg-private-public-toggle border border-public-private-toggle text-white py-0.5',
          { disabled: disabled }
        )}>
        {isPrivate ? (
          <div className="flex flex-row w-26 justify-center items-center text-xss">
            <div>
              <div className="flex pl-0.5 gap-2 items-center justify-start w-16">
                <Icon name="lock" className="w-2.5 h-2.5" />
                <div>Private</div>
              </div>
            </div>
            <Icon name="upDownArrow" className="ml-1 w-3 h-3" fill="white"/>
          </div>
        ) : (
          <div className="flex flex-row w-26 justify-center items-center text-xss">
            <div className="flex pl-0.5 gap-2 items-center justify-start w-16">
              <Icon name="internet" className="w-2.5 h-2.5" />
              <div>Public</div>
            </div>
            <Icon name="upDownArrow" className="ml-1 w-3 h-3" fill="white"/>
          </div>
        )}

      </div>
    </>
  );
};

PublicPrivateToggle.propTypes = {
  isPrivate: PropTypes.bool,
  onToggle: PropTypes.func,
  label: PropTypes.string,
  prefix: PropTypes.string
};

export default PublicPrivateToggle;
