interface ChamberOutcomeProps {
  status: "seated" | "spent" | "complete";
  chamberName: string;
  launchesUsed: number;
  parLaunches: number;
  onRetry: () => void;
  onNext: () => void;
  onMenu: () => void;
  hasNext: boolean;
}

export function ChamberOutcome({
  status,
  chamberName,
  launchesUsed,
  parLaunches,
  onRetry,
  onNext,
  onMenu,
  hasNext,
}: ChamberOutcomeProps) {
  if (status === "complete") {
    return (
      <div className="obelisk-overlay">
        <div className="obelisk-overlay-panel">
          <span className="obelisk-eyebrow">The Return</span>
          <h2>All Chambers Seated</h2>
          <p>
            The fragment is whole again. Nothing is left to drift, only the
            quiet after the ritual.
          </p>
          <button type="button" className="obelisk-primary-button" onClick={onMenu}>
            Return to the Chambers
          </button>
        </div>
      </div>
    );
  }

  const seated = status === "seated";

  return (
    <div className="obelisk-overlay">
      <div className="obelisk-overlay-panel">
        <span className="obelisk-eyebrow">{chamberName}</span>
        <h2>{seated ? "Seated" : "Spent"}</h2>
        <p>
          {seated
            ? `The fragment came to rest in ${launchesUsed} of ${parLaunches} intended launches.`
            : "The fragment could not find the socket before the launches ran out."}
        </p>
        <div className="obelisk-overlay-actions">
          <button type="button" className="obelisk-secondary-button" onClick={onRetry}>
            Retry
          </button>
          {seated && hasNext && (
            <button type="button" className="obelisk-primary-button" onClick={onNext}>
              Next Chamber
            </button>
          )}
          {!hasNext && seated && (
            <button type="button" className="obelisk-primary-button" onClick={onMenu}>
              Return to the Chambers
            </button>
          )}
        </div>
        {!seated && (
          <button type="button" className="obelisk-text-button" onClick={onMenu}>
            Back to the Chambers
          </button>
        )}
      </div>
    </div>
  );
}
