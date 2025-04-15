import {
  CurveType,
  Environment,
  MigrationDex,
  Moonit,
  SolanaSerializationService,
} from '@moonit/sdk';
import { Keypair } from '@solana/web3.js';
import { waitForConfirmation, submitWithJito } from './jitoUtils';
import { getBuyTx, getMintAddress, img } from './mintUtils';
import { privateKeyArray, rpcUrl } from './constants';

export const createMintJito = async (): Promise<void> => {
  console.log('--- Create mint with Jito example ---');

  const creator = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
  console.log('Creator: ', creator.publicKey.toBase58());

  const moonit = new Moonit({
    rpcUrl: rpcUrl,
    environment: Environment.MAINNET,
    chainOptions: {
      solana: { confirmOptions: { commitment: 'confirmed' } },
    },
  });

  const prepMint = await moonit.prepareMintTx({
    creator: creator.publicKey.toBase58(),
    name: 'JITO_MINT',
    symbol: 'JITO_MINT',
    curveType: CurveType.CONSTANT_PRODUCT_V1,
    migrationDex: MigrationDex.RAYDIUM,
    icon: img,
    description: 'Token minted using the @moonit/sdk and jito',
    links: [{ url: 'https://x.com', label: 'x handle' }],
    banner: img,
    tokenAmount: '42000000000',
  });

  const deserializedTransaction =
    SolanaSerializationService.deserializeVersionedTransaction(
      prepMint.transaction,
    );
  if (deserializedTransaction == null) {
    throw new Error('Failed to deserialize transaction');
  }

  deserializedTransaction.sign([creator]);

  const signedTransaction =
    SolanaSerializationService.serializeVersionedTransaction(
      deserializedTransaction,
    );

  const mintAddress = getMintAddress(deserializedTransaction);
  const buyTx = await getBuyTx(moonit, mintAddress.toBase58(), creator);

  const res = await submitWithJito([signedTransaction, buyTx], creator);
  await waitForConfirmation(res);
};
