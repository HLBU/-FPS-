import * as THREE from 'three';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <main>
    <header><span class="brand">反直觉实验室 / FPS</span><span class="badge">阶段 01 · 启动验证</span></header>
    <section class="intro"><p class="eyebrow">ANTI-INSTINCT / PROTOTYPE 001</p>
      <h1>史上最反人类 <em>FPS</em></h1>
      <p class="lead">保护脚踝。保持移动。重新学习射击。</p>
    </section>
    <section class="preview" aria-label="3D 渲染验证场景">
      <div id="viewport"></div>
      <div class="scene-label">RENDER CHECK <span>渲染验证场景 · 非游戏画面</span></div>
    </section>
    <section class="info"><div><p class="eyebrow">运行状态</p><p id="status" role="status" data-state="loading">正在初始化 3D 渲染…</p></div>
      <div><p class="eyebrow">当前交付</p><p>项目骨架 / 本地启动 / 3D 渲染</p></div>
      <div><p class="eyebrow">下一阶段</p><p>竞技场 / 鼠标视角 / 移动与跳跃</p></div>
    </section>
    <footer>当前版本尚未开放对局，移动、射击、能力与联机将在后续阶段加入。</footer>
  </main>`;

const viewport = document.querySelector<HTMLDivElement>('#viewport')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
function fail(message: string) {
  status.dataset.state = 'error';
  status.textContent = message;
}

try {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x10241c);
  viewport.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '绿色网格上的橙色立方体');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(7, 5, 9);
  camera.lookAt(0, 0.6, 0);
  scene.add(new THREE.HemisphereLight(0xe8ffcd, 0x203a2d, 3));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(4, 6, 3);
  scene.add(light);
  const grid = new THREE.GridHelper(18, 18, 0x8ea45c, 0x294c39);
  scene.add(grid);
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const material = new THREE.MeshStandardMaterial({ color: 0xf28a43, roughness: 0.65 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.y = 0.76;
  cube.rotation.y = Math.PI / 5;
  scene.add(cube);
  const draw = () => {
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  const resize = new ResizeObserver(draw);
  resize.observe(viewport);
  draw();
  status.dataset.state = 'ready';
  status.textContent = '启动成功 · WebGL 2 渲染正常';
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    fail('图形上下文已丢失，请刷新页面重试。');
  });
  window.addEventListener('pagehide', () => {
    resize.disconnect();
    geometry.dispose();
    material.dispose();
    grid.dispose();
    renderer.dispose();
  }, { once: true });
} catch {
  fail('无法启动 3D 渲染。请使用支持 WebGL 2 的桌面浏览器，启用硬件加速后刷新。');
}
