#!/bin/bash
# AiToWords 每日自动备份脚本

set -e

# 配置
BACKUP_DIR="$HOME/.openclaw/backups/aitowords"
REPO_DIR="/Users/szjxxiangmubu/.openclaw/workspace/aitowords-repo"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔄 开始备份 AiToWords${NC}"
echo "时间: $(date)"

# 创建备份目录
mkdir -p "$BACKUP_DIR/$DATE"

# 备份代码
echo -e "${YELLOW}📦 备份代码...${NC}"
cd "$REPO_DIR"
git add -A
git commit -m "chore: 自动备份 $TIMESTAMP" 2>/dev/null || echo "无变更需要提交"
git push origin main 2>/dev/null || echo "推送失败，跳过"

# 备份关键文件
echo -e "${YELLOW}📁 备份文件...${NC}"
cp -r webapp "$BACKUP_DIR/$DATE/" 2>/dev/null || true
cp -r scripts "$BACKUP_DIR/$DATE/" 2>/dev/null || true
cp -r PRD "$BACKUP_DIR/$DATE/" 2>/dev/null || true

# 备份配置（不包含敏感信息）
echo -e "${YELLOW}💾 备份配置...${NC}"
cp .gitignore "$BACKUP_DIR/$DATE/" 2>/dev/null || true
cp VERSION_CONTROL.md "$BACKUP_DIR/$DATE/" 2>/dev/null || true
cp BACKUP_PLAN.md "$BACKUP_DIR/$DATE/" 2>/dev/null || true

# 创建备份清单
cat > "$BACKUP_DIR/$DATE/BACKUP_INFO.txt" << EOF
备份时间: $(date)
Git 版本: $(git rev-parse HEAD)
Git 分支: $(git branch --show-current)

包含文件:
- webapp/ (网站文件)
- scripts/ (脚本)
- PRD/ (产品文档)
- 配置文件

恢复方法:
cp -r $BACKUP_DIR/$DATE/webapp/* $REPO_DIR/webapp/
EOF

# 压缩备份
echo -e "${YELLOW}🗜️ 压缩备份...${NC}"
cd "$BACKUP_DIR"
tar -czf "$DATE.tar.gz" "$DATE" 2>/dev/null || echo "压缩失败，保留原始文件"

# 清理旧备份（保留最近 7 天）
echo -e "${YELLOW}🧹 清理旧备份...${NC}"
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +7 -name "20*" -exec rm -rf {} \; 2>/dev/null || true
find "$BACKUP_DIR" -maxdepth 1 -type f -mtime +7 -name "*.tar.gz" -exec rm {} \; 2>/dev/null || true

echo -e "${GREEN}✅ 备份完成！${NC}"
echo "备份位置: $BACKUP_DIR/$DATE"
echo "备份大小: $(du -sh "$BACKUP_DIR/$DATE" 2>/dev/null | cut -f1 || echo "未知")"
