# HTTP 基础

## 浏览器里敲下回车之后，发生了什么

---

## 一次访问的完整路径

在地址栏输入 `https://example.com/users` 并回车：

1. DNS 把域名解析成 IP
2. TCP 三次握手，建立连接
3. TLS 握手，协商加密（HTTPS）
4. 浏览器发出一个 **HTTP 请求**
5. 服务器返回一个 **HTTP 响应**
6. 浏览器解析 HTML，再发起后续请求

后面讲的所有东西，都是第 4、5 步里的内容。

---

## 请求长什么样

```http
POST /api/users HTTP/1.1
Host: example.com
Content-Type: application/json
Content-Length: 27
Authorization: Bearer eyJhbGci...

{"name": "Alice", "age": 30}
```

结构固定：

- **起始行**：方法 + 路径 + 版本
- **头部**：一行一个 `Key: Value`
- **空行 + 正文**：空行分隔，正文可以没有

---

## 响应长什么样

```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/users/42

{"id": 42, "name": "Alice"}
```

- **状态行**：版本 + 状态码 + 原因短语
- 头部、空行、正文，和请求结构一致
- `201` 表示「创建成功」，`Location` 指向新资源

---

## 方法：表达你想做什么

| 方法 | 语义 | 幂等 |
| --- | --- | --- |
| `GET` | 读取资源 | 是 |
| `POST` | 创建资源 / 提交数据 | 否 |
| `PUT` | 整体替换 | 是 |
| `PATCH` | 局部修改 | 不一定 |
| `DELETE` | 删除 | 是 |

**幂等**：执行一次和执行十次结果一样，这决定了客户端能不能安全重试。

---

## GET 和 POST 的常见误解

- GET 也能带 body？协议允许，但大多数服务端和代理会忽略
- GET 有长度限制？限制来自浏览器和服务器配置，不是协议
- POST 比 GET 安全？不会。安全性来自 HTTPS 和权限，和方法无关

真正该记住的差别只有两条：

- GET 用于**读取**，不应该改变服务器状态
- POST 用于**提交**，重试可能产生重复数据

---

## 状态码：先看第一位

| 范围 | 含义 |
| --- | --- |
| `1xx` | 信息，实际很少见 |
| `2xx` | 成功 |
| `3xx` | 重定向或缓存 |
| `4xx` | 客户端的问题 |
| `5xx` | 服务端的问题 |

客户端只看第一位，就能决定下一步怎么做。

---

## 常用的十几个状态码

- `200` 成功 · `201` 创建成功 · `204` 成功但无内容
- `304` 内容没变，用你的缓存 · `400` 请求格式有问题
- `401` 没登录 · `403` 登录了但没权限 · `404` 资源不存在
- `409` 冲突（如用户名重复）· `422` 格式对但内容不合法
- `429` 请求太频繁 · `500` 服务端自己出错

---

## 头部：请求的附加信息

```http
Host: example.com
User-Agent: Mozilla/5.0 ...
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJhbGci...
```

- `Content-Type` 告诉对方 body 是什么格式
- `Accept` 表示「我能接受什么格式」
- 认证信息通常放在 `Authorization` 或 `Cookie` 里

---

## 查询参数与路径

```
https://example.com/users/42?fields=name&lang=zh
└──────┬──────┘└──┬──┘└─┬─┘└────────┬────────┘
     协议+域名    路径   资源 ID      查询参数
```

- **路径**标识「哪个资源」
- **查询参数**用于过滤、排序、分页，中文要 URL 编码

---

## 正文：数据放哪

```http
Content-Type: application/json

{"name": "Alice", "age": 30}
```

表单提交则是 `application/x-www-form-urlencoded`，
上传文件用 `multipart/form-data`。

- JSON 是 API 的主流选择
- `Content-Type` 写错，服务端就解析不了 body

`Content-Type` 写错，服务端就解析不了 body。

---

## Cookie 与 Session

服务器可以在响应里种一个 Cookie：

```http
Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Lax
```

之后浏览器会**自动**在每次请求里带上 `Cookie: session=abc123`。

- `HttpOnly`：JS 读不到，防 XSS 窃取
- `Secure`：只在 HTTPS 下发送
- `SameSite=Lax`：跨站请求默认不带，防 CSRF

---

## Cookie 还是 Token

| | Cookie / Session | Bearer Token |
| --- | --- | --- |
| 存储 | 浏览器自动管理 | 前端自己存，手动带上 |
| 跨域 | 需要 `SameSite`、`credentials` 配合 | 只需要请求头 |
| 移动端 | 不方便 | 天然合适 |
| 登出 | 服务端删 Session | 客户端丢弃 token，或加入黑名单 |

前后端分离的项目，token 更常见；传统服务端渲染，Cookie 更省事。

---

## 缓存：少发一次请求

响应里声明：

```http
Cache-Control: max-age=3600
ETag: "abc123"
```

下次请求带上：

```http
If-None-Match: "abc123"
```

- 内容没变 → `304 Not Modified`，不传 body
- 静态资源可以长缓存，API 响应要谨慎

---

## HTTPS 到底加密了什么

- 建立连接时用 TLS 握手，验证服务器证书
- 之后的所有内容（头部、body、URL 路径）都加密
- 防止中间人窃听和篡改

一条 `http://` 的请求，在公共网络上等同于明文广播。

---

## CORS：浏览器的安全策略

前端在 `localhost:5173`，后端在 `localhost:8000`：

```
Access to fetch at 'http://localhost:8000/users' from origin
'http://localhost:5173' has been blocked by CORS policy
```

- 浏览器默认禁止跨源读取响应
- 服务端要用 `Access-Control-Allow-Origin` 明确放行
- 非简单请求会先发一个 `OPTIONS` 预检

CORS 是**浏览器的行为**，不是服务器的限制。用 curl 请求同样的接口，不受影响。

---

## 用 curl 看一眼真实请求

```bash
curl -i https://api.example.com/users/1

curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice"}'
```

- `-i` 显示响应头
- `-v` 显示完整握手和报文
- 调接口时先 curl 一遍，能排除掉前端的大部分干扰

---

## 参考

- MDN HTTP 概览：[developer.mozilla.org/zh-CN/docs/Web/HTTP](https://developer.mozilla.org/zh-CN/docs/Web/HTTP)
- 标准：[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)
- 状态码速查：[httpstatuses.com](https://httpstatuses.com/)
