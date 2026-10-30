import * as THREE from 'three';
import { obstacles } from './world';

export function buildArena(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x142b25);
  scene.fog = new THREE.Fog(0x142b25, 25, 65);
  scene.add(new THREE.HemisphereLight(0xe8f8d7, 0x34473a, 2.8));
  const sun = new THREE.DirectionalLight(0xffe8c2, 3);
  sun.position.set(-8, 18, 7);
  scene.add(sun);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(36, 0.2, 30),
    new THREE.MeshStandardMaterial({ color: 0x31483c, roughness: 1 }));
  floor.position.y = -0.1;
  scene.add(floor);
  const grid = new THREE.GridHelper(36, 36, 0x85916a, 0x465c48);
  grid.scale.z = 30 / 36;
  grid.position.y = 0.003;
  scene.add(grid);
  const palette = { boundary: 0x344c43, wall: 0x698171, low: 0xa6ac73,
    suspended: 0xd0904a, crate: 0x85714e, platform: 0x728b75 };
  for (const box of obstacles) {
    const geometry = new THREE.BoxGeometry(box.width, box.height, box.depth);
    const mesh = new THREE.Mesh(geometry,
      new THREE.MeshStandardMaterial({ color: palette[box.kind], roughness: 0.9 }));
    mesh.position.set(box.x, box.y, box.z);
    scene.add(mesh);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x1d3027, transparent: true, opacity: 0.5 }));
    edges.position.copy(mesh.position);
    scene.add(edges);
  }
  for (const [x, z, color] of [[-9, 12, 0xc9ed6a], [9, -12, 0xff994d]]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 48),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.012, z);
    scene.add(ring);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 256;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#13281f'; context.fillRect(0, 0, 1024, 256);
  context.fillStyle = '#c9ed6a'; context.textAlign = 'center';
  context.font = 'bold 62px "Microsoft YaHei", sans-serif';
  context.fillText('保护脚踝 · 保持移动', 512, 112);
  context.fillStyle = '#a9bea4'; context.font = '30px sans-serif';
  context.fillText('反直觉实验室  /  MOVEMENT TEST', 512, 182);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.25),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
  sign.position.set(0, 4.4, -14.98);
  scene.add(sign);
}
