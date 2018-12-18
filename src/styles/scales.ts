/**
 * Scales for font sizes, width/height, and spacing based on tachyons
 */

type ScaleIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * A scale for font size.
 *
 * 1. 3rem (48px)
 * 2. 2.25rem (36px)
 * 3. 1.5rem (24px)
 * 4. 1.25rem (20px)
 * 5. 1rem (16px)
 * 6. 0.875rem (14px)
 * 7. 0.75rem (12px)
 *
 * @see http://tachyons.io/docs/typography/scale/
 */
export const font: Record<ScaleIndex, string> = Object.freeze({
  1: '3rem',
  2: '2.25rem',
  3: '1.5rem',
  4: '1.25rem',
  5: '1rem',
  6: '0.875rem',
  7: '0.75rem',
});

/**
 * A scale used for margin/padding/grid gap.
 *
 * 1. 0.25rem (4px)
 * 2. 0.5rem (8px)
 * 3. 1rem (16px)
 * 4. 2rem (32px)
 * 5. 4rem (64px)
 * 6. 8rem (128px)
 * 7. 16rem (256px)
 *
 * @see http://tachyons.io/docs/layout/spacing/
 */
export const spacing: Record<ScaleIndex, string> = Object.freeze({
  1: '0.25rem',
  2: '0.5rem',
  3: '1rem',
  4: '2rem',
  5: '4rem',
  6: '8rem',
  7: '16rem',
});

/**
 * A scale used for widths and heights.
 *
 * 1. 1rem (16px)
 * 2. 2rem (32px)
 * 3. 4rem (64px)
 * 4. 8rem (128px)
 * 5. 16rem (256px)
 * 6. 32rem (512px)
 * 7. 48rem (768px)
 * 8. 64rem (1024px)
 *
 * @see http://tachyons.io/docs/layout/widths/
 */
export const size: Record<ScaleIndex | 8, string> = Object.freeze({
  1: '1rem',
  2: '2rem',
  3: '4rem',
  4: '8rem',
  5: '16rem',
  6: '32rem',
  7: '48rem',
  8: '64rem',
});
