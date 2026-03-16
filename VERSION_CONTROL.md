# AiToWords 版本管理和备份策略

## 📦 版本管理

### Git Tag 规范

**格式**: `v{MAJOR}.{MINOR}.{PATCH}-{STAGE}`

示例：
- `v1.0.0-stable` - 稳定版本
- `v1.1.0-beta` - 测试版本
- `v1.0.1-hotfix` - 紧急修复

**打 Tag 时机**：
- ✅ 每次 major 功能更新前
- ✅ 每次 SEO 大改动前
- ✅ 每周定期打 tag

### 版本历史

| 版本 | 日期 | 说明 | Tag |
|------|------|------|-----|
| v1.0.0 | 2026-03-16 | 初始稳定版本（SEO 优化前） | `v1.0.0-stable` |
| v1.1.0 | 2026-03-16 | SEO 优化 + 教程页面 | `v1.1.0-stable` |

---

## 💾 备份策略

### 每日自动备份
- **代码**: Git 仓库（GitHub）
- **配置**: `.env` 文件（本地 + 云备份）
- **数据**: `aitowords-data/` 目录（本地）

### 备份位置
```
~/.openclaw/backups/aitowords/
├── daily/           # 每日备份
│   ├── 2026-03-16/
│   │   ├── webapp/  # 网站文件
│   │   ├── scripts/ # 脚本文件
│   │   └── data/    # 数据文件
│   └── ...
├── weekly/          # 每周备份
└── monthly/         # 每月备份
```

### 备份脚本
见：`scripts/backup.sh`

---

## 🔄 回滚策略

### 一键回滚

**回滚到上一个版本**:
```bash
cd /path/to/aitowords-repo
git checkout v1.0.0-stable
# Cloudflare 自动重新部署
```

**回滚到任意版本**:
```bash
git tag  # 查看所有版本
git checkout v{VERSION}  # 切换到指定版本
```

### 回滚检查清单
1. ✅ 确认当前版本有问题
2. ✅ 找到稳定版本 tag
3. ✅ Git checkout 到稳定版本
4. ✅ 验证网站可访问
5. ✅ 记录回滚原因

---

## 🚨 安全发布流程

### 发布前检查
1. ✅ **本地测试**
   ```bash
   cd webapp
   python3 -m http.server 8080
   # 访问 http://localhost:8080 测试
   ```

2. ✅ **代码审查**
   - 检查 HTML 语法
   - 检查链接有效性
   - 检查 JS 控制台错误

3. ✅ **备份当前版本**
   ```bash
   ./scripts/backup.sh
   ```

4. ✅ **打 Git Tag**
   ```bash
   git tag -a v{VERSION} -m "Release {VERSION}"
   git push origin --tags
   ```

### 发布步骤
1. Git commit + push
2. 等待 Cloudflare 自动部署（1-2分钟）
3. 访问网站验证
4. 如有问题，立即回滚

---

## 📊 监控和告警

### 网站可用性监控
- **工具**: Cron + curl
- **频率**: 每 5 分钟
- **告警**: 网站不可访问时通知

### 错误监控
- **工具**: Cloudflare Analytics
- **指标**: 5xx 错误率
- **阈值**: > 5% 时告警

---

## 🔒 配置文件备份

### .env 文件备份
```bash
# 加密备份
tar -czf - .env | gpg -c > .env.tar.gz.gpg

# 云备份（手动）
# 上传到云存储或安全位置
```

---

## 📝 变更日志

**2026-03-16 (v1.1.0)**:
- ✅ 添加 3 个教程页面（ChatGPT/DeepSeek/LaTeX）
- ✅ 更新 sitemap.xml
- ✅ 添加 GA 事件追踪
- ✅ 配置 Cloudflare API 监控

**2026-03-16 (v1.0.0)**:
- ✅ 初始稳定版本
- ✅ 基础功能完整

---

## 🆘 紧急联系

**网站无法访问？**
1. 检查 Cloudflare 状态
2. Git 回滚到上一个稳定版本
3. 通知用户

**数据丢失？**
1. 从备份恢复
2. 检查 Git 历史
3. 重建数据

---

**创建时间**: 2026-03-16
**下次审查**: 2026-04-16
