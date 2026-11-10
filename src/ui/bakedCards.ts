import { useEffect, useState, type CSSProperties } from 'react';

/**
 * Card art with its blur, dimming and shadow painted in once, as an SVG image.
 *
 * A CSS `filter` on a moving layer is worked out again on every frame; on a phone a
 * screen of tumbling, blurred cards is most of the frame budget. The filter values
 * never change per card, so the same picture is drawn once into an image and the
 * layer just moves it.
 */
export interface BakeSpec {
  /** Card art file name without extension, from `pazaak/cards`. */
  art: string;
  /** Card width in CSS px; the filter lengths below are in the same px. */
  width: number;
  blur?: number;
  /** Brightness multiplier, as in CSS `brightness()`. */
  lit?: number;
  /** As CSS `drop-shadow(0 dy blur rgba(0, 0, 0, opacity))`. */
  shadow?: { dy: number; blur: number; opacity: number };
}

export interface BakedSprite {
  /** CSS `background-image` value. */
  image: string;
  /** How far the picture spills past the card on every side, in px. */
  pad: number;
}

const CARDS = `${import.meta.env.BASE_URL}pazaak/cards`;
// Card art is square and sits in a 104:128 card, as `background-size: contain` shows it.
const CARD_RATIO = 128 / 104;

const artData = new Map<string, Promise<string>>();

/** The art as a data URL: an SVG used as an image cannot load anything but inline data. */
export function loadCardArt(art: string): Promise<string> {
  let data = artData.get(art);
  if (!data) {
    data = fetch(`${CARDS}/${art}.png`)
      .then((res) => {
        if (!res.ok) throw new Error(`card art ${art}: ${res.status}`);
        return res.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          }),
      );
    data.catch(() => artData.delete(art));
    artData.set(art, data);
  }
  return data;
}

/** Fetches art ahead of the moment it is needed. */
export function preloadCardArt(...arts: string[]) {
  if (typeof fetch !== 'function' || typeof FileReader !== 'function') return;
  arts.forEach((art) => void loadCardArt(art).catch(() => {}));
}

const round = (n: number) => Math.round(n * 100) / 100;

export function bakeSprite(data: string, { width, blur = 0, lit = 1, shadow }: Omit<BakeSpec, 'art'>): BakedSprite {
  const w = round(width);
  const h = round(width * CARD_RATIO);
  // A gaussian fades out about three deviations from the edge; CSS blur lengths are 2σ for shadows.
  const pad = Math.ceil(blur * 3 + (shadow ? shadow.dy + shadow.blur * 1.5 : 0));
  const steps = [
    blur > 0 ? `<feGaussianBlur stdDeviation="${blur}"/>` : '',
    lit !== 1
      ? `<feComponentTransfer><feFuncR type="linear" slope="${lit}"/><feFuncG type="linear" slope="${lit}"/><feFuncB type="linear" slope="${lit}"/></feComponentTransfer>`
      : '',
    shadow
      ? `<feDropShadow dx="0" dy="${shadow.dy}" stdDeviation="${shadow.blur / 2}" flood-color="#000" flood-opacity="${shadow.opacity}"/>`
      : '',
  ].join('');
  const box = `x="${-pad}" y="${-pad}" width="${w + pad * 2}" height="${h + pad * 2}"`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}">` +
    (steps
      ? `<filter id="f" filterUnits="userSpaceOnUse" ${box} color-interpolation-filters="sRGB">${steps}</filter>`
      : '') +
    `<image href="${data}" x="0" y="${round((h - w) / 2)}" width="${w}" height="${w}"${steps ? ' filter="url(#f)"' : ''}/>` +
    `</svg>`;
  return { image: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, pad };
}

/** Inline style for a face showing a baked sprite; pair it with the face's `baked` class. */
export const bakedStyle = (sprite: BakedSprite): CSSProperties =>
  ({ backgroundImage: sprite.image, '--pad': `${sprite.pad}px` }) as CSSProperties;

/**
 * Bakes one sprite per spec. Returns null until the art has loaded (and wherever it
 * cannot be), so callers keep their CSS filters as the fallback. `specs` is rebuilt
 * from `key`, which should change whenever the specs do (e.g. on a viewport change).
 */
export function useBakedSprites(key: string, specs: () => BakeSpec[]): BakedSprite[] | null {
  const [baked, setBaked] = useState<{ key: string; sprites: BakedSprite[] } | null>(null);

  useEffect(() => {
    if (typeof fetch !== 'function' || typeof FileReader !== 'function') return;
    let live = true;
    const list = specs();
    Promise.all(list.map((spec) => loadCardArt(spec.art).then((data) => bakeSprite(data, spec))))
      .then((sprites) => {
        if (live) setBaked({ key, sprites });
      })
      .catch(() => {
        // No art, no bake: the CSS filters stay in charge.
      });
    return () => {
      live = false;
    };
    // `specs` is derived from `key` by contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return baked?.key === key ? baked.sprites : null;
}

/** min(viewport width, height) / 100 and orientation, tracked across resizes and rotation. */
export function useViewportUnit(): { vmin: number; portrait: boolean } {
  const read = () => ({
    vmin: Math.min(window.innerWidth, window.innerHeight) / 100,
    portrait: window.innerHeight >= window.innerWidth,
  });
  const [unit, setUnit] = useState(read);

  useEffect(() => {
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setUnit((prev) => {
          const next = read();
          return prev.vmin === next.vmin && prev.portrait === next.portrait ? prev : next;
        });
      }, 200);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return unit;
}
