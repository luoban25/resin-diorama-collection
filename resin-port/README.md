# 集装箱港口微缩场景

桌面端等距交互场景：透明树脂海水展示块、码头、集装箱、岸桥与货船。模型通过代码生成，使用与海湾作品一致的 GPU 水面和参数调校系统。

## 运行

Node.js 22.12+，pnpm 11.25.0。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

打开 http://127.0.0.1:5196/ 。

```sh
pnpm build
pnpm preview
```

鼠标拖拽旋转、滚轮缩放、水面点击与移动产生扰动。完整操作以页面提示为准。生产构建通过 TypeScript 和 Vite 检查。
