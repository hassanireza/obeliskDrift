export interface Vec2 {
  x: number;
  y: number;
}

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });

export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });

export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });

export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

export const length = (a: Vec2): number => Math.sqrt(a.x * a.x + a.y * a.y);

export const lengthSq = (a: Vec2): number => a.x * a.x + a.y * a.y;

export const normalize = (a: Vec2): Vec2 => {
  const len = length(a);
  if (len < 1e-6) return { x: 0, y: 0 };
  return { x: a.x / len, y: a.y / len };
};

export const clampLength = (a: Vec2, max: number): Vec2 => {
  const len = length(a);
  if (len <= max || len < 1e-6) return a;
  return scale(a, max / len);
};

export const distance = (a: Vec2, b: Vec2): number => length(sub(a, b));
