import { sellIx } from './sellIx';
import { buyIx } from './buyIx';
import { createMint } from './create-mint';
import { buyFlatCurveTokenIx } from './buyFlatCurveTokenIx';
import { sellFlatCurveTokenIx } from './sellFlatCurveTokenIx';

const main = async (): Promise<void> => {
  await buyIx();
  await sellIx();
  await createMint();

  // Flat curve examples
  await buyFlatCurveTokenIx();
  await sellFlatCurveTokenIx();
};

main().catch(console.error);
