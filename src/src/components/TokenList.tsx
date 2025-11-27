import { Contract } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';

import { FACTORY_ABI, FACTORY_ADDRESS, TOKEN_ABI } from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const formatAmount = (value: bigint) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

type TokenInfo = {
  token: `0x${string}`;
  name: string;
  symbol: string;
  creator: string;
  initialSupply: bigint;
  createdAt: number;
};

type TokenListProps = {
  refreshKey: number;
};

export function TokenList({ refreshKey }: TokenListProps) {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const [actionMessage, setActionMessage] = useState('');
  const zama = useZamaInstance();

  const { data, isPending, refetch } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getAllTokens',
    query: {
      enabled: true,
      refetchInterval: 20000,
    },
  });

  useEffect(() => {
    refetch();
  }, [refreshKey, refetch]);

  const tokens = useMemo<TokenInfo[]>(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return data.map((item: any) => ({
      token: item.token as `0x${string}`,
      name: item.name as string,
      symbol: item.symbol as string,
      creator: item.creator as string,
      initialSupply: BigInt(item.initialSupply ?? 0n),
      createdAt: Number(item.createdAt ?? 0),
    }));
  }, [data]);

  const myTokens = useMemo(() => {
    if (!address) {
      return [] as TokenInfo[];
    }
    return tokens.filter((token) => token.creator.toLowerCase() === address.toLowerCase());
  }, [tokens, address]);

  const shortAddress = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;

  const renderEmpty = (message: string) => <div className="empty-state">{message}</div>;

  const handleMintResult = (message: string) => {
    setActionMessage(message);
    setTimeout(() => setActionMessage(''), 6000);
  };

  return (
    <div className="tokens-section">
      <div className="panel-card">
        <div className="section-title">
          <h2>My deployed tokens</h2>
          <span>{myTokens.length} live</span>
        </div>
        {!address && renderEmpty('Connect a wallet to see tokens you deployed.')}
        {address && myTokens.length === 0 && !isPending && renderEmpty('No tokens yet. Deploy one above!')}
        {isPending && renderEmpty('Loading token list from Sepolia...')}
        {address && myTokens.length > 0 && (
          <div className="token-grid">
            {myTokens.map((token) => (
              <TokenCard
                key={token.token}
                token={token}
                signerPromise={signerPromise}
                onMinted={handleMintResult}
                zamaInstance={zama.instance}
                isZamaLoading={zama.isLoading}
                zamaError={zama.error}
                shortAddress={shortAddress}
              />
            ))}
          </div>
        )}
      </div>

      <div className="panel-card" style={{ marginTop: '1.5rem' }}>
        <div className="section-title">
          <h2>All PrimeLaunch tokens</h2>
          <span>{tokens.length}</span>
        </div>
        {tokens.length === 0 && !isPending && renderEmpty('No confidential tokens have been deployed yet.')}
        {isPending && renderEmpty('Loading token list from Sepolia...')}
        {tokens.length > 0 && (
          <div className="token-grid">
            {tokens.map((token) => (
              <TokenCard
                key={`${token.token}-all`}
                token={token}
                signerPromise={signerPromise}
                onMinted={handleMintResult}
                zamaInstance={zama.instance}
                isZamaLoading={zama.isLoading}
                zamaError={zama.error}
                shortAddress={shortAddress}
              />
            ))}
          </div>
        )}
      </div>

      {actionMessage && <div className="status-banner status-success">{actionMessage}</div>}
    </div>
  );
}

type TokenCardProps = {
  token: TokenInfo;
  signerPromise?: ReturnType<typeof useEthersSigner>;
  onMinted: (message: string) => void;
  zamaInstance: any;
  isZamaLoading: boolean;
  zamaError: string | null;
  shortAddress: (value: string) => string;
};

