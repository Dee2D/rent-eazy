/**
 * Full-viewport decorative background layer.
 *
 * Rendered below every page (-z-10, pointer-events-none).
 * The pattern is an SVG tile of African-inspired geometry mixed with
 * housing / rental micro-glyphs. Opacity is kept at ≤8% so it acts
 * as a subtle texture without competing with any content.
 */
export default function BackgroundPattern() {
  return (
    <div
      aria-hidden="true"
      className={[
        'fixed inset-0 -z-10 pointer-events-none select-none',
        // Light mode: 8%. Dark mode: 4% (pattern reads slightly brighter against dark bg).
        'opacity-[0.08] dark:opacity-[0.04]',
        // Smooth opacity transition on dark mode toggle.
        'transition-opacity duration-300',
      ].join(' ')}
    >
      {/*
        The inner div is oversized by 200px on every side so the slow diagonal
        drift never reveals a hard edge. It pans by exactly one tile (200×200)
        which makes the repeat seamless.
      */}
      <div
        className="absolute bg-pattern-drift"
        style={{
          inset: '-200px',
          backgroundImage: "url('/patterns/bg-pattern.svg')",
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
}
