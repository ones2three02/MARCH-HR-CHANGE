#!/bin/bash
cd "$(dirname "$0")"
# 后台启动本地 Node 服务
npm run server &
# 延时 1.5 秒确保服务就绪
sleep 1.5
# 调用系统浏览器打开网页版控制台
open http://localhost:3000
