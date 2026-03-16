#!/bin/bash

# AiToWords 自动备份脚本
# 每日备份代码、配置和数据

set -e

# 配置
REPO_DIR="/Users/szjxxiangmubu/.openclaw/workspace/aitowords-repo"
BACKUP_DIR="/Users/szjxxiangmubu/.openclaw/backups/aitowords"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 AiToWords 备份开始${NC}"
echo "时间: $(date)"
echo "备份目录: $BACKUP_DIR/$DATE"

# 创建备份目录
mkdir -p "$BACKUP_DIR/$DATE"
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"
mkdir -p "$BACKUP_DIR/monthly"

# 1. 备份代码（Git 仓库）
echo -e "\n${YELLOW}📦 备份代码...${NC}"
cd "$REPO_DIR"
git add -A
git commit -m "chore: 自动备份 $TIMESTAMP" || echo "没有变更需要提交"
git push origin main || echo "推送失败，跳过"

# 2. 备份关键文件
echo -e "\n${YELLOW}📁 备份关键文件...${NC}"
cp -r "$REPO_DIR/webapp" "$BACKUP_DIR/$DATE/"
cp -r "$REPO_DIR/PRD" "$BACKUP_DIR/$DATE/" 2>/dev/null || true
cp -r "$REPO_DIR/scripts" "$BACKUP_DIR/$DATE/" 2>/dev/null || true
cp "$REPO_DIR/.env" "$BACKUP_DIR/$DATE/env.backup" 2>/dev/null || true

# 3. 备份数据文件
echo -e "\n${YELLOW}💾 备份数据...${NC}"
DATA_DIR="/Users/szjxxiangmubu/.openclaw/workspace/aitowords-data"
if [ -d "$DATA_DIR" ]; then
    cp -r "$DATA_DIR" "$BACKUP_DIR/$DATE/data"
fi

# 4. 创建备份清单
echo -e "\n${YELLOW}📋 创建备份清单...${NC}"
cat > "$BACKUP_DIR/$DATE/BACKUP_INFO.txt" << EOF
备份时间: $(date)
备份类型: 每日备份
Git 版本: $(git rev-parse HEAD)
Git 分支: $(git branch --show-current)
文件列表:
- webapp/
- PRD/
- scripts/
- .env (加密)
- data/

恢复方法:
1. cd $BACKUP_DIR/$DATE
2. cp -r webapp/* $REPO_DIR/webapp/
3. cp env.backup $REPO_DIR/.env
EOF

# 5. 压缩备份（可选）
echo -e "\n${YELLOW}🗜️ 压缩备份...${NC}"
cd "$BACKUP_DIR"
tar -czf "$DATE.tar.gz" "$DATE" 2>/dev/null || echo "压缩失败，保留原始文件"

# 6. 清理旧备份（保留最近 7 天）
echo -e "\n${YELLOW}🧹 清理旧备份...${NC}"
find "$BACKUP_DIR/daily" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true

# 7. 每周备份（周日）
if [ $(date +%u) -eq 7 ]; then
    echo -e "\n${YELLOW}📅 创建每周备份...${NC}"
    cp -r "$BACKUP_DIR/$DATE" "$BACKUP_DIR/weekly/week_$(date +%Y_W%V)"
fi

# 8. 每月备份（1 号）
if [ $(date +%d) -eq 01 ]; then
    echo -e "\n${YELLOW}📅 创建每月备份...${NC}"
    cp -r "$BACKUP_DIR/$DATE" "$BACKUP_DIR/monthly/month_$(date +%Y-%m)"
fi

# 完成
echo -e "\n${GREEN}✅ 备份完成！${NC}"
echo "备份位置: $BACKUP_DIR/$DATE"
echo "备份大小: $(du -sh "$BACKUP_DIR/$DATE" | cut -f1)"

# 发送通知（可选）
# curl -X POST "YOUR_WEBHOOK_URL" -d "AiToWords 备份完成: $DATE" || true

exit 0
