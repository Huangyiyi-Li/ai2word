# AI_GUIDELINES (项目开发与维护指南)

本文档旨在为后续接手本项目的 AI（例如 ChatGPT、Claude、Cursor 等）提供项目的开发上下文、技术规范和历史踩坑记录，以便在继续迭代中保持项目的一致性和稳定性。

## 1. 项目背景与定位

- **项目名**：AiToWords
- **核心功能**：这是一款将 AI 聊天文本（包含 Markdown、LaTeX 公式、代码块、脚注、Mermaid 图表）无损完美导出为 Word (`.docx`) 的工具。由于市面上的富文本直接转 Word 的包通常较弱，大部分不支持数学公式或表格的精准渲染，本项目通过深度定制 `docx.js` 及其导出的 `XML` 文件来修复各种痛点。
- **项目形态**：为了受众可以随时使用，本项目维持了两种形态的代码库结构：
  - `extension/`：Chrome/Edge 浏览器侧边栏扩展版本（Manifest V3）。主要逻辑监听网页 DOM 中的 AI 回复进行内容抓取提取。
  - `webapp/`：独立的纯网页前端版本，不需要安装插件即可在在线页面上粘贴输入转换。

## 2. 核心技术约定

- **纯前端**：不需要部署任何后端转码服务，所有的渲染和流抓取全在浏览器完成（涉及依赖：`docx`、`jszip`、`marked` 等，均在 `lib` 内提供编译版本）。
- **双端同步**：**【极其重要】** `webapp/lib/converter.js` 和 `extension/lib/converter.js` 是分别维护但实质代码接近同步的核心转换所在。每次涉及 Markdown 转 Word 规则的修复，必须同时在两边更新！
- **不使用现代打包框架**：为了极简性和降低开发者门槛，未引入 React/Vue 或 Webpack/Vite 机制。代码是原生 JS/HTML/CSS。

## 3. 已爬出的“大坑” & 核心重构难点记录

如果你被要求修改文档格式功能，请务必先了解下述已知问题：

1. **Word 主题颜色干扰（默认染蓝）**
   - **症状**：转出的 Word 文档里，所有的 Heading（大纲标题）文本哪怕手动注入了颜色，但在 Word 侧边导航栏及“样式集预览”悬浮时依旧会呈现 Office 原生主题的“蓝色 (accent1)”。
   - **解决手段**：
     由于 `docx` 包的局限性，我们拦截了最终输出前生成的 `Blob` 对象，在 `postProcessDocx` 阶段利用 `JSZip` 强行解包对内部 XML 进行清理：
     - 正则匹配 `word/styles.xml` 内所有 `<w:style w:styleId="Heading...` 的区域，消除所有的 `w:themeColor`。并强行为所有没有 `w:color` 的样式子属性塞入强制黑色。
     - 同时深入 `word/theme/theme1.xml` 将里面所有的 `accent1` 到 `accent6` 定义项全部被纯黑（`000000`）替换，并在 `word/document.xml` 中移除所有 `themeColor` 属性引用。
2. **Word 样式集控制与原生大纲属性**
   - **症状**：原本代码作者为了规避上述被染成蓝色的问题，将 Markdown 解析出的 H1-H6 标题放弃了内置的 `HeadingLevel` API，而是退回到“放大的普通 Paragraph”。但这会导致生成的文档缺乏原生的大纲（Navigation）结构。
   - **解决手段**：随着上述染蓝问题被暴力洗除解决，我们已于 `v202603191425` 版全面恢复使用原生的 `heading: HeadingLevel.HEADING_X` 属性！请**不要**再回归使用增大字号去伪装大纲！

## 4. 后续 AI 接手指引

1. 开发任何特征时，先分析用户需求属于 DOM 抓取（修改 extension 的 content.js）、还是 DOM 转 Markdown、还是 Markdown 转 DOCX（修改 converter.js）。
2. 在处理 `converter.js` 时，无论修改块还是行内解析（如 `parseInlineContent`），请务必在完成变更后，同时复刻到另一端的目录内。
3. 如果引入了新的包依赖，尽量寻找纯前端 ESM 或 UMD 单文件版本引入在 lib 中，而不是使用 npm require 进行复杂的 Node 混淆。
4. 修改完毕后，切记去 `CHANGELOG.md` 和 `README.md` 内做好版本记录（遵照 Keep a Changelog 格式）。
