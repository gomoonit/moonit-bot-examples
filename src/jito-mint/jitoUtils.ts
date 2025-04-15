import axios from 'axios';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { SolanaSerializationService } from '@moonit/sdk';
import bs58 from 'bs58';
import { connection } from './constants';

const baseURL =
  'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles';

const getTipAccount = async (): Promise<string> => {
  const res = await axios.post(
    baseURL,
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTipAccounts',
      params: [],
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  const tipAccounts = res?.data?.result;
  if (tipAccounts == null) {
    throw new Error('Tip accounts not found');
  }
  const idx = Math.floor(Math.random() * (tipAccounts.length - 1));

  return tipAccounts[idx];
};

const getTipTx = async (creator: Keypair): Promise<string> => {
  const tipAccount = await getTipAccount();
  console.log(`Tip account is: ${tipAccount}`);
  const ix = SystemProgram.transfer({
    fromPubkey: creator.publicKey,
    toPubkey: new PublicKey(tipAccount),
    lamports: 100_000, // 100k Lamports
  });

  const latestBlockhash = await connection.getLatestBlockhash();

  const message = new TransactionMessage({
    payerKey: creator.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [ix],
  }).compileToV0Message();

  const tx = new VersionedTransaction(message);
  tx.sign([creator]);

  const signature = String(bs58.encode(tx.signatures[0]));

  console.log(`Jito tip transaction prepared: ${signature}`);

  return SolanaSerializationService.serializeVersionedTransaction(tx);
};

export const submitWithJito = async (
  txs: string[],
  payer: Keypair,
): Promise<string> => {
  if (txs.length > 4) {
    throw new Error('Max 4 transactions');
  }
  const tipTx = await getTipTx(payer);

  try {
    const res = await axios.post(
      baseURL,
      {
        id: 1,
        jsonrpc: '2.0',
        method: 'sendBundle',
        params: [
          [...txs, tipTx],
          {
            encoding: 'base64',
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    return res.data.result;
  } catch (e: any) {
    console.error('Failed bundle:', JSON.stringify(e!.response!.data, null, 2));
    throw e;
  }
};

export const confirmJitoBundle = async (
  id: string,
): Promise<BundleStatusRes | undefined> => {
  const res = await axios.post(
    baseURL,
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'getBundleStatuses',
      params: [[id]],
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  return res.data.value?.[0];
};

const delay = async (ms: number): Promise<boolean> => {
  return new Promise((res) => {
    setTimeout(() => {
      res(true);
    }, ms);
  });
};

export const waitForConfirmation = async (res: string): Promise<void> => {
  for (let i = 0; i < 20; i++) {
    await delay(2000);
    const bundleRes = await confirmJitoBundle(res);
    if (bundleRes == null) {
      continue;
    }
    console.log(`Checking bundle status... [${bundleRes.confirmation_status}]`);
    if (
      bundleRes.err.Ok === null &&
      bundleRes.confirmation_status === 'finalized'
    ) {
      console.log(
        `Transaction confirmed sig: ${bundleRes.transactions[0]} \n bundleSig: ${bundleRes.transactions[1]}`,
      );
      break;
    }
  }
};

export interface BundleStatusRes {
  bundle_id: string;
  transactions: string[];
  slot: number;
  confirmation_status: 'processed' | 'confirmed' | 'finalized';
  err: {
    Ok: null | string;
  };
}
