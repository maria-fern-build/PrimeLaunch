import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { TokenCreationForm } from './TokenCreationForm';
import { TokenList } from './TokenList';
import '../styles/PrimeLaunchApp.css';


export function PrimeLaunchApp() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((current) => current + 1);

  return (
    <div className="launchpad-shell">
      <div className="launchpad-content">
        <section className="launchpad-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <h1>PrimeLaunch Studio</h1>
              <p>
                Deploy ERC7984-compliant tokens with a single click. Every deployment mints 10,000,000,000
                confidential units to the creator and enables free minting for your community.
              </p>
            </div>
            <ConnectButton showBalance={false} label="Connect" />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <Badge label="ERC7984" description="Fully homomorphic token standard" />
            <Badge label="Default supply" description="10,000,000,000 units" />
            <Badge label="Freemint" description="Anyone can mint more tokens" />
          </div>
        </section>


          <div className="warning-state" style={{ marginTop: '1rem' }}>
            Update <code>FACTORY_ADDRESS</code> in <code>src/config/contracts.ts</code> once the factory is deployed on
            Sepolia.
          </div>


        <div className="launchpad-grid">
          <TokenCreationForm onCreated={handleRefresh} />
          <div className="panel-card">
            <h2>Launch checklist</h2>
            <ul style={{ paddingLeft: '1.1rem', color: '#475569', lineHeight: 1.6 }}>
              <li>Choose a unique name and symbol for your confidential token.</li>
              <li>The factory mints 10B units to the creator wallet instantly.</li>
              <li>Share the token address so wallets can interact with freemint.</li>
              <li>Monitor the token list below; it auto-refreshes from Sepolia.</li>
            </ul>
          </div>
        </div>

        <TokenList refreshKey={refreshKey} />
      </div>
    </div>
  );
}

type BadgeProps = {
  label: string;
  description: string;
};

function Badge({ label, description }: BadgeProps) {
  return (
    <div
      style={{
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '999px',
        padding: '0.4rem 0.95rem',
        fontSize: '0.9rem',
      }}
    >
      <strong style={{ marginRight: '0.4rem' }}>{label}</strong>
      <span style={{ color: '#cbd5f5' }}>{description}</span>
    </div>
  );
}
