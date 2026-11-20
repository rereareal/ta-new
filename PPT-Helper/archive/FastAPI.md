# FastAPI

## 从一个接口开始，看它替我们省掉了什么

---

## 先看看没有框架时要写多少

一个普通的「创建用户」接口，手写大致是这样：

```python
def create_user(request):
    data = json.loads(request.body)              # 1. 解析 JSON
    if not isinstance(data.get("name"), str):    # 2. 校验每个字段
        return error(422, "name 必须是字符串")
    if not isinstance(data.get("age"), int):
        return error(422, "age 必须是整数")
    # ...还有十个字段
    return json.dumps({"id": 1, **data})         # 3. 序列化
    # 4. 文档？自己写
```

解析、校验、错误格式、文档，每样都要手写一遍。

---

## FastAPI 的做法：把类型写进签名

先看效果，细节后面再拆：

```python
class User(BaseModel):
    name: str
    age: int

@app.post("/users")
def create_user(user: User):
    return user
```

- 解析 JSON、校验字段、失败返回 422 → 全由 FastAPI + Pydantic 处理
- 对外文档 → 从类型注解直接生成

---

## 从最简单的开始

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"hello": "world"}
```

```bash
uvicorn main:app --reload    # main 是文件名，app 是实例
```

- 返回 dict 会自动转成 JSON 响应
- 打开 `/docs`，这个接口已经出现在文档里了

---

## 参数从哪来？

```python
@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
```

- `item_id` 出现在路径里 → **路径参数**
- `q` 不在路径里 → **查询参数**
- `int` 会真的转换：`/items/abc` 直接 422，不用写 if
- 想加约束：`item_id: int = Path(ge=1)`

---

## 要接收一个 JSON：定义模型

```python
class Item(BaseModel):
    name: str
    price: float
    tags: list[str] = []

@app.post("/items")
def create_item(item: Item):
    return item
```

为什么不用 `dict`：

- 嵌套结构能递归校验，字段有默认值和约束
- 编辑器里 `item.` 有补全

---

## 类型不对时，框架替你报错

```json
{
  "detail": [{
    "loc": ["body", "price"],
    "msg": "Input should be a valid number",
    "type": "float_parsing"
  }]
}
```

- `loc` 直接指出是哪个字段
- `type` 是稳定的机器可读标识
- 前端可以按 `loc` 把错误显示到对应输入框

你不用再设计错误格式，只要处理它。

---

## 文档是免费送的

- 打开 `/docs`：可交互的 Swagger，能直接点 "Try it out"
- `/redoc`：另一套更适合阅读的样式
- `/openapi.json`：机器可读，能生成客户端 SDK

这些不是额外写的，是类型注解的副产品。

> 也因此，类型写得含糊，文档就含糊。

---

## 新的重复出现了

```python
@app.get("/heroes")
def list_heroes():
    with Session(engine) as session:      # 每个函数都来一遍
        return session.exec(select(Hero)).all()

@app.get("/heroes/{hero_id}")
def read_hero(hero_id: int):
    with Session(engine) as session:      # 又来一遍
        return session.get(Hero, hero_id)
```

连接管理、鉴权、当前用户，这些东西每个接口都要用。

---

## Depends：把重复的部分抽出来

```python
def get_session():
    with Session(engine) as session:
        yield session

@app.get("/heroes")
def list_heroes(session: Session = Depends(get_session)):
    return session.exec(select(Hero)).all()
```

- `yield` 之前是准备，之后是清理，请求结束自动执行
- 同一次请求里，相同依赖只执行一次
- 测试时用 `dependency_overrides` 整体替换成测试库

---

## 接口多了，文件也乱了

```python
# users.py
router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}")
def read_user(user_id: int):
    ...

# main.py
app.include_router(router)
```

- 按业务拆文件，`prefix` 省掉重复前缀
- `tags` 决定文档里的分组
- `main.py` 只剩组装工作

---

## 业务错误怎么返回

```python
@app.get("/heroes/{hero_id}")
def read_hero(hero_id: int, session: Session = Depends(get_session)):
    hero = session.get(Hero, hero_id)
    if hero is None:
        raise HTTPException(status_code=404, detail="Hero not found")
    return hero
```

区分两种错误：

- **422**：数据格式不对，框架处理
- **404 / 409**：业务规则不满足，你处理

---

## 什么时候该写 async def

```python
@app.get("/slow")
async def slow():
    time.sleep(3)        # 阻塞 3 秒，整个服务跟着卡住
    return {}

@app.get("/slow-ok")
def slow_ok():
    time.sleep(3)        # 在线程池里跑，不卡事件循环
    return {}
```

- 用同步库（SQLAlchemy、requests）→ 写 `def`
- 用异步库（asyncpg、httpx）→ 写 `async def`
- 写错不会报错，只会在高并发时变慢

---

## 前端报跨域？加 CORS

> 控制台：Access to fetch from origin 'http://localhost:5173'
> has been blocked by CORS policy

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

前后端分离开发时基本必配；生产别写 `["*"]`。

---

## 改完怎么确认没坏

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_user():
    r = client.post("/users", json={"name": "Alice", "age": 30})
    assert r.status_code == 200
    assert r.json()["name"] == "Alice"
```

- 不用起服务器，直接测应用对象
- 顺便测一下坏数据：`json={"age": "abc"}` 应该得到 422

---

## 上线前的几件事

- 用 `uvicorn main:app --workers 4`，或 gunicorn + uvicorn worker
- 前面放 Nginx / Caddy，处理 TLS、静态文件、限流
- `--reload` 只用于本地
- 加健康检查接口，配结构化日志
- 容器里 worker 数和 CPU 核数匹配，别开太多

---

## 回头看：它到底做了什么

| 你写的 | 框架做的 |
| --- | --- |
| 函数签名 | 参数解析 + 类型校验 |
| Pydantic 模型 | 422 错误体 + schema |
| 类型注解 | OpenAPI 文档 |
| `yield` 依赖 | 资源创建与释放 |
| `async def` | 并发调度 |

写 FastAPI 的工作，大部分是在把「数据长什么样」描述清楚。

---

## 参考

- 教程：[fastapi.tiangolo.com/tutorial](https://fastapi.tiangolo.com/tutorial/)
- 文档：[fastapi.tiangolo.com](https://fastapi.tiangolo.com/)
- 想深入内幕：[Starlette](https://www.starlette.io/)