function TokenCard({ token, signerPromise, onMinted, zamaInstance, isZamaLoading, zamaError, shortAddress }: TokenCardProps) {
  const { address } = useAccount();
  const balanceArgs = (address ? [address as `0x${string}`] : [ZERO_ADDRESS as `0x${string}`]) satisfies readonly [
    `0x${string}`,
  ];
  const { data: encryptedBalance, isPending: isBalancePending, refetch: refetchBalance } = useReadContract({
    address: token.token,
    abi: TOKEN_ABI,
    functionName: 'confidentialBalanceOf',
    args: balanceArgs,
    query: { enabled: Boolean(address) },
  });

  const [mintAmount, setMintAmount] = useState('1000');
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState('');
  const [decryptedBalance, setDecryptedBalance] = useState('');
  const [decryptError, setDecryptError] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  const formattedDate = token.createdAt
    ? new Date(token.createdAt * 1000).toLocaleString()
    : 'Pending confirmation';

  const handleMint = async () => {
    if (!mintAmount || !/^\d+$/.test(mintAmount)) {
      setError('Enter a valid whole number.');
      return;
    }
    if (!signerPromise) {
      setError('Connect your wallet to mint.');
      return;
    }

    try {
      setIsMinting(true);
      setError('');
      const signer = await signerPromise;
      const contract = new Contract(token.token, TOKEN_ABI, signer);
      await contract.freemint(BigInt(mintAmount));
      onMinted(`Minted ${mintAmount} ${token.symbol} to your wallet.`);
      setMintAmount('1000');
      await refetchBalance();
    } catch (err) {
      console.error('Failed to mint', err);
      setError(err instanceof Error ? err.message : 'Mint failed');
    } finally {
      setIsMinting(false);
    }
  };

  const handleDecrypt = async () => {
    if (!address) {
      setDecryptError('Connect your wallet to decrypt.');
      return;
    }
    if (!signerPromise) {
      setDecryptError('Connect your wallet to decrypt.');
      return;
    }
    if (!zamaInstance) {
      setDecryptError(isZamaLoading ? 'Initializing encryption service...' : zamaError ?? 'Encryption unavailable');
      return;
    }
    if (!encryptedBalance) {
      setDecryptError('Encrypted balance is not available yet.');
      return;
    }

    try {
      setIsDecrypting(true);
      setDecryptError('');
      const signer = await signerPromise;
      const keypair = zamaInstance.generateKeypair();

      const handle = String(encryptedBalance);
      const contractAddress = token.token;
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';

      const eip712 = zamaInstance.createEIP712(keypair.publicKey, [contractAddress], startTimeStamp, durationDays);
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      const result = await zamaInstance.userDecrypt(
        [{ handle, contractAddress }],
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        [contractAddress],
        signer.address,
        startTimeStamp,
        durationDays
      );

      const clearValue = result[handle];
      setDecryptedBalance(typeof clearValue === 'bigint' ? clearValue.toString() : String(clearValue));
    } catch (err) {
      console.error('Failed to decrypt', err);
      setDecryptError(err instanceof Error ? err.message : 'Failed to decrypt balance');
    } finally {
      setIsDecrypting(false);
    }
  };

  const encryptedBalanceLabel = encryptedBalance
    ? String(encryptedBalance)
    : address
      ? isBalancePending
        ? 'Fetching...'
        : 'Unavailable'
      : 'Connect wallet';

  return (
    <div className="token-card">
      <h4>
        {token.name} <span style={{ color: '#64748b', fontSize: '0.9rem' }}>({token.symbol})</span>
      </h4>
      <p className="token-meta" title={token.creator}>
        Creator: {shortAddress(token.creator)}
      </p>
      <p className="token-address" title={token.token}>
        Address: {token.token}
      </p>
      <p className="token-meta">Initial supply: {formatAmount(token.initialSupply)}</p>
      <p className="token-meta">Deployed: {formattedDate}</p>
      <div className="token-meta" style={{ marginTop: '0.5rem' }}>
        Encrypted balance: <code style={{ wordBreak: 'break-all' }}>{encryptedBalanceLabel}</code>
      </div>
      {decryptedBalance && (
        <div className="status-banner status-success" style={{ marginTop: '0.65rem' }}>
          Decrypted balance: {decryptedBalance}
        </div>
      )}
      {decryptError && (
        <div className="status-banner status-error" style={{ marginTop: '0.65rem' }}>
          {decryptError}
        </div>
      )}
      <button
        className="secondary-button"
        style={{ marginTop: '0.75rem' }}
        onClick={handleDecrypt}
        disabled={isDecrypting || !address || !encryptedBalance || isBalancePending}
      >
        {isDecrypting ? 'Decrypting...' : 'Decrypt balance'}
      </button>

      <div className="token-footer">
        <label style={{ fontWeight: 600 }}>Freemint amount</label>
        <input
          className="inline-input"
          value={mintAmount}
          onChange={(event) => setMintAmount(event.target.value)}
        />
        {error && <div className="status-banner status-error" style={{ marginTop: '0.65rem' }}>{error}</div>}
        <div className="inline-actions">
          <button className="secondary-button" onClick={handleMint} disabled={isMinting}>
            {isMinting ? 'Minting...' : 'Mint to wallet'}
          </button>
        </div>
      </div>
    </div>
  );
}
