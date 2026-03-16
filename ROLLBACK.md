# AiToWords 应急回滚指南

## 🚨 紧急情况

### 网站无法访问

**症状**：
- 访问 aitowords.com 显示 404/500 错误
- 页面加载失败
- CSS/JS 文件丢失

**原因**：
- Git push 了错误代码
- Cloudflare 部署失败
- 文件被误删

**解决方案**：

---

## 📋 回滚步骤

### 方法 1：Git 回滚（推荐）

#### 1. 查看版本历史
```bash
cd /Users/szjxxiangmubu/.openclaw/workspace/aitowords-repo
git tag -l
```

#### 2. 回滚到指定版本
```bash
# 回滚到上一个稳定版本
git checkout v1.0.0-stable

# 或者回滚到上一个 commit
git reset --hard HEAD~1
```

#### 3. 强制推送（谨慎！）
```bash
git push origin main --force
```

#### 4. Cloudflare 自动重新部署
- 等待 1-2 分钟
- 访问网站确认

---

### 方法 2：从备份恢复

#### 1. 查看可用备份
```bash
ls -lh ~/.openclaw/backups/aitowords/
```

#### 2. 恢复备份
```bash
# 恢复昨天的备份
BACKUP_DATE=$(date -v-1d +%Y-%m-%d)
tar -xzf ~/.openclaw/backups/aitowords/$BACKUP_DATE.tar.gz -C /tmp/
cp -r /tmp/$BACKUP_DATE/webapp/* /Users/szjxxiangmubu/.openclaw/workspace/aitowords-repo/webapp/
```

#### 3. 提交并推送
```bash
cd /Users/szjxxiangmubu/.openclaw/workspace/aitowords-repo
git add webapp/
git commit -m "hotfix: 从备份恢复"
git push origin main
```

---

### 方法 3：Cloudflare 回滚

#### 1. 登录 Cloudflare Dashboard
- 访问：https://dash.cloudflare.com
- 选择 aitowords.com

#### 2. Pages 设置
- 进入 Pages → aitowords
- 点击 "View details"

#### 3. 回滚部署
- 找到上一个成功的部署
- 点击 "Rollback to this deployment"

---

## 🛡️ 预防措施

### 1. 每次大改动前打 Tag
```bash
git tag -a v1.2.0-stable -m "描述"
```

### 2. 本地测试
```bash
# 本地启动服务器测试
cd webapp
python3 -m http.server 8080
# 访问 http://localhost:8080 确认无误
```

### 3. 小步提交
- 一次只改一个功能
- 提交前测试
- 使用 branch 开发

---

## 📞 紧急联系

**Cloudflare Status**:
- https://www.cloudflarestatus.com/

**GitHub Status**:
- https://www.githubstatus.com/

---

## ✅ 回滚检查清单

- [ ] 确认回滚版本号
- [ ] 本地测试回滚后的代码
- [ ] 备份当前状态（以防需要恢复）
- [ ] 执行回滚
- [ ] 等待 Cloudflare 部署（1-2 分钟）
- [ ] 访问网站确认恢复正常
- [ ] 记录回滚原因

---

**最后更新**: 2026-03-16
