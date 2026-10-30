// Metres; centres and sizes from the independent rebuild specification.
export interface Obstacle {
  kind: 'boundary' | 'wall' | 'low' | 'suspended' | 'crate' | 'platform';
  x: number; y: number; z: number;
  width: number; height: number; depth: number;
}

export const obstacles: readonly Obstacle[] = [
  { kind: 'boundary', x: -18.5, y: 3, z: 0, width: 1, height: 6, depth: 31 },
  { kind: 'boundary', x: 18.5, y: 3, z: 0, width: 1, height: 6, depth: 31 },
  { kind: 'boundary', x: 0, y: 3, z: -15.5, width: 38, height: 6, depth: 1 },
  { kind: 'boundary', x: 0, y: 3, z: 15.5, width: 38, height: 6, depth: 1 },
  { kind: 'wall', x: -5, y: 1.65, z: -9, width: 6, height: 3.3, depth: 0.8 },
  { kind: 'wall', x: 5, y: 1.65, z: 9, width: 6, height: 3.3, depth: 0.8 },
  { kind: 'wall', x: 5, y: 1.65, z: -5, width: 0.8, height: 3.3, depth: 7 },
  { kind: 'wall', x: -5, y: 1.65, z: 5, width: 0.8, height: 3.3, depth: 7 },
  { kind: 'low', x: 0, y: 0.55, z: 0, width: 5, height: 1.1, depth: 1.1 },
  { kind: 'suspended', x: -11, y: 1.7, z: -1, width: 4, height: 2, depth: 0.65 },
  { kind: 'suspended', x: 11, y: 1.7, z: 1, width: 4, height: 2, depth: 0.65 },
  { kind: 'crate', x: -12, y: 0.6, z: 7, width: 3, height: 1.2, depth: 2.5 },
  { kind: 'crate', x: 12, y: 0.6, z: -7, width: 3, height: 1.2, depth: 2.5 },
  { kind: 'platform', x: 0, y: 0.3, z: -6, width: 3.6, height: 0.6, depth: 2 },
  { kind: 'platform', x: 0, y: 0.3, z: 6, width: 3.6, height: 0.6, depth: 2 },
];

export const movement = Object.freeze({
  speed: 5.2, sprintMultiplier: 1.4, gravity: 15, jump: 6.2,
  radius: 0.33, height: 2, eyeHeight: 1.74, maxHeight: 8,
});

export function createPlayer() {
  return { x: -9, y: 0, z: 12, vy: 0, grounded: true,
    yaw: Math.atan2(-18, 24), pitch: 0, speed: 0 };
}

export type Player = ReturnType<typeof createPlayer>;
export interface MoveInput { forward: number; right: number; sprint: boolean; jump: boolean }
const epsilon = 1e-7;

function overlapsFootprint(p: Player, box: Obstacle) {
  const dx = Math.max(Math.abs(p.x - box.x) - box.width / 2, 0);
  const dz = Math.max(Math.abs(p.z - box.z) - box.depth / 2, 0);
  return dx * dx + dz * dz < movement.radius ** 2 - epsilon;
}

function moveAxis(p: Player, axis: 'x' | 'z', amount: number, boxes: readonly Obstacle[]) {
  if (!amount) return;
  const other = axis === 'x' ? 'z' : 'x';
  const size = axis === 'x' ? 'width' : 'depth';
  const otherSize = axis === 'x' ? 'depth' : 'width';
  p[axis] += amount;
  for (const box of boxes) {
    if (p.y >= box.y + box.height / 2 - epsilon ||
        p.y + movement.height <= box.y - box.height / 2 + epsilon) continue;
    const gap = Math.max(Math.abs(p[other] - box[other]) - box[otherSize] / 2, 0);
    // Treat tangency as contact, not penetration (avoids sideways snapping).
    if (gap >= movement.radius - epsilon) continue;
    const reach = Math.sqrt(movement.radius ** 2 - gap ** 2);
    const min = box[axis] - box[size] / 2 - reach;
    const max = box[axis] + box[size] / 2 + reach;
    if (p[axis] > min && p[axis] < max) p[axis] = amount > 0 ? min : max;
  }
}

// A standing vertical cylinder slides along boxes; no automatic step-up.
export function stepPlayer(p: Player, input: MoveInput, dt: number, boxes = obstacles) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  const count = Math.ceil(Math.min(dt, 0.1) / (1 / 120));
  const h = Math.min(dt, 0.1) / count;
  for (let i = 0; i < count; i++) {
    const length = Math.hypot(input.forward, input.right);
    const speed = movement.speed * (input.sprint ? movement.sprintMultiplier : 1);
    const forward = length ? input.forward / length : 0;
    const right = length ? input.right / length : 0;
    const dx = (right * Math.cos(p.yaw) - forward * Math.sin(p.yaw)) * speed * h;
    const dz = (-forward * Math.cos(p.yaw) - right * Math.sin(p.yaw)) * speed * h;
    if (p.grounded && input.jump) { p.vy = movement.jump; p.grounded = false; }
    const oldX = p.x, oldZ = p.z;
    moveAxis(p, 'x', dx, boxes);
    moveAxis(p, 'z', dz, boxes);
    // Arena limits hold even above the visible six-metre walls.
    p.x = Math.max(-18 + movement.radius, Math.min(18 - movement.radius, p.x));
    p.z = Math.max(-15 + movement.radius, Math.min(15 - movement.radius, p.z));
    p.speed = Math.hypot(p.x - oldX, p.z - oldZ) / h;
    const oldY = p.y;
    p.vy -= movement.gravity * h;
    p.y += p.vy * h;
    p.grounded = false;
    for (const box of boxes) {
      if (!overlapsFootprint(p, box)) continue;
      const top = box.y + box.height / 2;
      const bottom = box.y - box.height / 2;
      if (p.vy <= 0 && oldY >= top - epsilon && p.y <= top) {
        p.y = top; p.vy = 0; p.grounded = true;
      } else if (p.vy > 0 && oldY + movement.height <= bottom + epsilon &&
                 p.y + movement.height >= bottom) {
        p.y = bottom - movement.height; p.vy = 0;
      }
    }
    if (p.y <= 0) { p.y = 0; p.vy = 0; p.grounded = true; }
    if (p.y > movement.maxHeight) { p.y = movement.maxHeight; p.vy = Math.min(0, p.vy); }
  }
}
