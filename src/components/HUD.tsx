import type { Chamber } from "../physics/types";

interface HUDProps {
  chamber: Chamber;
  index: number;
  total: number;
  launchesUsed: number;
  onMenu: () => void;
  onRetry: () => void;
}

export function HUD({ chamber, index, total, launchesUsed, onMenu, onRetry }: HUDProps) {
  const remaining = Math.max(0, chamber.maxLaunches - launchesUsed);

  return (
    <div className="obelisk-hud">
      <div className="obelisk-hud-left">
        <button type="button" className="obelisk-icon-button" onClick={onMenu} aria-label="Return to chamber select">
          &#8592;
        </button>
        <div className="obelisk-hud-title">
          <span className="obelisk-eyebrow">
            Chamber {index + 1} of {total}
          </span>
          <h2>{chamber.name}</h2>
        </div>
      </div>
      <div className="obelisk-hud-right">
        <div className="obelisk-launch-dots" aria-label={`${remaining} launches remaining`}>
          {Array.from({ length: chamber.maxLaunches }).map((_, i) => (
            <span
              key={i}
              className={i < launchesUsed ? "obelisk-dot obelisk-dot-spent" : "obelisk-dot"}
            />
          ))}
        </div>
        <button type="button" className="obelisk-icon-button" onClick={onRetry} aria-label="Retry chamber">
          &#8635;
        </button>
      </div>
    </div>
  );
}
