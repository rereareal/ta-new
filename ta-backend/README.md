# ta-backend

FastAPI + SQLModel 后端（目前包含一套用户名密码 + JWT 的认证接口）。

## 环境要求

- Python >= 3.14（见 `pyproject.toml` 的 `requires-python`）
- [uv](https://docs.astral.sh/uv/) 管理依赖与虚拟环境

## 本地启动

```bash
cd ta-backend
uv sync      # 安装依赖到 .venv
uv run dev   # 启动开发服务器
```

- `uv run dev` 监听 `http://127.0.0.1:3000`，默认开启代码热重载；默认地址是 `scripts/dev.py` 里的 `DEV_HOST` / `DEV_PORT`（uvicorn 自身默认是 8000，这里约定用 3000）。
- Swagger UI：<http://127.0.0.1:3000/docs>，OpenAPI JSON：`/openapi.json`。
- `uv run dev --help` 可看全部参数：`--port 3001` 换端口、`--host` 换地址、`--no-reload` 关热重载。
- 也可以用原生 uvicorn（参数与 `scripts/dev.py` 一致）：`uv run uvicorn main:app --port 3000 --reload`。
- 对外提供服务：`uv run dev --host 0.0.0.0 --no-reload`。

首次启动会自动在 `ta-backend/` 下创建 SQLite 文件 `ta.db`（已在 `.gitignore` 中），并建表。

也可以直接激活虚拟环境后用 venv 里的可执行文件：

```bash
source .venv/bin/activate
dev              # 等价于 uv run dev
```

## 配置

当前配置都是 `core/config.py` 里的硬编码常量，**仅供本地开发**：

| 常量 | 含义 |
| --- | --- |
| `DATABASE_URL` | 数据库连接串，默认 `sqlite:///./ta.db` |
| `SECRET_KEY` | JWT 签名密钥，泄露等于任何人都能伪造登录态 |
| `ALGORITHM` | JWT 算法，默认 `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | token 有效期（分钟） |

上线前必须改成从环境变量 / `.env` 读取（配合 `pydantic-settings`），参考
[FastAPI 设置与环境变量](https://fastapi.tiangolo.com/zh/advanced/settings/)。

## 目录结构

```
main.py                  应用入口：lifespan（启动建表、关闭释放连接池）、统一错误处理、挂路由
core/                    应用运行期的基础设施（被 main.py / modules 依赖）
  config.py              配置常量
  database.py            engine、init_db()、请求级 Session 依赖 SessionDep
  security.py            密码哈希与 JWT 签发/校验
  errors.py              ServiceError 与全局错误处理器（统一 {code, detail}）
modules/<业务>/          按业务能力分模块，内部再分职责
  router.py              HTTP 层：收参数 -> 调 service -> 返回 Schema
  service.py             业务逻辑，业务失败抛 ServiceError
  models.py              SQLModel 表模型
  schemas.py             请求/响应模型
  deps.py                依赖项（如 get_current_user）
scripts/                 开发期工具，应用运行时不 import
  dev.py                 本地开发启动入口（`uv run dev`，见 [project.scripts]）
```

### 数据库注意点

- `init_db()` 调用 `SQLModel.metadata.create_all`：只建缺失的表，**不会修改已有表结构**。改字段需要引入 Alembic 之类的迁移工具。
- 新增 `table=True` 的模型必须在 `core/database.py` 的 `init_db()` 中 import，否则 metadata 里没有它，表不会被创建。
- 接口通过 `session: SessionDep` 拿到一个请求级 Session，请求结束自动关闭。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/auth/register` | 注册 |
| POST | `/auth/login` | 登录，返回 `access_token` |
| GET | `/auth/me` | 当前用户，需请求头 `Authorization: Bearer <token>` |

成功一律返回 200；业务错误由全局处理器统一转成 `{code, detail}`，HTTP 层不写 `try/except`。

## 常用命令

```bash
uv sync                # 按 uv.lock 安装/同步依赖
uv run dev             # 启动开发服务器（热重载）
uv run ruff check .    # Lint
uv run ruff format .   # 格式化
```
