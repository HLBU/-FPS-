# 史上最反人类 FPS

电脑键鼠浏览器 3D 对战原型。当前完成阶段 2：竞技场、鼠标视角与基础移动，可自由走动和跳跃，尚未加入战斗。

## 环境

- Node.js 22.12 或更新版本，建议 Node.js 24 LTS，附带 npm。
- 支持 WebGL 2 的桌面 Chrome 或 Edge，启用硬件加速。
- 首次安装需要访问 npm 仓库；游戏页面不依赖账号、远程资源或外部素材。

## 存储约束（长期）

项目、依赖、构建、截图、缓存和临时文件统一保存在 F 盘项目目录，非绝对必要不写 C 盘。此规则已写入 `AGENTS.md`。

- `.cache/npm`：npm 下载缓存与日志；项目 `.npmrc` 指定此目录。
- `.cache/tmp`：项目命令与浏览器自动检查的临时目录。
- `.cache/browsers`：需要额外下载浏览器时的存放目录。
- `node_modules`、`dist`、`artifacts`：依赖、构建产物和截图。

原 C 盘 npm 缓存已迁入本项目 `.cache/npm`，逐文件 SHA-256 校验通过。原路径只保留目录链接，兼容其他项目；迁移保留了共享缓存的全部内容。不要单独删除或搬走目标目录；如需移动整个项目，须同步调整原目录链接。

下方使用 `project.ps1`，在子进程中设置项目临时目录，不改系统全局 TEMP。`-ExecutionPolicy Bypass` 仅对该次进程生效，不修改系统执行策略。

## 本地启动（Windows PowerShell）

在项目目录打开终端：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\project.ps1 -Task install
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\project.ps1 -Task dev
```

浏览器访问终端打印的地址，通常为 http://127.0.0.1:5173 。若端口被占用，以终端实际地址为准。看到“竞技场就绪 · WebGL 2 渲染正常”后，点击“进入测试场”开始。

WASD 移动；左右 Shift 均可疾跑；空格跳跃，按住可落地连跳；鼠标直接转向，不需要按右键。ESC 暂停并释放鼠标，点击“继续测试”恢复；暂停菜单可回到出生点。切换窗口或切到后台自动暂停，清空按键，恢复后不会自动走动。

若浏览器拒绝鼠标锁定，可点击菜单中的“窗口内鼠标模式”；此模式只在画面内转向，受窗口边缘限制，不具备无限转向能力。建议使用完整桌面浏览器试玩。

停止服务：终端按 Ctrl+C。依赖已安装时可跳过 install，直接执行 dev 命令。

## 构建与预览

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\project.ps1 -Task build
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\project.ps1 -Task preview
```

预览地址通常为 http://127.0.0.1:4173 。构建文件生成到 `dist/`，应通过 HTTP 服务访问，不能直接双击 HTML。目前服务只监听本机；真人联机将在阶段 7 实现。

## 启动检查

保持开发服务运行，在另一个终端执行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\project.ps1 -Task test:smoke
```

检查使用本机 Chrome 的无界面模式，验证 WebGL、原生鼠标锁定、地面/空中转向、移动/松键停止、跳跃、暂停/恢复、重置、右 Shift、失焦清键、锁定失败恢复及窄窗口布局，并在 `artifacts/` 输出截图。使用 Edge 或其他地址：

```powershell
$env:BROWSER_CHANNEL = 'msedge'
$env:SMOKE_URL = 'http://127.0.0.1:4173'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\project.ps1 -Task test:smoke
```

如果没有 Chrome/Edge，可执行 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\project.ps1 -Task install:browser`，并将 `BROWSER_CHANNEL` 设置为 `chromium` 后运行检查。浏览器下载到项目 `.cache/browsers`，仅为验证使用，不是启动游戏的前提。

## 第二阶段手动验收

1. 进入测试场，移动鼠标可环视；跳跃时仍可转向，抬头低头不会改变移动速度。
2. 在空旷处走动，左下角速度应为 5.20 m/s；按住任意 Shift 应为 7.28 m/s。W+D 斜向不会更快，松键速度立即归零。
3. 朝墙移动应被挡住，斜着移动能沿墙滑动；顶着墙时显示的是实际速度，而不是按键目标速度。
4. 找到靠近中央的矮平台（X=0、Z=±6，高 0.6 米），走路不会自动踏上，跳跃可上台并站稳；离开台面后落地。箱体高 1.2 米，需要接近跳跃最高点才能跳上。
5. 按住空格验证落地连跳，松开后正常落地；跳跃最高脚底高度约 1.25 米，沿平台起跳时高度相对平台计算。
6. ESC 后位置和高度冻结、鼠标释放；点击继续可恢复。移动中切换窗口，再回来应显示暂停菜单；恢复后不应持续移动。
7. 暂停菜单点击“回到出生点”，应回到 X=-9、Z=12，朝向对侧。浏览器缩放窗口后画面比例正常。

物理逻辑检查（不需要启动网页）：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\project.ps1 -Task test:physics
```

该检查需要 Node.js 22.18+ 或 24+（使用 Node 原生 TypeScript 类型擦除），游戏安装与构建仍支持 Node.js 22.12+。

## 代码与后续范围

- `src/main.ts`：游戏循环、输入、鼠标锁定、暂停、HUD 和资源释放。
- `src/world.ts`：地图几何、移动数值与圆柱角色碰撞。
- `src/arena.ts`：地图渲染与出生标记。
- `src/style.css`：菜单与 HUD 样式。
- `scripts/smoke.mjs`：真实浏览器交互检查。
- `scripts/movement.test.mjs`：速度、跳跃与碰撞检查。
- `docs/progress.md`：阶段记录、验证结果和下一阶段范围。

目前没有射击、蹲趴、探头、肩射、短冲、机器人、选卡、声音或联机功能。下一阶段增加武器、部位命中、伤害、手动换弹、跑跳精度及射击反推。

依赖版本由 `package-lock.json` 锁定。Three.js、Vite、TypeScript、Playwright 均保留包内第三方许可证；本阶段没有引入图片、模型或音频素材。需求包和策划数值没有放入网页公开资源目录。
