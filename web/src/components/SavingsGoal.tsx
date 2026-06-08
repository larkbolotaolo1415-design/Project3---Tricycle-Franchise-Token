'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  contractConfigured,
  readAdmin,
  readFranchiseState,
  buildIssueFranchiseXDR,
  buildRequestTransferXDR,
  buildApproveTransferXDR,
  type FranchiseState,
} from '@/lib/contract';
import { signAndSubmit } from '@/lib/sign';

export default function SavingsGoal({ publicKey }: { publicKey: string | null }) {
  const configured = contractConfigured();
  const [admin, setAdmin] = useState<string | null>(null);
  const [routeId, setRouteId] = useState('Route-001');
  const [route, setRoute] = useState<FranchiseState | null | undefined>(undefined);
  const [loading, setLoading] = useState(configured);
  const [actionLoading, setActionLoading] = useState(false);
  const [issueOwner, setIssueOwner] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refreshAdmin = useCallback(async () => {
    if (!configured) return;
    try {
      setAdmin(await readAdmin());
    } catch {
      setAdmin(null);
    }
  }, [configured]);

  const loadRoute = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const info = await readFranchiseState(routeId.trim());
      setRoute(info);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to read route state');
    } finally {
      setLoading(false);
    }
  }, [configured, routeId]);

  useEffect(() => {
    refreshAdmin();
  }, [refreshAdmin]);

  const handleIssue = async () => {
    if (!publicKey) return;
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const xdr = await buildIssueFranchiseXDR(publicKey, routeId.trim(), issueOwner.trim());
      await signAndSubmit(xdr, publicKey);
      setMessage('Franchise issued successfully.');
      setIssueOwner('');
      await loadRoute();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Issue failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestTransfer = async () => {
    if (!publicKey) return;
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const xdr = await buildRequestTransferXDR(publicKey, routeId.trim(), transferTo.trim());
      await signAndSubmit(xdr, publicKey);
      setMessage('Transfer request submitted to LGU approval.');
      setTransferTo('');
      await loadRoute();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!publicKey) return;
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const xdr = await buildApproveTransferXDR(publicKey, routeId.trim());
      await signAndSubmit(xdr, publicKey);
      setMessage('Transfer approved and ownership updated.');
      await loadRoute();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className="mt-6 rounded border border-dashed border-gray-300 bg-gray-50 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Franchise Rights Ledger</h2>
        <p className="mt-2 text-sm text-gray-600">
          No contract deployed yet. Deploy the Rust contract and set its ID to enable this dashboard.
        </p>
        <pre className="mt-4 overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
          .\scripts\deploy.ps1
        </pre>
        <p className="mt-2 text-xs text-gray-500">
          The script writes <code>NEXT_PUBLIC_CONTRACT_ID</code> into <code>web/.env.local</code>.
          Restart <code>npm run dev</code> afterward.
        </p>
      </div>
    );
  }

  const userIsAdmin = publicKey !== null && admin === publicKey;
  const userIsOwner = publicKey !== null && route?.owner === publicKey;

  return (
    <div className="mt-6 rounded border border-gray-200 bg-white p-6 shadow-sm shadow-slate-100">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tricycle Franchise Rights</h2>
          <p className="mt-1 text-sm text-gray-500">
            Route ownership is recorded on-chain and all transfers require LGU approval.
          </p>
        </div>
        <div className="space-y-1 text-right text-xs text-gray-500 sm:space-y-0 sm:text-left">
          <div>LGU admin: {admin ?? 'Unknown'}</div>
          <div>Route record: {routeId.trim() || 'none'}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Route ID</label>
          <input
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
            placeholder="Route-001"
          />
        </div>
        <button
          onClick={loadRoute}
          disabled={loading}
          className="whitespace-nowrap rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Load Route'}
        </button>
      </div>

      {loading && <p className="mt-4 text-sm text-gray-500">Loading route data…</p>}

      {!loading && route === null && (
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No franchise record exists for this route yet.
          {userIsAdmin ? ' Issue it below.' : ' Ask the LGU admin to issue it.'}
        </div>
      )}

      {!loading && route && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded border border-gray-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Current owner</p>
              <p className="mt-2 font-medium text-gray-900 break-all">{route.owner}</p>
            </div>
            <div className="rounded border border-gray-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Pending transfer</p>
              <p className="mt-2 font-medium text-gray-900">
                {route.pending ?? 'None'}
              </p>
            </div>
          </div>

          {route.pending && userIsAdmin && (
            <div className="rounded border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-700">Pending transfer request</p>
              <p className="mt-2 text-sm text-gray-700">Approve to update route ownership.</p>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="mt-3 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading ? 'Approving…' : 'Approve transfer'}
              </button>
            </div>
          )}

          {userIsOwner && !route.pending && (
            <div className="rounded border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-sm font-semibold text-indigo-700">Request transfer</p>
              <p className="mt-2 text-sm text-gray-700">Submit a transfer request to the LGU.</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="New owner address"
                  className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
                />
                <button
                  onClick={handleRequestTransfer}
                  disabled={actionLoading || !transferTo}
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Requesting…' : 'Request transfer'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && route === null && userIsAdmin && (
        <div className="mt-6 rounded border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Issue franchise to a route owner</p>
          <p className="mt-2 text-sm text-gray-700">Enter the address that should own this route.</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={issueOwner}
              onChange={(e) => setIssueOwner(e.target.value)}
              placeholder="Owner address"
              className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
            />
            <button
              onClick={handleIssue}
              disabled={actionLoading || !issueOwner}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {actionLoading ? 'Issuing…' : 'Issue franchise'}
            </button>
          </div>
        </div>
      )}

      {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
}
