# Google Search Console (GSC) 配置指南

这是为您准备的 Google Search Console 配置教程。GSC 是 Google 提供的免费工具，用于监控网站在 Google 搜索结果中的表现。

## 第一步：登录与添加资源

1. 访问 [Google Search Console](https://search.google.com/search-console)。
2. 使用您的 Google 账号登录。
3. 点击左上角的“资源”下拉菜单，选择 **+ 添加资源**。

## 第二步：选择资源类型

您会看到两个选项：“网域”和“网址前缀”。

**推荐使用右侧的“网址前缀” (URL Prefix)**。

1. 在 **网址前缀** 输入框中，填写您的完整网站首页地址：
    `https://www.aitowords.com/`
    *(注意：请确保末尾有 `/`，且协议是 `https`)*
2. 点击 **继续**。

## 第三步：验证所有权

Google 需要确认您是该网站的所有者。对于 Cloudflare Pages，最简单的方法是 **HTML 标记 (HTML Tag)**。

1. 在验证方法列表中，找到 **HTML 标记** 并展开。
2. 复制显示的元标记（Meta tag），它看起来像这样：
    `<meta name="google-site-verification" content="您的验证代码" />`
3. **不要关闭 GSC 页面**。
4. 打开您的项目代码，找到 `webapp/index.html` 文件。
5. 将刚才复制的代码粘贴到 `<head>` 标签内（建议放在 `<meta charset...>` 之后）。
6. 提交代码更改并推送到 GitHub（Cloudflare 会自动重新构建）。
7. 等待几分钟，确保网站更新生效。
8. 回到 GSC 页面，点击 **验证** 按钮。
    * 如果验证成功，您会看到绿色的成功提示。

## 第四步：提交 Sitemap

验证成功后，告诉 Google 您的页面有哪些。

1. 在 GSC 左侧菜单中，点击 **编制索引** -> **站点地图 (Sitemaps)**。
2. 在“添加新的站点地图”输入框中，输入您的 Sitemap文件名：
    `sitemap.xml`
    *(如果您的 GSC 资源地址是 `https://www.aitowords.com/`，则只需填写 `sitemap.xml`。确保最终拼接的地址是 `https://www.aitowords.com/sitemap.xml`)*
3. 点击 **提交**。
4. 状态列应显示为“成功”。如果显示“无法获取”，请稍等片刻再试。

## 完成

配置完成后：

* Google 爬虫可以在几天到几周内开始抓取您的页面。
* 您可以在“效果”报告中看到用户通过搜索什么关键词找到了您的网站。
* 如果网站出现索引问题，GSC 会发送邮件通知您。
