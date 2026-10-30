import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, stepPlayer, obstacles } from '../src/world.ts';

const idle = { forward: 0, right: 0, sprint: false, jump: false };
const playerAt = (overrides = {}) => Object.assign(createPlayer(), { x: 0, z: 0, yaw: 0 }, overrides);
function simulate(p, input, seconds, boxes = [], fps = 60) {
  for (let i = 0; i < Math.round(seconds * fps); i++) stepPlayer(p, { ...idle, ...input }, 1 / fps, boxes);
  return p;
}
const near = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≈ ${expected}`);

test('walking, sprint and diagonals use the specified speeds at 30/60/144 FPS', () => {
  for (const fps of [30, 60, 144]) {
    for (const sprint of [false, true]) {
      for (const right of [0, 1]) {
        const p = simulate(playerAt(), { forward: 1, right, sprint }, 1, [], fps);
        near(Math.hypot(p.x, p.z), sprint ? 7.28 : 5.2);
      }
    }
  }
});

test('movement follows heading; looking up/down does not alter walking speed', () => {
  const p = simulate(playerAt({ yaw: Math.PI / 2, pitch: 1.5 }), { forward: 1 }, 1);
  near(p.x, -5.2); near(p.z, 0);
});

test('key release stops horizontal movement immediately, including in air', () => {
  const p = simulate(playerAt(), { forward: 1, jump: true }, 0.2);
  const { x, z } = p;
  stepPlayer(p, idle, 1 / 60, []);
  near(p.x, x); near(p.z, z); near(p.speed, 0);
});

test('jump apex, landing and held-space auto-jump', () => {
  const p = playerAt();
  stepPlayer(p, { ...idle, jump: true }, 1 / 120, []);
  let apex = p.y;
  for (let i = 0; i < 119; i++) { stepPlayer(p, idle, 1 / 120, []); apex = Math.max(apex, p.y); }
  assert.ok(apex > 1.23 && apex < 1.30, `apex ${apex}`);
  near(p.y, 0); assert.equal(p.grounded, true);
  simulate(p, { jump: true }, 1);
  assert.ok(p.y > 0.2, 'holding jump should begin the next jump');
});

test('solid wall blocks at cylinder radius, allows sliding and cannot tunnel at low FPS', () => {
  const wall = [{ kind: 'wall', x: 0, y: 2, z: 0, width: 8, height: 4, depth: 0.8 }];
  const p = simulate(playerAt({ z: 3 }), { forward: 1, sprint: true }, 2, wall, 10);
  near(p.z, 0.73);
  simulate(p, { forward: 1, right: 1 }, 0.3, wall);
  assert.ok(p.x > 1); near(p.z, 0.73);
});

test('low platform requires jumping, supports landing and permits walking off', () => {
  const platform = [{ kind: 'platform', x: 0, y: 0.3, z: 0, width: 3.6, height: 0.6, depth: 2 }];
  const p = simulate(playerAt({ z: 2 }), { forward: 1 }, 0.3, platform);
  near(p.z, 1.33); near(p.y, 0);
  simulate(p, { forward: 1, jump: true }, 0.3, platform);
  assert.ok(p.z < 1 && p.y > 0.6);
  simulate(p, idle, 1, platform);
  near(p.y, 0.6); assert.equal(p.grounded, true);
  simulate(p, { right: 1 }, 1, platform);
  simulate(p, idle, 1, platform);
  near(p.y, 0);
});

test('ceiling stops upward velocity without penetrating the slab', () => {
  const ceiling = [{ kind: 'suspended', x: 0, y: 3, z: 0, width: 4, height: 0.5, depth: 4 }];
  const p = playerAt();
  let apex = 0;
  stepPlayer(p, { ...idle, jump: true }, 1 / 120, ceiling);
  for (let i = 0; i < 100; i++) { stepPlayer(p, idle, 1 / 120, ceiling); apex = Math.max(apex, p.y); }
  near(apex, 0.75); near(p.y, 0);
});

test('bounds also block movement above walls; opposite spawn is faced on reset', () => {
  const p = simulate(playerAt({ x: 17, y: 7, vy: 8 }), { right: 1, sprint: true }, 0.5);
  near(p.x, 17.67); assert.ok(p.y <= 8);
  const spawn = createPlayer();
  near(-Math.sin(spawn.yaw), 0.6); near(-Math.cos(spawn.yaw), -0.8);
  const atSpawn = simulate(spawn, idle, 1, obstacles);
  near(atSpawn.x, -9); near(atSpawn.z, 12); near(atSpawn.y, 0);
});
