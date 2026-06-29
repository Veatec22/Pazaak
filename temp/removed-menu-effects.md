# Removed menu visual effects

Archived on request so the effects can be restored later if needed.

## Animated aurora / beam background

```css
.pz-aurora {
  position: fixed;
  inset: -10px;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  opacity: 0.1;
  will-change: background-position;
  --aurora: repeating-linear-gradient(100deg, #0d5945 10%, #2c8d75 15%, #6df3cf 20%, #4fcfac 25%, #1ab28c 30%);
  --band: repeating-linear-gradient(100deg, #070f0d 0%, #070f0d 7%, transparent 10%, transparent 12%, #070f0d 16%);
  background-image: var(--band), var(--aurora);
  background-size: 300%, 200%;
  background-position: 50% 50%, 50% 50%;
  filter: blur(10px);
  animation: pz-aurora-base 90s ease-in-out infinite alternate;
}

.pz-aurora::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: var(--band), var(--aurora);
  background-size: 200%, 100%;
  background-attachment: fixed;
  mix-blend-mode: difference;
  animation: pz-aurora 70s ease-in-out infinite alternate;
}
```

## Audio-reactive logo sync

```tsx
function useLogoGlow(logoRef: RefObject<HTMLImageElement | null>) {
  const { analyser } = useMusic();
  const [effectsState] = useEffectsSettings();
  useEffect(() => {
    const el = logoRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!analyser || reduce || effectsState.audioSyncDisabled || !el) {
      el?.style.setProperty('--pz-logo-glow', '0');
      return;
    }
    const data = new Uint8Array(analyser.fftSize);
    let raf = 0;
    let smooth = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const level = Math.min(1, Math.sqrt(sum / data.length) * 3.4);
      smooth += (level - smooth) * (level > smooth ? 0.5 : 0.12);
      el.style.setProperty('--pz-logo-glow', smooth.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.style.setProperty('--pz-logo-glow', '0');
    };
  }, [analyser, logoRef, effectsState.audioSyncDisabled]);
}
```

## Temporary split settings module

```ts
const LS_MENU_GLOW_DISABLED = 'pz-menu-glow-disabled';
const LS_AUDIO_SYNC_DISABLED = 'pz-audio-sync-disabled';

interface EffectsState {
  menuGlowDisabled: boolean;
  audioSyncDisabled: boolean;
}
```
