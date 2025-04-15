import { Connection } from '@solana/web3.js';

export const rpcUrl = ''; // <rpc url>
export const connection = new Connection(rpcUrl, 'confirmed');
export const privateKeyArray = []; // Uint8Array of private key
