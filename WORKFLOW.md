# AiToWords 开发流程规范

## 🚀 功能开发流程

### 1. 网页功能增加

**必须考虑**：
- ✅ 是否需要同步更新插件？
- ✅ 插件是否需要相同功能？
- ✅ 功能是否依赖网页环境？

**决策依据**：
| 功能类型 | 网页 | 插件 | 示例 |
|---------|------|------|------|
| 导出功能 | ✅ | ✅ | Word 导出 |
| 搜索功能 | ✅ | ✅ | 对话搜索 |
| 模板功能 | ✅ | ❌ | 模板系统（仅网页） |
| 历史记录 | ✅ | ❌ | localStorage（仅网页） |

**检查清单**：
```markdown
- [ ] 功能是否适用于插件环境？
- [ ] 是否需要更新插件代码？
- [ ] 是否需要更新插件 manifest.json？
- [ ] 是否需要更新插件版本号？
```

---

### 2. 插件更新流程

**步骤**：
1. ✅ 修改插件代码（`extension/`）
2. ✅ 更新版本号（`manifest.json`）
3. ✅ **创建新的压缩包**（关键步骤！）
4. ✅ 更新下载页面链接（`install.html`）
5. ✅ 提交并推送到 GitHub

**创建压缩包命令**：
```bash
cd /Users/szjxxiangmubu/.openclaw/workspace/aitowords-repo
zip -r webapp/downloads/AiToWords-v1.2.0.zip extension/ -x "*.DS_Store" "*.map"
```

**更新下载页面**：
```html
<!-- 修改 webapp/install.html -->
<a href="downloads/AiToWords-v1.2.0.zip" class="download-btn" download>
```

---

## 📋 版本号规范

### 版本号格式
```
v1.2.3
│ │ │
│ │ └─ 补丁版本（Bug修复）
│ └─── 次版本（新功能）
└───── 主版本（重大更新）
```

### 版本更新规则

| 更新类型 | 版本号变化 | 示例 |
|---------|-----------|------|
| Bug 修复 | +0.0.1 | v1.2.0 → v1.2.1 |
| 新增功能 | +0.1.0 | v1.2.0 → v1.3.0 |
| 重大更新 | +1.0.0 | v1.2.0 → v2.0.0 |

---

## 🔄 同步更新检查表

### 网页更新时

```markdown
- [ ] 更新网页代码（`webapp/`）
- [ ] 是否需要更新插件？
  - [ ] 是 → 继续插件更新流程
  - [ ] 否 → 直接提交
- [ ] 测试网页功能
- [ ] 提交并推送
```

### 插件更新时

```markdown
- [ ] 更新插件代码（`extension/`）
- [ ] 更新 manifest.json 版本号
- [ ] 创建新的压缩包
  ```bash
  zip -r webapp/downloads/AiToWords-vX.X.X.zip extension/ -x "*.DS_Store" "*.map"
  ```
- [ ] 更新 install.html 下载链接
- [ ] 测试插件功能
- [ ] 提交并推送
```

---

## 📝 Git Commit 规范

### Commit 消息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat: 添加搜索功能 |
| `fix` | Bug 修复 | fix: 修复链接颜色问题 |
| `docs` | 文档更新 | docs: 更新 README |
| `style` | 代码格式 | style: 格式化代码 |
| `refactor` | 重构 | refactor: 重构导出逻辑 |
| `perf` | 性能优化 | perf: 优化搜索性能 |
| `test` | 测试 | test: 添加单元测试 |
| `chore` | 构建/工具 | chore: 更新依赖 |

---

## ⚠️ 重要提醒

### 🔴 必须执行的操作

1. **插件更新后必须**：
   - ✅ 创建新的压缩包
   - ✅ 更新下载页面链接
   - ✅ 更新版本号

2. **网页功能增加后必须**：
   - ✅ 考虑是否需要插件同步
   - ✅ 检查插件兼容性
   - ✅ 更新相关文档

### 🟡 常见错误

❌ **错误做法**：
- 更新插件但未创建新的压缩包
- 更新插件但未更新下载页面
- 网页功能更新但未考虑插件同步

✅ **正确做法**：
- 每次插件更新都创建新压缩包
- 每次插件更新都更新下载页面
- 网页功能更新时同步考虑插件

---

## 📊 版本历史

| 版本 | 日期 | 更新内容 | 压缩包 |
|------|------|---------|--------|
| v1.2.0 | 2026-03-16 | 搜索功能 | AiToWords-v1.2.0.zip ✅ |
| v1.1.0 | 2026-03-16 | SEO优化 | AiToWords-v1.1.0.zip ✅ |
| v1.0.0 | 2026-03-15 | 初始版本 | AiToWords-v1.0.0.zip ✅ |

---

## 🔗 相关链接

- GitHub 仓库: https://github.com/Huangyiyi-Li/ai2word
- 网站地址: https://www.aitowords.com
- 下载页面: https://www.aitowords.com/install.html

---

**最后更新**: 2026-03-16  
**维护者**: AiToWords Team
