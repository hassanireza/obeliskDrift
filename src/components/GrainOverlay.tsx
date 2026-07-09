import { useMemo } from "react";

/**
 * A static, tiled SVG noise field laid over the whole screen at very low
 * opacity. Purely decorative, pointer events disabled so it never blocks
 * the canvas or touch controls beneath it.
 */
export function GrainOverlay() {
  const dataUri = useMemo(() => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'>
      <filter id='n'>
        <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch' />
        <feColorMatrix type='saturate' values='0' />
      </filter>
      <rect width='100%' height='100%' filter='url(#n)' />
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `url("${dataUri}")`,
        opacity: 0.05,
        mixBlendMode: "overlay",
        pointerEvents: "none",
        zIndex: 60,
      }}
    />
  );
}
