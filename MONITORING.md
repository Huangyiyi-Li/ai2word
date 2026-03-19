# 🤖 AiToWords 自动化监控系统

## 📋 文件结构

```
aitowords-repo/
├── .env (敏感配置,不在 Git 中)
├── scripts/
│   ├── config_loader.py (配置读取工具)
│   ├── cf_graphql_analytics.py (数据拉取)
│   └── analyze_analytics.py (数据分析)
├── MONITORING.md (本文档)
└── aitowords-data/ (数据存储)
    └── daily/ (每日数据)
```

## 🔐 安全说明

**所有敏感信息都存储在 `.env` 文件中，包括:**
- Cloudflare API Token
- Zone ID
- Account ID
- GitHub Personal Access Token

**这些文件永远不会提交到 Git**（已添加到 `.gitignore`）

## 🚀 使用方法

### 查看最新数据
```bash
cd /path/to/aitowords-repo
python3 scripts/analyze_analytics.py
```

### 手动拉取数据
```bash
cd /path/to/aitowords-repo
python3 scripts/cf_graphql_analytics.py
```

### 修改配置
编辑 `.env` 文件:
```
CF_API_TOKEN=your_new_token_here
CF_ZONE_ID=697ff06b56770f56877f83f43d15f0a5
CF_ACCOUNT_ID=c5117dc2e472660975ed0626f1c27c53
```

## 📊 数据说明

- 每天早上 6:00 自动拉取
- 数据存储在 `aitowords-data/daily/YYYY-MM-DD.json`
- 可以随时分析趋势

## 🔒 建议定期重新生成 Token

- Cloudflare API Token: 每 90 天一次
- GitHub Token: 每月一次
- 定期检查日志文件

---

**创建时间**: 2026-03-16
