import { useCallback, useMemo, useState } from "react";
import { CHAMBERS } from "./data/chambers";
import { GameCanvas } from "./game/GameCanvas";
import { HUD } from "./components/HUD";
import { StartScreen } from "./components/StartScreen";
import { ChamberSelect } from "./components/ChamberSelect";
import { ChamberOutcome } from "./components/ChamberOutcome";
import { GrainOverlay } from "./components/GrainOverlay";
import { getBestLaunches, getUnlockedCount, recordBestLaunches, unlockUpTo } from "./lib/storage";

type Screen = "start" | "select" | "playing" | "outcome" | "finished";
type OutcomeStatus = "seated" | "spent";

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [chamberIndex, setChamberIndex] = useState(0);
  const [launchesUsed, setLaunchesUsed] = useState(0);
  const [outcome, setOutcome] = useState<OutcomeStatus>("seated");
  const [unlockedCount, setUnlockedCount] = useState(() => getUnlockedCount());
  const [playKey, setPlayKey] = useState(0);

  const chamber = CHAMBERS[chamberIndex];

  const beginChamber = useCallback((index: number) => {
    setChamberIndex(index);
    setLaunchesUsed(0);
    setScreen("playing");
    setPlayKey((k) => k + 1);
  }, []);

  const handleSeated = useCallback(
    (used: number) => {
      if (!chamber) return;
      recordBestLaunches(chamber.id, used);
      unlockUpTo(chamber.id + 1);
      setUnlockedCount(getUnlockedCount());
      setLaunchesUsed(used);
      setOutcome("seated");
      setScreen("outcome");
    },
    [chamber]
  );

  const handleSpentOut = useCallback((used: number) => {
    setLaunchesUsed(used);
    setOutcome("spent");
    setScreen("outcome");
  }, []);

  const handleLaunch = useCallback(() => {
    setLaunchesUsed((n) => n + 1);
  }, []);

  const goToSelect = useCallback(() => setScreen("select"), []);

  const retryChamber = useCallback(() => {
    beginChamber(chamberIndex);
  }, [beginChamber, chamberIndex]);

  const nextChamber = useCallback(() => {
    if (chamberIndex + 1 >= CHAMBERS.length) {
      setScreen("finished");
      return;
    }
    beginChamber(chamberIndex + 1);
  }, [beginChamber, chamberIndex]);

  const bestLaunches = useCallback((chamberId: number) => getBestLaunches(chamberId), []);

  const displayedLaunches = useMemo(() => {
    if (!chamber) return 0;
    return Math.min(launchesUsed, chamber.maxLaunches);
  }, [chamber, launchesUsed]);

  if (!chamber) return null;

  return (
    <div className="obelisk-app">
      <GrainOverlay />

      {screen === "start" && <StartScreen onBegin={() => setScreen("select")} />}

      {screen === "select" && (
        <ChamberSelect
          chambers={CHAMBERS}
          unlockedCount={unlockedCount}
          bestLaunches={bestLaunches}
          onSelect={beginChamber}
        />
      )}

      {(screen === "playing" || screen === "outcome") && (
        <div className="obelisk-play-view">
          <HUD
            chamber={chamber}
            index={chamberIndex}
            total={CHAMBERS.length}
            launchesUsed={displayedLaunches}
            onMenu={goToSelect}
            onRetry={retryChamber}
          />
          <GameCanvas
            key={playKey}
            chamber={chamber}
            launchesUsed={launchesUsed}
            onLaunch={handleLaunch}
            onSeated={handleSeated}
            onSpentOut={handleSpentOut}
          />
          <p className="obelisk-epigraph">{chamber.epigraph}</p>
        </div>
      )}

      {screen === "outcome" && (
        <ChamberOutcome
          status={outcome}
          chamberName={chamber.name}
          launchesUsed={launchesUsed}
          parLaunches={chamber.parLaunches}
          onRetry={retryChamber}
          onNext={nextChamber}
          onMenu={goToSelect}
          hasNext={chamberIndex + 1 < CHAMBERS.length}
        />
      )}

      {screen === "finished" && (
        <ChamberOutcome
          status="complete"
          chamberName={chamber.name}
          launchesUsed={launchesUsed}
          parLaunches={chamber.parLaunches}
          onRetry={retryChamber}
          onNext={nextChamber}
          onMenu={goToSelect}
          hasNext={false}
        />
      )}
    </div>
  );
}
