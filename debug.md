# 调试日志与技术方案 (v2.2)

## 核心问题修复

### 1. LaTeX 公式解析增强 (v2.0)

- **容错性**：支持 `\\\\\s*\[` 等不规范 AI 生成内容。

### 2. 导出逻辑与多端同步 (v2.0)

- **修复**：清空 `index.html` 冗余内联脚本，统一入口为 `converter.js`。

### 3. Word 原生脚注与指针步进 Bug (v2.2)

- **Bug 描述**：在 `parseInlineContent` 中，`lastIndex` 更新位于 `else` 块内。这意味着解析脚注（Foonote）时指针不步进，导致解析完脚注后，整个文本块又从头开始被 `parseTextStyles` 重新解析一遍。
- **表现**：文档中出现重复字符，如脚注后面跟着残留的 `^1]`，或超链接前出现多余的 `[`。
- **修复**：将 `lastIndex = match.index + match[0].length` 移至 `while` 内部的最外层级。
- **脚注映射**：维持 `footnoteMapping` (String ID -> Sequential Number) 逻辑。

### 4. 递归样式解析与段落路由 (v2.2)

- **Bug 描述**：原 `hasInlineLatex` 判定太窄，导致只有带公式的段落才支持加粗、链接。
- **修复**：重构为 `hasRichContent` 检测逻辑，识别 `**`, `*`, `[text](url)` 等所有富文本标记，确保所有样式段落都进入 `parseInlineContent` 处理流。
- **递归模型**：采用递归剥离法支持 `***嵌套样式***`。

### 5. Mermaid 导出

- **流程**：`SVG -> Canvas -> PNG`。确保 base64 转换无误。

---
*Last Updated: 2026-02-04 (v2.2)*
