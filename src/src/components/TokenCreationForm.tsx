import {  useState } from 'react';
import type { FormEvent } from 'react';
import { useAccount } from 'wagmi';
import { Contract } from 'ethers';

import { useEthersSigner } from '../hooks/useEthersSigner';
import { DEFAULT_SUPPLY, FACTORY_ABI, FACTORY_ADDRESS } from '../config/contracts';


type TokenCreationFormProps = {
  onCreated: () => void;
};

export function TokenCreationForm({ onCreated }: TokenCreationFormProps) {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const disabled =
    !address ||
    !name.trim() ||
    !symbol.trim() ||
    isDeploying;

  const defaultSupplyLabel = DEFAULT_SUPPLY.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!signerPromise) {
      setStatus('error');
      setStatusMessage('Connect your wallet to deploy a token.');
      return;
    }

    try {
      setIsDeploying(true);
      setStatus('idle');
      setStatusMessage('');

      const signer = await signerPromise;
      const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

      const tx = await factory.createToken(name.trim(), symbol.trim());
      setStatusMessage('Waiting for Sepolia confirmation...');
      await tx.wait();

      setStatus('success');
      setStatusMessage('Token deployed! It now appears in the list below.');
      setName('');
      setSymbol('');
      onCreated();
    } catch (error) {
      console.error('Failed to deploy token', error);
      setStatus('error');
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to deploy the confidential token.'
      );
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="panel-card">
      <h2>Generate a token</h2>
      <p style={{ margin: 0, color: '#475569' }}>
        Deploy a confidential ERC7984 token with a default supply of {defaultSupplyLabel} units.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        <div className="form-field">
          <label htmlFor="token-name">Token name</label>
          <input
            id="token-name"
            placeholder="Prime USD"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="token-symbol">Symbol</label>
          <input
            id="token-symbol"
            placeholder="PUSD"
            value={symbol}
            maxLength={8}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
          />
        </div>

        <div className="form-field">
          <label>Initial supply</label>
          <input value={`${defaultSupplyLabel} (fixed)`} disabled />
          <span className="form-helper">Every new token mints this supply to the creator automatically.</span>
        </div>

        <button type="submit" className="primary-button" disabled={disabled}>
          {isDeploying ? 'Deploying...' : 'Deploy token'}
        </button>
      </form>

      {statusMessage && (
        <div className={`status-banner ${status === 'error' ? 'status-error' : 'status-success'}`}>
          {statusMessage}
        </div>
      )}
    </div>
  );
}
