# 树脂微缩场景作品集

三个独立的桌面端交互式三维网页，保留各自当前完成版本。

| 作品 | 源码目录 | 本地端口 |
| --- | --- | --- |
| 静泊 · 地中海海湾渔村 | [resin-bay](resin-bay/) | 5194 |
| 集装箱港口 | [resin-port](resin-port/) | 5196 |
| 月栖 · 月球湖泊与地质剖面 | [lunar-resin](lunar-resin/) | 5197 |

## 运行

安装 Node.js 22.12+ 和 pnpm 11.25.0。进入任意作品目录后独立安装、运行：

```sh
cd lunar-resin
pnpm install --frozen-lockfile
pnpm dev
```

浏览器打开终端显示的本地地址，无需登录。

```sh
pnpm build
pnpm preview
```

各作品独立构建，生成的 `dist/` 可发布到静态网站托管平台。本仓库上传源码，不自动启用网站托管。

## 技术

Vite、React、TypeScript、Three.js、React Three Fiber v9、drei、postprocessing、Leva。模型与表面纹理由代码生成。水面使用 WebGL GPU 高度场与双缓冲渲染目标模拟传播波纹；透明体积、水面渲染与交互分离。

当前作品未接入 WebGPU/SPH；相关技术提示词属于后续方案。

## 验证与依赖

三个作品均通过 TypeScript 检查和 Vite 生产构建。主要面向桌面浏览器，需启用硬件加速；性能取决于 GPU 和画质设置。环境光预设和网页字体需要网络，字体设有本地回退。

依赖目录、构建输出、本地配置和临时文件不纳入仓库。
