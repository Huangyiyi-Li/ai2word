# PRD: Google AdSense 合规优化

## 1. 背景 (Background)

Google AdSense 多次审核被拒，经网站审计发现三个核心问题：缺少 Cookie 同意横幅、缺少联系我们页面、首页文字内容不足。

## 2. 目标 (Objectives)

- 添加 Cookie 同意横幅，满足 GDPR 及 Google AdSense 合规要求
- 新建联系我们页面，提供明确的联系方式
- 扩充首页内容，提升内容质量评分

## 3. 详细需求 (Detailed Requirements)

### 3.1 Cookie 同意横幅

在 `webapp/index.html` 底部（`</body>` 前）添加：

- 固定在页面底部的深色横幅
- 包含"接受全部"和"仅必要"两个选项
- 使用 `localStorage` 记录用户选择（key: `cookieConsent`）
- 首次访问时显示，已选择过则不再显示
- 支持中英文国际化

### 3.2 联系我们页面

新建 `webapp/contact.html`：

- 统一样式（与 privacy.html 一致）
- 包含：电子邮件（<support@aitowords.com>）、GitHub Issues 链接、GitHub 仓库链接
- 包含"关于 AiToWords"简介板块
- 在 `index.html` footer 添加"联系我们"导航链接

### 3.3 首页内容扩充

在 `webapp/index.html` 主工具区后方添加"为什么选择 AiToWords"章节：

- 说明使用场景与痛点
- 列出支持的 Markdown 语法（10 项）
- 适用用户群体介绍（学生/职场/开发者）
- 隐私承诺说明

## 4. 交付物 (Deliverables)

- ✅ 修改后的 `webapp/index.html`（Cookie 横幅 + 内容章节 + footer 链接）
- ✅ 新增的 `webapp/contact.html`
- ✅ 更新后的 `README.md`

## 5. 提交 AdSense 重审

修改推送并 Cloudflare 构建完成后，在 AdSense 后台点击"请求审核"。
