import type { CSSProperties } from 'react';

// Names whose longest word runs this long switch to a condensed cut of the font in tight
// spots (Science Gothic has a width axis), so they keep their size instead of shrinking.
const CONDENSE_FROM = 6;

/**
 * Style for a name that has to fit a narrow box. Passes CSS the longest word's length
 * (--chars), the font width to use there (--name-stretch) and how wide one letter is at
 * that width in em, letter spacing included (--name-em). The CSS shrinks the font only
 * as far as that word needs, so names wrap between words and are never cut mid-word.
 */
export function nameFit(name: string): CSSProperties {
  const chars = Math.max(1, ...name.split(/\s+/).map((word) => word.length));
  const condensed = chars >= CONDENSE_FROM;
  return {
    ['--chars' as string]: chars,
    ['--name-stretch' as string]: condensed ? '50%' : '100%',
    ['--name-em' as string]: condensed ? 0.58 : 0.97,
  } as CSSProperties;
}
