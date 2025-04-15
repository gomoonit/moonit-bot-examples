import { sellIx } from './sellIx';
import { buyIx } from './buyIx';
import { buyFlatCurveTokenIx } from './buyFlatCurveTokenIx';
import { sellFlatCurveTokenIx } from './sellFlatCurveTokenIx';
import { createMint } from './create-mint';
// import { createMintJito } from './jito-mint/createMintJito';

const main = async (): Promise<void> => {
  await buyIx();
  await sellIx();
  await createMint();

  // Flat curve examples
  await buyFlatCurveTokenIx();
  await sellFlatCurveTokenIx();

  // await createMintJito();
};

main().catch(console.error);
