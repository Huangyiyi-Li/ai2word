#!/bin/bash
# AiToWords 插件打包脚本

set -e

EXTENSION_DIR="extension"
OUTPUT_DIR="releases"
VERSION=$(grep '"version"' extension/manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
OUTPUT_FILE="AiToWords-v${VERSION}.zip"

echo "🚀 开始打包 AiToWords 插件..."
echo "版本: $VERSION"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 删除旧的打包文件
rm -f "$OUTPUT_DIR/AiToWords-"*.zip

# 打包插件
cd "$EXTENSION_DIR"
zip -r "../$OUTPUT_DIR/$OUTPUT_FILE" . -x "*.DS_Store" -x "__MACOSX/*"

echo "✅ 打包完成！"
echo "文件: $OUTPUT_DIR/$OUTPUT_FILE"
echo "大小: $(du -h "../$OUTPUT_DIR/$OUTPUT_FILE" | cut -f1)"

# 创建 latest 链接
cd "../$OUTPUT_DIR"
rm -f AiToWords-latest.zip
ln -s "$OUTPUT_FILE" AiToWords-latest.zip

echo "🔗 已创建最新版本链接: AiToWords-latest.zip"
