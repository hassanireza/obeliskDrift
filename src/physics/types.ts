import type { Vec2 } from "./vector";

/** A gravity well pulls the fragment toward its center. Negative strength repels. */
export interface Well {
  id: string;
  x: number;
  y: number;
  strength: number;
  radius: number;
}

/** A solid body the fragment rebounds from. */
export interface Obstacle {
  id: string;
  x: number;
  y: number;
  radius: number;
  restitution: number;
}

/** A region that saps velocity, like silted water or dense dust. */
export interface DustZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  drag: number;
}

/** The socket the fragment must come to rest inside. */
export interface Goal {
  x: number;
  y: number;
  radius: number;
  maxEntrySpeed: number;
}

export interface Chamber {
  id: number;
  slug: string;
  name: string;
  epigraph: string;
  width: number;
  height: number;
  start: Vec2;
  fragmentRadius: number;
  goal: Goal;
  wells: Well[];
  obstacles: Obstacle[];
  dustZones: DustZone[];
  maxLaunches: number;
  parLaunches: number;
  launchPowerCap: number;
}

export interface FragmentState {
  position: Vec2;
  velocity: Vec2;
  atRest: boolean;
  /** Seconds the fragment has been moving slower than the stall threshold. */
  stalledFor: number;
  /** Seconds since this launch began, used as a hard timeout safety net. */
  elapsed: number;
}

export type RunOutcome = "seated" | "voided" | "spent";

export interface StepResult {
  collided: boolean;
  outcome: RunOutcome | null;
}
