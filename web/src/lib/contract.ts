import { Contract, TransactionBuilder, BASE_FEE, Account, rpc, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE, CONTRACT_ID } from './stellar';

const READ_SOURCE = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

export interface FranchiseState {
  owner: string;
  pending?: string;
}

export function contractConfigured(): boolean {
  return Boolean(CONTRACT_ID);
}

export async function readAdmin(): Promise<string> {
  const contract = new Contract(CONTRACT_ID);
  const source = new Account(READ_SOURCE, '0');

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('get_admin'))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) {
    throw new Error('Could not read contract admin. Is it deployed and initialised?');
  }

  return scValToNative(sim.result.retval) as string;
}

export async function readFranchiseState(routeId: string): Promise<FranchiseState | null> {
  const contract = new Contract(CONTRACT_ID);
  const source = new Account(READ_SOURCE, '0');

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('get_franchise', nativeToScVal(routeId)))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) {
    throw new Error('Could not read franchise state. Is the contract deployed?');
  }

  const info = scValToNative(sim.result.retval) as { owner: string; pending?: string | null } | null;
  if (!info) return null;
  return {
    owner: info.owner,
    pending: info.pending ?? undefined,
  };
}

async function buildContractCallXDR(
  sender: string,
  method: string,
  ...args: xdr.ScVal[]
): Promise<string> {
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(sender);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed — ${method} would not succeed.`);
  }

  return rpc.assembleTransaction(tx, sim).build().toXDR();
}

export async function buildIssueFranchiseXDR(
  sender: string,
  routeId: string,
  owner: string,
): Promise<string> {
  return buildContractCallXDR(
    sender,
    'issue_franchise',
    nativeToScVal(routeId),
    nativeToScVal(owner),
  );
}

export async function buildRequestTransferXDR(
  sender: string,
  routeId: string,
  newOwner: string,
): Promise<string> {
  return buildContractCallXDR(
    sender,
    'request_transfer',
    nativeToScVal(routeId),
    nativeToScVal(newOwner),
  );
}

export async function buildApproveTransferXDR(
  sender: string,
  routeId: string,
): Promise<string> {
  return buildContractCallXDR(sender, 'approve_transfer', nativeToScVal(routeId));
}
