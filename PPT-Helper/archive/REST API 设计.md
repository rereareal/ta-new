# REST API 设计

## 接口是给谁看的：人和程序都要看得懂

---

## 先看一个糟糕的接口

```
POST /api/getUserList
POST /api/createUser?action=add
GET  /api/deleteUser?id=3
GET  /api/user/update?name=Alice
```

问题不在能不能用，而在于：

- URL 里全是动词，看不出资源是什么
- 用 GET 做删除，爬虫和预取会误伤
- 前端每接一个接口都要重新读文档

---

## REST 的核心只有一句话

> **URL 表示资源，方法表示动作。**

```
GET    /users        读取用户列表
POST   /users        创建一个用户
GET    /users/42     读取 42 号用户
PATCH  /users/42     修改 42 号用户
DELETE /users/42     删除 42 号用户
```

同一个 URL，靠方法区分行为。

---

## 资源应该用名词，复数

```
✅ /users        /orders        /articles
❌ /getUsers     /createOrder   /articleList
```

- 用复数表示集合，`/users/42` 表示其中一个
- 小写字母，多词用短横线：`/order-items`
- 不要在 URL 里放过多的业务动作

---

## 嵌套别太深

```
✅ /users/42/orders
✅ /orders/88/items
❌ /users/42/orders/88/items/3/tags/7   ← 太深了
```

- 嵌套两层通常够用，再深就用独立路径 + 查询参数
- 嵌套表达的是「从属关系」，不是「导航路径」

---

## 状态码要表达清楚结果

- 创建成功 → `201`，带上 `Location: /users/42`
- 删除成功 → `204`，不带 body
- 参数格式错 → `400`，字段校验失败 → `422`
- 资源不存在 → `404`，用户名重复 → `409`
- 没登录 → `401`，登录了但没权限 → `403`
- 服务端自己出错 → `500`

全部返回 `200` + 自定义 `code` 字段，会让缓存、监控、网关全部失效。

---

## 错误响应要统一

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "用户不存在",
    "details": [
      { "field": "email", "reason": "invalid_format" }
    ]
  }
}
```

- `code` 给程序判断，保持稳定，不要随文案变
- `message` 给人看，可以国际化
- `details` 放字段级错误，前端可以直接映射到表单

---

## 分页：两种常见方案

| | offset / limit | cursor |
| --- | --- | --- |
| 用法 | `?offset=40&limit=20` | `?cursor=eyJpZCI6NDJ9` |
| 优点 | 简单，能跳页 | 稳定，适合大数据量 |
| 缺点 | 深分页慢，数据会漂移 | 不能直接跳到第 N 页 |

后台管理多用 offset，信息流多用 cursor。

---

## 过滤、排序、字段选择

```
GET /users?status=active&role=admin
GET /users?sort=-created_at,name
GET /users?fields=id,name,email
```

- 过滤条件用查询参数，不要塞进路径
- 排序用 `排序字段` 前缀 `-` 表示倒序
- 字段选择能显著减小响应体积

约定要写进文档，别让前端猜。

---

## 版本化：给未来的自己留条路

```
https://api.example.com/v1/users
```

- 路径版本最简单，网关和日志都好处理
- 破坏性变更才升版本，加字段不需要
- 版本号不要跟业务混在一起：`/v1/users`，不是 `/users/v1`

---

## 幂等：重试会不会出问题

```
POST /orders            // 网络抖动重试 → 可能下两单
GET  /orders/42         // 重试多少次都一样
PUT  /orders/42         // 整体替换，幂等
```

给 POST 加一个请求标识：

```http
Idempotency-Key: 7f3c9a1e-...
```

服务端记录这个 key，重复请求直接返回上次结果。

---

## 一个完整的接口清单

```
GET    /v1/users?status=active&limit=20
POST   /v1/users
GET    /v1/users/{id}
PATCH  /v1/users/{id}
DELETE /v1/users/{id}

GET    /v1/users/{id}/orders
POST   /v1/users/{id}/orders

GET    /v1/health
```

看这一页，不用文档也能大致猜出每个接口做什么。

这就是好的 REST 设计。

---

## 设计时先问自己四个问题

1. 这个 URL 表示的是**哪个资源**？
2. 这个动作是**读取还是修改**？
3. 失败时，客户端怎么知道**错在哪**？
4. 数据变多以后，**分页和过滤**怎么加？

先回答完，再写代码。

---

## 参考

- REST 论文：[Fielding, Architectural Styles](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)
- Microsoft REST API 指南：[github.com/microsoft/api-guidelines](https://github.com/microsoft/api-guidelines)
- Google API 设计指南：[cloud.google.com/apis/design](https://cloud.google.com/apis/design)
