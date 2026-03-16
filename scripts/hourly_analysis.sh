#!/usr/bash
# AiToWords 小时级数据分析脚本

cd /Users/szjxxiangmubu/.openclaw/workspace/aitowords-repo

# 加载环境变量
source .env

echo "📊 AiToWords 今日访问量分析（0点-现在）"
echo "================================================"
echo ""

# 获取今日数据（小时级）
curl -s -X POST "https://api.cloudflare.com/client/v4/graphql" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "query": """
      query {
        viewer {
          zones(filter: {zoneTag: "'"$CF_ZONE_ID"'"}) {
            httpRequests1dGroups(
              limit: 24,
              filter: {
                datetime_geq: "'"$(date -u -j -v -f "%Y-%m-%dT%H:00:00Z")"'",
                datetime_lt: "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'""
              }
            ) {
              sum {
                requests
                pageViews
                uniqueVisitors
                bandwidth
              }
              dimensions {
                datetime
              }
            }
          }
        }
      }
    """
  }' | python3 -m json.tool

echo ""
echo "✅ 分析完成"
