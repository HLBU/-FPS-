import * as THREE from 'three';
import { buildArena } from './arena';
import { createPlayer, movement, stepPlayer } from './world';
import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main>
    <div id="viewport" aria-label="第一人称竞技场"></div>
    <header><div class="brand">反直觉实验室 <span>移动测试场 / 02</span></div><button id="pause" type="button">暂停 · ESC</button></header>
    <div class="crosshair" aria-hidden="true">+</div>
    <aside class="telemetry" aria-label="移动状态">
      <div><span>实际水平速度</span><strong id="speed">0.00 <small>m/s</small></strong></div>
      <div><span>脚底高度</span><strong id="height">0.00 <small>m</small></strong></div>
      <div><span>状态</span><strong id="stance">地面</strong></div>
      <p id="position"></p>
    </aside>
    <div class="stage-note">阶段 02 · 自由移动原型 <span id="input-mode">射击 / 能力 / 人机尚未开放</span></div>
    <div id="overlay">
      <section class="panel">
        <p class="eyebrow">ANTI-INSTINCT / MOVEMENT LAB</p>
        <h1>先学会<span>自由移动。</span></h1>
        <p class="lead">走过转角，跳上低台，感受每一次启停。</p>
        <div class="keys"><p><kbd>W A S D</kbd> 移动</p><p><kbd>鼠标</kbd> 自由转向</p><p><kbd>Shift</kbd> 按住疾跑</p><p><kbd>空格</kbd> 跳跃 / 按住连跳</p><p><kbd>ESC</kbd> 暂停并释放鼠标</p></div>
        <p id="status" role="status" data-state="loading">正在初始化竞技场…</p>
        <button id="enter" class="primary" type="button" disabled>进入测试场</button>
        <div class="secondary"><button id="reset" type="button">回到出生点</button><button id="fallback" type="button" disabled>窗口内鼠标模式</button></div>
        <p id="hint">点击进入后锁定鼠标，可无限转向。ESC 暂停，点击继续恢复。</p>
      </section>
    </div>
  </main>`;

const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const viewport = get<HTMLDivElement>('viewport');
const overlay = get<HTMLDivElement>('overlay');
const status = get<HTMLParagraphElement>('status');
const enter = get<HTMLButtonElement>('enter');
const fallback = get<HTMLButtonElement>('fallback');
const hint = get<HTMLParagraphElement>('hint');
const position = get<HTMLParagraphElement>('position');
const speed = get<HTMLElement>('speed');
const height = get<HTMLElement>('height');
const stance = get<HTMLElement>('stance');
const player = createPlayer();
const keys = new Set<string>();
let active = false;
let windowMode = false;
let ready = false;

function pause() {
  active = false;
  keys.clear();
  player.speed = 0;
  overlay.hidden = false;
  enter.textContent = '继续测试';
  if (document.pointerLockElement) document.exitPointerLock();
}

function activate(freeMouse = false) {
  windowMode = freeMouse;
  active = true;
  overlay.hidden = true;
  keys.clear();
  get('input-mode').textContent = freeMouse
    ? '窗口模式 · 转向受窗口边缘限制' : '鼠标已锁定 · ESC 暂停';
  hint.textContent = freeMouse
    ? '窗口模式只在画面内转向，鼠标到达窗口边缘后受限，不支持无限转向。'
    : '点击进入后锁定鼠标，可无限转向。ESC 暂停，点击继续恢复。';
}

try {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewport.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '竞技场三维画面');
  const scene = new THREE.Scene();
  buildArena(scene);
  const camera = new THREE.PerspectiveCamera(78, 1, 0.05, 120);
  camera.rotation.order = 'YXZ';
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const resize = new ResizeObserver(() => {
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
  });
  resize.observe(viewport);

  enter.addEventListener('click', () => {
    if (!ready) return;
    try {
      // Request directly from a user gesture.
      const request = renderer.domElement.requestPointerLock();
      request?.catch(() => {
        hint.textContent = '鼠标锁定被拒绝。请再次点击，或选择窗口内鼠标模式（无法无限转向）。';
      });
    } catch {
      hint.textContent = '此浏览器无法锁定鼠标，请选择窗口内鼠标模式（无法无限转向）。';
    }
  }, options);
  fallback.addEventListener('click', () => { if (ready) activate(true); }, options);
  get('pause').addEventListener('click', pause, options);
  get('reset').addEventListener('click', () => {
    Object.assign(player, createPlayer());
    keys.clear();
    hint.textContent = '已回到出生点。点击进入测试场继续。';
  }, options);
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) activate();
    else if (!windowMode) pause();
  }, options);
  document.addEventListener('pointerlockerror', () => {
    hint.textContent = '鼠标锁定失败。请再次点击，或使用窗口内鼠标模式（无法无限转向）。';
  }, options);
  document.addEventListener('keydown', event => {
    if (event.code === 'Escape') { pause(); return; }
    if (!active) return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'Space'].includes(event.code)) {
      event.preventDefault(); keys.add(event.code);
    }
  }, options);
  document.addEventListener('keyup', event => keys.delete(event.code), options);
  document.addEventListener('mousemove', event => {
    if (!active || (windowMode && event.target !== renderer.domElement)) return;
    player.yaw -= event.movementX * 0.002;
    player.yaw = Math.atan2(Math.sin(player.yaw), Math.cos(player.yaw));
    player.pitch = THREE.MathUtils.clamp(player.pitch - event.movementY * 0.002, -1.54, 1.54);
  }, options);
  window.addEventListener('blur', pause, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, options);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); pause(); ready = false;
    status.dataset.state = 'error'; status.textContent = '图形上下文已丢失，请刷新页面。';
    enter.disabled = true; fallback.disabled = true;
  }, options);

  let lastTime = performance.now();
  let frame = 0;
  function render(now: number) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    if (active) stepPlayer(player, {
      forward: Number(keys.has('KeyW')) - Number(keys.has('KeyS')),
      right: Number(keys.has('KeyD')) - Number(keys.has('KeyA')),
      sprint: keys.has('ShiftLeft') || keys.has('ShiftRight'), jump: keys.has('Space'),
    }, dt);
    camera.position.set(player.x, player.y + movement.eyeHeight, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
    speed.innerHTML = `${player.speed.toFixed(2)} <small>m/s</small>`;
    height.innerHTML = `${player.y.toFixed(2)} <small>m</small>`;
    stance.textContent = !active ? '已暂停' : player.grounded ? '地面' : '腾空';
    position.textContent = `X ${player.x.toFixed(2)} / Z ${player.z.toFixed(2)}`;
    Object.assign(position.dataset, { x: String(player.x), y: String(player.y), z: String(player.z),
      yaw: String(player.yaw), pitch: String(player.pitch), active: String(active), grounded: String(player.grounded) });
    renderer.render(scene, camera);
    if (!ready && status.dataset.state === 'loading') {
      ready = true; status.dataset.state = 'ready'; status.textContent = '竞技场就绪 · WebGL 2 渲染正常';
      enter.disabled = false; fallback.disabled = false;
    }
    frame = requestAnimationFrame(render);
  }
  frame = requestAnimationFrame(render);
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(frame); abort.abort(); resize.disconnect();
    scene.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose();
          material.dispose();
        }
      }
    });
    renderer.dispose();
  }, { once: true });
} catch {
  status.dataset.state = 'error';
  status.textContent = '无法启动竞技场。请使用支持 WebGL 2 的浏览器，启用硬件加速后刷新。';
}
