import { add, distance, length, normalize, scale, sub } from "./vector";
import type { Chamber, FragmentState, StepResult } from "./types";

const GRAVITY_CONSTANT = 2600;
const MIN_WELL_DISTANCE = 18;
const REST_SPEED = 6;
const VOID_MARGIN = 90;
const STALL_SECONDS = 0.9;
const MAX_FLIGHT_SECONDS = 14;

function wellAcceleration(chamber: Chamber, state: FragmentState) {
  let ax = 0;
  let ay = 0;
  for (const well of chamber.wells) {
    const dx = well.x - state.position.x;
    const dy = well.y - state.position.y;
    const distSq = Math.max(dx * dx + dy * dy, MIN_WELL_DISTANCE * MIN_WELL_DISTANCE);
    const dist = Math.sqrt(distSq);
    const force = (GRAVITY_CONSTANT * well.strength) / distSq;
    ax += (dx / dist) * force;
    ay += (dy / dist) * force;
  }
  return { x: ax, y: ay };
}

function applyDustZones(chamber: Chamber, state: FragmentState, dt: number) {
  for (const zone of chamber.dustZones) {
    const inside =
      state.position.x >= zone.x &&
      state.position.x <= zone.x + zone.width &&
      state.position.y >= zone.y &&
      state.position.y <= zone.y + zone.height;
    if (inside) {
      const factor = Math.max(0, 1 - zone.drag * dt);
      state.velocity = scale(state.velocity, factor);
    }
  }
}

function resolveObstacleCollisions(chamber: Chamber, state: FragmentState): boolean {
  let collided = false;
  for (const obstacle of chamber.obstacles) {
    const delta = sub(state.position, { x: obstacle.x, y: obstacle.y });
    const dist = length(delta);
    const minDist = obstacle.radius + chamber.fragmentRadius;
    if (dist < minDist && dist > 1e-6) {
      const normal = normalize(delta);
      const penetration = minDist - dist;
      state.position = add(state.position, scale(normal, penetration));
      const speedAlongNormal = state.velocity.x * normal.x + state.velocity.y * normal.y;
      if (speedAlongNormal < 0) {
        const reflected = sub(
          state.velocity,
          scale(normal, 2 * speedAlongNormal * obstacle.restitution)
        );
        state.velocity = reflected;
        collided = true;
      }
    }
  }
  return collided;
}

function resolveBoundaries(chamber: Chamber, state: FragmentState): boolean {
  let collided = false;
  const r = chamber.fragmentRadius;
  if (state.position.x - r < 0) {
    state.position.x = r;
    state.velocity.x = Math.abs(state.velocity.x) * 0.72;
    collided = true;
  } else if (state.position.x + r > chamber.width) {
    state.position.x = chamber.width - r;
    state.velocity.x = -Math.abs(state.velocity.x) * 0.72;
    collided = true;
  }
  if (state.position.y - r < 0) {
    state.position.y = r;
    state.velocity.y = Math.abs(state.velocity.y) * 0.72;
    collided = true;
  }
  return collided;
}

function isVoided(chamber: Chamber, state: FragmentState): boolean {
  return state.position.y - chamber.fragmentRadius > chamber.height + VOID_MARGIN;
}

function checkGoal(chamber: Chamber, state: FragmentState): "seated" | "bounced" | null {
  const goal = chamber.goal;
  const dist = distance(state.position, { x: goal.x, y: goal.y });
  if (dist < goal.radius) {
    const speed = length(state.velocity);
    if (speed <= goal.maxEntrySpeed) {
      return "seated";
    }
    const normal = normalize(sub(state.position, { x: goal.x, y: goal.y }));
    state.position = add({ x: goal.x, y: goal.y }, scale(normal, goal.radius));
    const speedAlongNormal = state.velocity.x * normal.x + state.velocity.y * normal.y;
    state.velocity = sub(state.velocity, scale(normal, 2 * speedAlongNormal * 0.5));
    return "bounced";
  }
  return null;
}

export function stepFragment(chamber: Chamber, state: FragmentState, dt: number): StepResult {
  if (state.atRest) {
    return { collided: false, outcome: null };
  }

  state.elapsed += dt;

  const acceleration = wellAcceleration(chamber, state);
  state.velocity = add(state.velocity, scale(acceleration, dt));
  state.position = add(state.position, scale(state.velocity, dt));

  applyDustZones(chamber, state, dt);

  const goalResult = checkGoal(chamber, state);
  if (goalResult === "seated") {
    state.atRest = true;
    return { collided: false, outcome: "seated" };
  }

  const obstacleHit = resolveObstacleCollisions(chamber, state);
  const boundaryHit = resolveBoundaries(chamber, state);

  if (isVoided(chamber, state)) {
    state.atRest = true;
    return { collided: false, outcome: "voided" };
  }

  const speed = length(state.velocity);
  state.stalledFor = speed < REST_SPEED ? state.stalledFor + dt : 0;

  const stalled = state.stalledFor >= STALL_SECONDS;
  const timedOut = state.elapsed >= MAX_FLIGHT_SECONDS;
  if (stalled || timedOut) {
    state.atRest = true;
    return { collided: obstacleHit || boundaryHit, outcome: "spent" };
  }

  return { collided: obstacleHit || boundaryHit || goalResult === "bounced", outcome: null };
}

export function createInitialState(chamber: Chamber): FragmentState {
  return {
    position: { x: chamber.start.x, y: chamber.start.y },
    velocity: { x: 0, y: 0 },
    atRest: true,
    stalledFor: 0,
    elapsed: 0,
  };
}

export function launchFragment(state: FragmentState, velocity: { x: number; y: number }): void {
  state.velocity = { x: velocity.x, y: velocity.y };
  state.atRest = false;
  state.stalledFor = 0;
  state.elapsed = 0;
}
