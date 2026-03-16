# V2EX 推广帖草稿

**节点**: 分享创造

**标题**: [分享] 做了个免费工具，把 ChatGPT/DeepSeek 对话无损导出为 Word

---

**正文**：

大家好！

最近 ChatGPT、DeepSeek 用得越来越多，经常需要把 AI 生成的对话导出为 Word 文档提交作业或报告。但直接复制粘贴会遇到几个问题：

1. **LaTeX 公式变成乱码** - `$E=mc^2$` 复制后显示为纯文本
2. **代码块丢失高亮** - 没有语法高亮和等宽字体
3. **表格格式错乱** - Markdown 表格在 Word 中显示异常
4. **Mermaid 图表无法显示** - 流程图、时序图看不到

所以做了这个工具：**AiToWords**

## 功能特点

✅ **完整格式支持**
- LaTeX 数学公式 → Word 原生公式（可编辑）
- Mermaid 图表 → PNG 图片
- 代码块 → 多语言语法高亮
- 表格、列表、引用 → 原生 Word 格式

✅ **隐私安全**
- 纯浏览器端处理，不上传任何数据
- 无后端服务器，无数据库
- 适合处理包含敏感信息的对话

✅ **完全免费开源**
- GitHub: https://github.com/Huangyiyi-Li/ai2word
- 无需注册，无次数限制

## 支持的 AI 平台

理论上支持所有 Markdown 输出，已测试：
- ChatGPT
- DeepSeek
- Claude
- Gemini
- 通义千问
- 文心一言
- Kimi

## 在线使用

直接访问：https://www.aitowords.com

1. 复制 AI 对话内容（Markdown）
2. 粘贴到编辑器
3. 点击"导出 Word"
4. 完成！

## 浏览器插件

还做了 Chrome 插件，可以在 AI 网站侧边栏直接选择对话导出，无需手动复制。

---

欢迎体验和反馈！如果有任何问题或建议，随时告诉我。

## 技术栈

- 前端：原生 JavaScript
- 转换：docx.js
- 图表：Mermaid.js
- 公式：LaTeX 转 Word Math

---

**最后**：这是一个开源项目，如果觉得有用，欢迎 GitHub Star ⭐

---

**预期效果**：
- 访问量：50-100
- 转化率：30-50%
- GitHub Stars：5-10

**发布时间**：选择晚上 8-10 点（V2EX 活跃时段）
