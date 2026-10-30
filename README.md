# 史上最反人类 FPS

电脑键鼠浏览器 3D 对战原型。当前仅完成阶段 1：最小项目和启动验证；不是可玩的 FPS。

## 环境

- Node.js 22.12 或更新版本，建议 Node.js 24 LTS，附带 npm。
- 支持 WebGL 2 的桌面 Chrome 或 Edge，启用硬件加速。
- 首次安装需要访问 npm 仓库；游戏页面不依赖账号、远程资源或外部素材。

## 本地启动（Windows PowerShell）

在项目目录打开终端：

```powershell
npm.cmd ci
npm.cmd run dev
```

浏览器访问终端打印的地址，通常为 http://127.0.0.1:5173 。若端口被占用，以终端实际地址为准。看到橙色立方体、绿色网格和“启动成功 · WebGL 2 渲染正常”表示初始化成功。当前场景静态显示，不响应游戏操作。

停止服务：终端按 Ctrl+C。后续启动只需要 `npm.cmd run dev`；依赖变动后重新执行 `npm.cmd ci`。使用 `npm.cmd` 避免 PowerShell 对 npm.ps1 的执行策略限制。

## 构建与预览

```powershell
npm.cmd run build
npm.cmd run preview
```

预览地址通常为 http://127.0.0.1:4173 。构建文件生成到 `dist/`，应通过 HTTP 服务访问，不能直接双击 HTML。目前服务只监听本机；真人联机将在阶段 7 实现。

## 启动检查

保持开发服务运行，在另一个终端执行：

```powershell
npm.cmd run test:smoke
```

检查使用本机 Chrome 的无界面模式，验证页面返回成功、3D 初始化成功、控制台没有错误以及窄窗口不溢出，并在 `artifacts/` 输出截图。使用 Edge 或其他地址：

```powershell
$env:BROWSER_CHANNEL = 'msedge'
$env:SMOKE_URL = 'http://127.0.0.1:4173'
npm.cmd run test:smoke
```

如果没有 Chrome/Edge，可执行 `npx.cmd playwright install chromium`，并将 `BROWSER_CHANNEL` 设置为 `chromium` 后运行检查。下载浏览器只为验证使用，不是启动游戏的前提。

## 代码与后续范围

- `src/main.ts`：启动页、渲染初始化、错误提示和资源释放。
- `src/style.css`：启动页样式。
- `scripts/smoke.mjs`：真实浏览器启动检查。
- `docs/progress.md`：阶段记录、验证结果和下一阶段范围。

目前没有移动、射击、机器人、选卡、声音或联机功能。下一阶段只增加地图、鼠标视角、基础移动、碰撞和跳跃。

依赖版本由 `package-lock.json` 锁定。Three.js、Vite、TypeScript、Playwright 均保留包内第三方许可证；本阶段没有引入图片、模型或音频素材。需求包和策划数值没有放入网页公开资源目录。
