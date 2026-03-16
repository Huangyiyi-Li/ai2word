# AiToWords 安全备份和版本管理方案

## 📦 版本标签策略

**打标签时机**：
- 每次 major 功能更新
- 每次大规模 SEO 改动
- 网站稳定运行一段时间后

**标签命名**：
- `v1.0.0-stable` - 稳定版本
- `v1.1.0-seo` - SEO 优化版本
- `v2.0.0-feature` - 新功能版本

## 💾 备份策略

### 自动备份（每日 2:00 AM）
```bash
# 每日备份
0 2 * * * /path/to/backup.sh
```

### 手动备份（重大更新前）
```bash
# 打包当前版本
tar -czf backup_$(date +%Y%m%d).tar.gz webapp/ PRD/ scripts/ .env

# 上传到安全位置
# （手动执行）
```

## 🔄 回滚流程

**如果网站出问题**：
```bash
# 1. 找到最后稳定版本
git tag | tail -5

# 2. 回滚到稳定版本
git checkout v1.0.0-stable

# 3. Cloudflare 自动重新部署

# 4. 验证网站可访问
curl -I https://www.aitowords.com

# 5. 如果成功，重新打 tag
git tag -a v1.0.1-hotfix -m "回滚修复"
```

## ✅ 当前安全措施

1. **Git 版本控制**
   - 所有代码都在 Git 中
   - 可随时回滚

2. **.gitignore 保护**
   - `.env` 不会提交
   - 敏感文件不会泄露

3. **Cloudflare 自动部署**
   - 推送到 GitHub 自动部署
   - 出问题可快速回滚

4. **本地备份**
   - 每日自动备份到 `~/.openclaw/backups/`

---

## 📋 发布检查清单

**发布前**：
- [ ] 本地测试网站功能
- [ ] 检查所有链接有效
- [ ] 备份当前版本
- [ ] 打 Git tag

**发布后**：
- [ ] 等待 Cloudflare 部署
- [ ] 验证网站可访问
- [ ] 检查控制台无错误
- [ ] 如果有问题，立即回滚

---

**创建时间**: 2026-03-16
**下次检查**: 每周审查一次
