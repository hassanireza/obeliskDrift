import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Chamber, FragmentState, RunOutcome } from "../physics/types";
import { createInitialState, launchFragment, stepFragment } from "../physics/engine";
import { distance, length, sub } from "../physics/vector";
import { playCollision, playLaunch, playSeated, playVoided } from "../lib/audio";

interface GameCanvasProps {
  chamber: Chamber;
  onSeated: (launchesUsed: number) => void;
  onSpentOut: (launchesUsed: number) => void;
  launchesUsed: number;
  onLaunch: () => void;
}

interface DragState {
  pointerId: number;
  origin: { x: number; y: number };
  current: { x: number; y: number };
}

const MAX_DRAG_PIXELS = 150;
const TRAIL_LENGTH = 26;

export function GameCanvas({ chamber, onSeated, onSpentOut, launchesUsed, onLaunch }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<FragmentState>(createInitialState(chamber));
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
  const dragRef = useRef<DragState | null>(null);
  const [, forceRender] = useState(0);
  const outcomeReportedRef = useRef(false);

  const resetFragment = useCallback(() => {
    stateRef.current = createInitialState(chamber);
    trailRef.current = [];
  }, [chamber]);

  useEffect(() => {
    resetFragment();
    outcomeReportedRef.current = false;
    dragRef.current = null;
  }, [chamber, resetFragment]);

  // Map a client-space pointer event to chamber world coordinates.
  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = chamber.width / rect.width;
      const scaleY = chamber.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [chamber.width, chamber.height]
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const state = stateRef.current;
      if (!state.atRest || launchesUsed >= chamber.maxLaunches) return;
      const world = toWorld(event.clientX, event.clientY);
      if (distance(world, state.position) > 70) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { pointerId: event.pointerId, origin: world, current: world };
      forceRender((n) => n + 1);
    },
    [chamber.maxLaunches, launchesUsed, toWorld]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      drag.current = toWorld(event.clientX, event.clientY);
      forceRender((n) => n + 1);
    },
    [toWorld]
  );

  const releaseDrag = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;

      const pull = sub(drag.origin, drag.current);
      const pullLength = length(pull);
      if (pullLength > 6) {
        const clamped = Math.min(pullLength, MAX_DRAG_PIXELS) / MAX_DRAG_PIXELS;
        const power = clamped * chamber.launchPowerCap;
        const dirX = pull.x / pullLength;
        const dirY = pull.y / pullLength;
        launchFragment(stateRef.current, { x: dirX * power, y: dirY * power });
        playLaunch();
        onLaunch();
      }
      forceRender((n) => n + 1);
    },
    [chamber.launchPowerCap, onLaunch]
  );

  // Main physics + render loop.
  useEffect(() => {
    let frame = 0;
    let lastTime = performance.now();

    const step = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 1 / 30);
      lastTime = time;
      const state = stateRef.current;

      if (!state.atRest && !outcomeReportedRef.current) {
        const result = stepFragment(chamber, state, dt);
        trailRef.current.push({ x: state.position.x, y: state.position.y });
        if (trailRef.current.length > TRAIL_LENGTH) trailRef.current.shift();

        if (result.collided) {
          playCollision(Math.min(1, length(state.velocity) / 400));
        }
        if (result.outcome === "seated") {
          outcomeReportedRef.current = true;
          playSeated();
          onSeated(launchesUsed + 1);
        } else if (result.outcome === "voided" || result.outcome === "spent") {
          if (result.outcome === "voided") playVoided();
          const nextLaunches = launchesUsed + 1;
          if (nextLaunches >= chamber.maxLaunches) {
            outcomeReportedRef.current = true;
            onSpentOut(nextLaunches);
          } else {
            resetFragment();
          }
        }
      }

      render();
      frame = requestAnimationFrame(step);
    };

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const targetWidth = chamber.width * dpr;
      const targetHeight = chamber.height * dpr;
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScene(ctx, chamber, stateRef.current, trailRef.current, dragRef.current);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [chamber, launchesUsed, onSeated, onSpentOut, resetFragment]);

  return (
    <div className="obelisk-canvas-wrapper" ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        className="obelisk-canvas"
        style={{ aspectRatio: `${chamber.width} / ${chamber.height}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={releaseDrag}
        onPointerCancel={releaseDrag}
      />
    </div>
  );
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  chamber: Chamber,
  state: FragmentState,
  trail: Array<{ x: number; y: number }>,
  drag: DragState | null
) {
  const { width, height } = chamber;

  ctx.clearRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(
    width * 0.35,
    height * 0.12,
    height * 0.05,
    width * 0.5,
    height * 0.5,
    height * 0.85
  );
  vignette.addColorStop(0, "#1a1c20");
  vignette.addColorStop(0.45, "#0c0e12");
  vignette.addColorStop(1, "#030304");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  for (const zone of chamber.dustZones) {
    ctx.fillStyle = "rgba(139, 143, 148, 0.08)";
    ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
    ctx.strokeStyle = "rgba(139, 143, 148, 0.14)";
    ctx.setLineDash([2, 6]);
    ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
    ctx.setLineDash([]);
  }

  for (const well of chamber.wells) {
    const rings = 3;
    for (let i = rings; i >= 1; i -= 1) {
      const r = (well.radius * i) / rings;
      ctx.beginPath();
      ctx.arc(well.x, well.y, r, 0, Math.PI * 2);
      const alpha = well.strength > 0 ? 0.05 : 0.035;
      ctx.strokeStyle =
        well.strength > 0 ? `rgba(168, 164, 154, ${alpha})` : `rgba(90, 96, 102, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(well.x, well.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = well.strength > 0 ? "rgba(233, 230, 223, 0.5)" : "rgba(90, 96, 102, 0.5)";
    ctx.fill();
  }

  for (const obstacle of chamber.obstacles) {
    const grad = ctx.createRadialGradient(
      obstacle.x - obstacle.radius * 0.3,
      obstacle.y - obstacle.radius * 0.35,
      obstacle.radius * 0.1,
      obstacle.x,
      obstacle.y,
      obstacle.radius
    );
    grad.addColorStop(0, "#c9c5ba");
    grad.addColorStop(0.55, "#8b8f94");
    grad.addColorStop(1, "#1c1e22");
    ctx.beginPath();
    ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  const goal = chamber.goal;
  ctx.beginPath();
  ctx.arc(goal.x, goal.y, goal.radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(233, 230, 223, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(goal.x, goal.y, goal.radius * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(12, 14, 18, 0.85)";
  ctx.fill();

  for (let i = 0; i < trail.length; i += 1) {
    const point = trail[i];
    if (!point) continue;
    const alpha = (i / trail.length) * 0.25;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(233, 230, 223, ${alpha})`;
    ctx.fill();
  }

  const fragGrad = ctx.createRadialGradient(
    state.position.x - 3,
    state.position.y - 4,
    1,
    state.position.x,
    state.position.y,
    chamber.fragmentRadius + 6
  );
  fragGrad.addColorStop(0, "#f2f0ea");
  fragGrad.addColorStop(0.5, "#c9c5ba");
  fragGrad.addColorStop(1, "rgba(20, 22, 26, 0)");
  ctx.beginPath();
  ctx.arc(state.position.x, state.position.y, chamber.fragmentRadius + 6, 0, Math.PI * 2);
  ctx.fillStyle = fragGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(state.position.x, state.position.y, chamber.fragmentRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#e9e6df";
  ctx.fill();

  if (drag) {
    const pull = sub(drag.origin, drag.current);
    const pullLength = length(pull);
    const clamped = Math.min(pullLength, MAX_DRAG_PIXELS);
    const dirX = pullLength > 0.001 ? pull.x / pullLength : 0;
    const dirY = pullLength > 0.001 ? pull.y / pullLength : 0;
    const aimX = state.position.x + dirX * clamped;
    const aimY = state.position.y + dirY * clamped;

    ctx.beginPath();
    ctx.moveTo(state.position.x, state.position.y);
    ctx.lineTo(aimX, aimY);
    ctx.strokeStyle = "rgba(233, 230, 223, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(aimX, aimY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(233, 230, 223, 0.8)";
    ctx.fill();
  }
}

export type { RunOutcome };
