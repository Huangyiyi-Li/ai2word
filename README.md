# MD2Word - AI对话导出Word工具

将 ChatGPT、Claude 等 AI 对话内容导出为 Word 文档，支持 Markdown、LaTeX 公式、Mermaid 图表、代码高亮。

## ✨ 特性

- 🔌 **浏览器插件**：侧边栏读取 AI 对话，选择性导出
- 🌐 **独立网页版**：支持粘贴/拖拽 Markdown 导出
- 📐 **LaTeX 公式**：转为 Word 原生**可编辑**公式
- � **原生脚注**：支持 `[^1]` 语法，导出 Word 真实页脚注释，支持跳转
- 🔗 **超链接**：Markdown 链接导出为 Word 可点击蓝字
- �📊 **Mermaid 图表**：渲染为图片嵌入
- ✅ **任务列表**：`- [x]` 格式完整保留
- 💻 **代码高亮**：保持代码格式
- � **高级解析**：递归支持 `**加粗 *斜体***` 等嵌套样式

## 📋 支持的格式

| 格式 | Word效果 | 可编辑 |
| :--- | :--- | :--- |
| Markdown (标题/列表/表格) | ✅ 原生格式 | ✅ |
| LaTeX 公式 `$E=mc^2$` | ✅ Word公式 | ✅ |
| 脚注 `[^1]` | ✅ 原生脚注 | ✅ |
| 链接 `[text](url)` | ✅ 网页链接 | ✅ |
| 代码块 | ✅ 等宽字体 | ✅ |
| 任务列表 `- [x]` | ✅ 复选框 | ✅ |
| 删除线 `~~text~~` | ✅ 删除线 | ✅ |
| Mermaid 图表 | ✅ PNG图片 | ❌ |

## 📦 项目结构

```text
├── extension/           # 浏览器插件
│   ├── manifest.json    # 插件配置 (Manifest V3)
│   ├── background.js    # Service Worker
│   ├── content/         # 内容脚本
│   ├── sidepanel/       # 侧边栏UI
│   ├── lib/             # 转换库
│   └── icons/           # 图标
├── webapp/              # 独立网页版
│   └── index.html       # 单文件应用
└── PRD/                 # 产品文档
```

## 🚀 使用方法

### 浏览器插件使用

1. **安装插件**
   - 打开 Chrome/Edge 浏览器，进入 `chrome://extensions/`
   - 开启「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择 `extension` 文件夹

2. **使用插件**
   - 打开任意 AI 对话网站 (ChatGPT/Claude/DeepSeek 等)
   - 点击插件图标打开侧边栏
   - 选择要导出的对话消息
   - 点击「导出 Word」

### 独立网页版使用

1. **本地运行**

   ```bash
   # 进入 webapp 目录
   cd webapp
   
   # 使用任意静态服务器
   npx serve .
   # 或
   python -m http.server 8080
   ```

2. **在线使用**
   - 直接用浏览器打开 `webapp/index.html`
   - 粘贴或拖拽 Markdown 内容
   - 点击「导出 Word」

## 🎯 支持的 AI 平台

| 平台 | 消息扫描 | LaTeX提取 | 脚注提取 |
| :--- | :--- | :--- | :--- |
| ChatGPT | ✅ | ✅ | ✅ |
| Claude | ✅ | ✅ | ✅ |
| DeepSeek | ✅ | ✅ | ✅ |
| 通义千问 | ✅ | ✅ | ✅ |
| 文心一言 | ✅ | ✅ | ✅ |
| Kimi | ✅ | ✅ | ✅ |

## 🛠️ 技术栈

- **插件**：Chrome Extension Manifest V3
- **转换**：docx.js
- **预览**：marked.js
- **样式**：原生 CSS

## 📝 部署

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署 webapp
cd webapp
vercel
```

### Cloudflare Pages 部署

1. 将项目推送到 GitHub
2. 在 Cloudflare Pages 新建项目
3. 选择 `webapp` 目录作为构建目录

## 📄 许可证

MIT License
