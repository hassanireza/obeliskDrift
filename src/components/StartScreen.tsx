interface StartScreenProps {
  onBegin: () => void;
}

export function StartScreen({ onBegin }: StartScreenProps) {
  return (
    <div className="obelisk-screen obelisk-start">
      <div className="obelisk-start-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="48" height="48">
          <path d="M32 6 L44 22 L38 54 L26 54 L20 22 Z" fill="#e9e6df" opacity="0.85" />
        </svg>
      </div>
      <span className="obelisk-eyebrow">Obsidian Originals</span>
      <h1 className="obelisk-title">Obelisk Drift</h1>
      <p className="obelisk-subtitle">Every stone remembers its fall.</p>
      <p className="obelisk-lede">
        A fragment of a shattered obelisk drifts through a submerged ruin. Draw it
        back, release it into the dark, and let the chamber&rsquo;s gravity carry it
        home. No two wells pull the same way twice.
      </p>
      <button type="button" className="obelisk-primary-button" onClick={onBegin}>
        Begin the Descent
      </button>
      <p className="obelisk-hint">Drag the fragment to aim. Release to launch.</p>
    </div>
  );
}
