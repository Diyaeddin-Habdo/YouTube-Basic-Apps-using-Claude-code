import React from 'react';
import { WindowMinIcon, WindowMaxIcon, XIcon } from './icons.jsx';

export default function TitleBar() {
  const send = (action) => window.harmonix.windowAction(action);
  return (
    <div className="titlebar">
      <div className="titlebar-brand">
        <span className="brand-dot" />
        <span>Harmonix</span>
      </div>
      <div className="titlebar-actions">
        <button className="tb-btn" onClick={() => send('minimize')} aria-label="Minimize">
          <WindowMinIcon />
        </button>
        <button className="tb-btn" onClick={() => send('maximize')} aria-label="Maximize">
          <WindowMaxIcon />
        </button>
        <button className="tb-btn close" onClick={() => send('minimize-tray')} aria-label="Close to tray">
          <XIcon />
        </button>
      </div>
    </div>
  );
}
