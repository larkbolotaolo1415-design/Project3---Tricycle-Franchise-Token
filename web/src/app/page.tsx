'use client';
import { useState, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import ConnectWallet from '@/components/ConnectWallet';
import FundAccount from '@/components/FundAccount';
import AddTrustline from '@/components/AddTrustline';
import BalanceCard from '@/components/BalanceCard';
import SendPayment from '@/components/SendPayment';
import SavingsGoal from '@/components/SavingsGoal';

export default function Home() {
  const wallet = useWallet();
  const { publicKey, connecting } = wallet;
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <main className="min-h-screen w-full bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Tricycle Franchise Rights</h1>
              <p className="mt-2 text-sm text-slate-500">
                LGU-issued route rights on Stellar testnet. Transfers only complete after official approval.
              </p>
            </div>
            <ConnectWallet {...wallet} />
          </div>
        </header>

        {!publicKey && !connecting && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm shadow-slate-100">
            <p className="mb-3 text-lg font-medium text-slate-900">Connect your wallet to interact.</p>
            <p className="text-sm">
              No wallet yet?{' '}
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:underline"
              >
                Install Freighter
              </a>{' '}
              and switch to Test Net.
            </p>
          </div>
        )}

        {publicKey && (
          <>
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <FundAccount publicKey={publicKey} onFunded={refresh} />
              <AddTrustline publicKey={publicKey} onDone={refresh} />
            </div>
            <BalanceCard publicKey={publicKey} refreshKey={refreshKey} />
            <button
              onClick={refresh}
              className="mt-3 text-sm text-slate-500 underline hover:text-slate-700"
            >
              Refresh balances
            </button>
            <SendPayment publicKey={publicKey} onSent={refresh} />
          </>
        )}

        <SavingsGoal publicKey={publicKey} />

        <footer className="mt-10 text-center text-xs text-slate-400">
          Built for a modern Stellar LGU demo — franchise rights, asset-backed ownership, and transparent approval flows.
        </footer>
      </div>
    </main>
  );
}
