# API 契约说明

api 需与 api-legacy（Python）保持相同的请求/响应契约，便于前端无感切换。

## 成功响应

`{ "code": 0, "data": T, "message": "操作成功" }`

## 错误响应

`{ "code": number, "message": string, "data"?: { "errors"?: { "field": string, "message": string }[] } }`

业务码：0 成功；40000–40004、40900–40901 客户端；50000 服务端。

## 不包装路径

`/health`、`/docs`、`/redoc`、`/openapi.json`、`/api/v1/webhooks` 前缀下的响应不包装为上述格式。

## 导出 OpenAPI（可选）

从当前 Python 服务导出契约，供对照与契约测试：

1. 启动 API：`make dev-api`（当前为 Node 版 api）
2. 请求：`GET http://localhost:8000/api/v1/openapi.json` 或 `GET http://localhost:8000/openapi.json`
3. 将响应保存为 `openapi.json` 于本目录或 `api/openapi-source.json`

前端按路径调用的端点清单可从 OpenAPI 中整理，用于逐项实现与验收。
