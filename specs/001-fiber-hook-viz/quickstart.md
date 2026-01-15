# Quickstart: React Internals Object Visualization

**Date**: 2026-01-04  
**Branch**: `001-fiber-hook-viz`

## Run

```bash
pnpm install
pnpm dev
```

## Use

1. 打开页面后，左侧为代码输入区（CodeMirror）。
2. 粘贴一段 TSX/JSX 函数组件示例代码（包含内置 hooks，如 `useState` / `useEffect`）。
3. 点击 **「生成可视图」**：
   - 若解析成功：右侧画布出现 fiber/hook/effect/value 节点与连线
   - 若解析失败：页面展示错误提示
4. 在右侧画布中拖拽、缩放、平移以浏览结构。

## Expected UI Rules（用于自测）

- 节点 UI 必须包含：**头部**（对象名称）与 **body**（属性表）。
- 若某字段有值：
  - 必须生成"字段 → 值"连线
  - **起点**必须从该字段所在行发出
  - **终点**必须指向"值节点"的头部区域
- **节点可自由拖动**：用户可以拖动节点到任意位置。
- **基础类型值节点**：使用圆形外观（粉色）。
- **属性行存在引用时**：右侧不显示文本，仅通过连线表达关系。
- **重新生成时**：已拖动的节点保持位置，新节点使用默认布局位置。

## Notes

- 输入范围：仅支持 TSX/JSX 函数组件；仅识别 React 内置 hooks；不展开自定义 hooks。
- 连线使用 smoothstep 样式（阶梯折线）。
- 本项目为单页，无后端 API。

---

## Deploy to Vercel

### 前置条件

- 已安装 Node.js（建议 v18+）
- 已安装 pnpm
- 拥有 Vercel 账号

### 方式一：通过 Vercel CLI（推荐）

1. **安装 Vercel CLI**（如果尚未安装）：

```bash
npm install -g vercel
```

2. **在项目根目录执行部署**：

```bash
cd /path/to/react-internel-visualization
vercel --yes
```

3. **部署成功后**，终端会输出：

   - Production URL：生产环境地址
   - Inspect URL：查看部署详情

4. **后续更新部署**：

```bash
vercel --prod
```

### 方式二：通过 Vercel 网页

1. 将代码推送到 GitHub/GitLab/Bitbucket
2. 访问 [vercel.com](https://vercel.com) 并登录
3. 点击 "Add New Project" → 导入仓库
4. 配置构建参数：
   - **Framework Preset**: `Other`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### 配置文件

项目根目录已包含 `vercel.json` 配置：

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "framework": null
}
```

### 线上地址

- **Production**: https://react-internel-visualization.vercel.app
