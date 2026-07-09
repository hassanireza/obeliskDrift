import type { Chamber } from "../physics/types";

interface ChamberSelectProps {
  chambers: Chamber[];
  unlockedCount: number;
  bestLaunches: (chamberId: number) => number | null;
  onSelect: (index: number) => void;
}

export function ChamberSelect({ chambers, unlockedCount, bestLaunches, onSelect }: ChamberSelectProps) {
  return (
    <div className="obelisk-screen obelisk-select">
      <span className="obelisk-eyebrow">Obelisk Drift</span>
      <h1 className="obelisk-title obelisk-title-small">The Chambers</h1>
      <ul className="obelisk-chamber-list">
        {chambers.map((chamber, index) => {
          const unlocked = index < unlockedCount;
          const best = bestLaunches(chamber.id);
          return (
            <li key={chamber.slug}>
              <button
                type="button"
                className="obelisk-chamber-item"
                disabled={!unlocked}
                onClick={() => onSelect(index)}
              >
                <span className="obelisk-chamber-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="obelisk-chamber-info">
                  <span className="obelisk-chamber-name">{chamber.name}</span>
                  <span className="obelisk-chamber-epigraph">{chamber.epigraph}</span>
                </span>
                <span className="obelisk-chamber-status">
                  {!unlocked ? "Sealed" : best !== null ? `Best: ${best}` : "Unseated"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
