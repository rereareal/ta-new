# ta-backend

基于 FastAPI 与 SQLModel 的教学智能体后端服务，当前已提供用户认证与智能体问答接口。

## 环境要求

- Python 3.14 及以上版本
- [uv](https://docs.astral.sh/uv/) 用于管理依赖与虚拟环境

## 本地启动

```bash
cd ta-backend
cp .env.example .env  # 首次启动前复制配置模板
uv sync               # 安装依赖到 .venv
uv run dev            # 启动开发服务器
```

- `uv run dev` 默认监听 `http://127.0.0.1:3000` 并开启热重载，默认地址由 `scripts/dev.py` 中的 `DEV_HOST` 与 `DEV_PORT` 控制。
- 交互式接口文档：<http://127.0.0.1:3000/docs>，OpenAPI 描述：`/openapi.json`。
- 可通过 `uv run dev --help` 查看全部参数，例如 `--port 3001` 更换端口、`--host` 指定监听地址、`--no-reload` 关闭热重载。
- 也可使用原生 uvicorn 启动：`uv run uvicorn main:app --port 3000 --reload`。
- 对外提供服务时建议关闭热重载：`uv run dev --host 0.0.0.0 --no-reload`。

首次启动会自动在 `ta-backend/` 下创建 SQLite 文件 `ta.db` 并建表。也可以先激活虚拟环境，再直接运行 `dev`：

```bash
source .venv/bin/activate
dev
```

## 配置

配置通过 `core/config.py` 读取，优先级为：**系统环境变量 > `.env` > 默认值**，具体机制可参考 [FastAPI 设置与环境变量](https://fastapi.tiangolo.com/zh/advanced/settings/)。

仓库仅提交配置模板 `.env.example`，本地运行前请复制为 `.env`：

| 环境变量 | 含义 | 默认值 |
| --- | --- | --- |
| `DATABASE_URL` | 数据库连接串 | `sqlite:///./ta.db` |
| `SECRET_KEY` | JWT 签名密钥，泄露将导致登录态可被伪造 | **必填**，生产环境务必使用随机长串 |
| `ALGORITHM` | JWT 签名算法 | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token 有效期，单位为分钟 | `1440` |
| `OPENAI_API_KEY` | OpenAI API 密钥，供智能体模块调用大模型 | **必填** |
| `OPENAI_MODEL` | OpenAI 模型名 | `gpt-4.1` |

## 目录结构

```text
main.py                  应用入口：生命周期管理、全局错误处理与路由挂载
.env.example             环境变量配置模板
core/                    应用运行期基础设施，供 main.py 与各业务模块共用
  config.py              全局配置，从环境变量与 .env 读取
  database.py            数据库引擎、建表逻辑与请求级会话依赖 SessionDep
  llm.py                 异步大模型客户端，随应用启停创建与释放
  security.py            密码哈希与 JWT 签发及校验
  errors.py              ServiceError 与全局错误处理器
modules/<业务>/          按业务领域拆分的模块
  router.py              HTTP 层：接收参数、调用 service、返回 Schema
  service.py             业务逻辑层，业务失败抛出 ServiceError
  models.py              SQLModel 表模型
  schemas.py             请求与响应模型
  deps.py                请求级依赖，如 get_current_user
scripts/                 开发期工具脚本，应用运行时不导入
  dev.py                 本地开发启动入口
```

### 数据库注意点

- `init_db()` 调用 `SQLModel.metadata.create_all`，仅创建缺失的新表，**不会修改已有表结构**；变更字段需引入 Alembic 等迁移工具。
- 新增 `table=True` 的模型必须在 `core/database.py` 的 `init_db()` 中导入，否则建表时不会识别。
- 接口通过 `session: SessionDep` 获取请求级会话，请求结束后自动关闭。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/auth/register` | 用户注册 |
| POST | `/auth/login` | 用户登录，返回 `access_token` |
| GET | `/auth/me` | 获取当前用户信息，需携带 `Authorization: Bearer <token>` |
| POST | `/agent/chat` | 多轮工具调用问答，非流式，需鉴权 |
| POST | `/agent/runs` | 多轮工具调用问答，SSE 流式输出，需鉴权 |

成功响应一律返回 200；业务错误由全局处理器统一转为 `{code, detail}`，HTTP 层不编写 `try/except`。

## 常用命令

```bash
uv sync                # 按 uv.lock 安装或同步依赖
uv run dev             # 启动开发服务器并开启热重载
uv run ruff check .    # 代码 Lint 检查
uv run ruff format .   # 代码格式化
```
