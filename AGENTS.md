# 长期项目约束

- 用户明确要求：非绝对必要的项目文件、依赖、下载、缓存、临时文件、测试产物不得放到系统盘 C；本项目统一放在 F 盘项目文件夹下。这是持续要求，不局限于某个开发阶段。
- 开始工作先检查已有文件，不覆盖用户未提交的改动。按需求包分阶段交付，阶段记录仅描述实际完成和验证情况。
- 运行本项目命令前，将进程的 TEMP、TMP、TMPDIR 设到项目 `.cache/tmp`，NPM_CONFIG_CACHE 设到 `.cache/npm`，PLAYWRIGHT_BROWSERS_PATH 设到 `.cache/browsers`；优先用 `project.ps1`。不要改写全局 TEMP 或移动正在使用的应用运行时。
- 浏览器测试通过 `scripts/project-env.mjs` 在导入 Playwright 前配置项目内临时目录。新增下载工具也须显式指定项目内存储位置。
- 如发现本项目产生的 C 盘文件，先确认归属，迁移并验证完整性。共享缓存迁移必须保留其他项目数据与原路径兼容性，不得误删无关文件。
- `.cache`、`node_modules`、`dist` 和 `artifacts` 不提交 Git。源码和说明使用相对路径，跨电脑可重新安装运行。
