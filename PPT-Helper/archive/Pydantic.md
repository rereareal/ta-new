# Pydantic

## 从一条不可信的数据开始

---

## 问题从一条脏数据开始

客户端发来一个「创建用户」的 JSON：

```json
{"name": 123, "age": "abc", "email": null}
```

如果直接 `data["age"] + 1`，程序会在很远的地方才崩掉，
报错信息还看不出是哪个字段出的问题。

数据进入你的代码之前，得先有一道关卡。

---

## 手写校验的样子

```python
def create_user(data: dict):
    if not isinstance(data.get("name"), str):
        return error(422, "name 必须是字符串")
    age = data.get("age")
    if not isinstance(age, int):
        try:
            age = int(age)
        except (TypeError, ValueError):
            return error(422, "age 必须是整数")
    # ...剩下八个字段
```

- 每个字段一段，重复且容易漏
- 类型转换和错误格式都得自己写

---

## 换成声明式

```python
class User(BaseModel):
    name: str
    age: int

User(name="Alice", age="30")   # age 自动变成 30
User(name=123, age="abc")      # ValidationError
```

- 你只描述「数据长什么样」
- 校验、转换、错误信息都由它推导出来
- 拿到的对象有类型，编辑器里能补全

---

## 它其实做了三件事

1. **解析**：把 dict / JSON 读成模型
2. **校验**：类型、约束、业务规则
3. **转换**：`"30"` → `30`，`1` → `True`

任何一步失败，都会聚合成一个 `ValidationError`，
里面列出所有出错的字段，而不是遇到第一个就停。

---

## 为什么要自动转换

```python
class User(BaseModel):
    age: int

User(age="30").age      # 30
User(age=30.9).age      # 30
User(age="abc")         # ValidationError
```

真实世界的数据几乎都是字符串：HTML 表单、环境变量、CSV、命令行参数。
需要严格时用 `Field(strict=True)` 或 `ConfigDict(strict=True)`。

---

## 约束写在字段上

```python
class Item(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    price: float = Field(gt=0)
    sku: str = Field(pattern=r"^[A-Z]{3}-\d{4}$")
```

- `gt` / `ge` / `lt` / `le`：数值范围
- `min_length` / `max_length`：字符串、列表长度
- `pattern`：正则匹配

这些约束会同时出现在 OpenAPI 文档里，前端能看到。

---

## 结构变复杂时

```python
class Address(BaseModel):
    city: str
    zipcode: str

class User(BaseModel):
    name: str
    address: Address
    friends: list[str] = []
```

- 嵌套模型自动递归校验，不用手写
- 出错时能定位到具体路径：`address.city`
- 列表里第几个元素错了也会指出来

---

## 出错时，调用方拿到什么

```json
{
  "detail": [{
    "loc": ["body", "address", "city"],
    "msg": "Field required",
    "type": "missing"
  }]
}
```

- `loc` 是出错位置，`type` 是稳定的机器可读标识
- 一次返回所有错误，不是只报第一个
- 前端可以按 `loc` 把提示显示到对应输入框

---

## 类型管不了的规则

```python
@field_validator("name")
@classmethod
def name_not_empty(cls, v: str) -> str:
    if not v.strip():
        raise ValueError("名字不能为空")
    return v.strip()
```

- 类型只能保证「是字符串」，管不了「不能全是空格」
- 单个字段用 `@field_validator`
- 字段之间的关系用 `@model_validator(mode="after")`，
  比如 `start_time < end_time`

---

## 输入和输出往往不是同一个模型

```python
class UserIn(BaseModel):
    name: str
    password: str

class UserOut(BaseModel):
    name: str

UserOut.model_validate(user_in).model_dump()
# {'name': 'Alice'}  —— password 被丢掉了
```

- 输入模型带敏感字段，输出模型不要带
- `model_dump(exclude={"password"})` 也能做到，但模型分开更清楚
- 对外用 camelCase、对内用 snake_case 时，用 `Field(alias=...)`

---

## 几个常用的配置

```python
class User(BaseModel):
    model_config = ConfigDict(
        extra="forbid",         # 多传字段直接报错
        frozen=True,            # 创建后不可修改
        from_attributes=True,   # 从 ORM 对象构造
    )
    name: str
```

- `extra="forbid"` 让接口契约更严格，能及早发现前端的笔误
- `from_attributes=True` 就能 `User.model_validate(orm_obj)`

---

## 从 v1 升到 v2 的改名表

| v1 | v2 |
| --- | --- |
| `.dict()` | `.model_dump()` |
| `.json()` | `.model_dump_json()` |
| `.parse_obj()` | `.model_validate()` |
| `class Config` | `model_config = ConfigDict(...)` |
| `@validator` | `@field_validator` |
| `orm_mode` | `from_attributes` |

v2 的校验核心用 Rust 重写，速度提升明显。

---

## 它在 FastAPI 里扮演什么

- 请求体、查询参数、响应模型的类型来源都是 Pydantic
- 校验失败 → 422，响应体就是 `ValidationError` 的内容
- `/openapi.json` 里的 schema 由模型直接生成

> 写 FastAPI 时，大部分「接口契约」其实是在写 Pydantic 模型。

---

## 参考

- 文档：[docs.pydantic.dev](https://docs.pydantic.dev/)
- 迁移指南：[Migrating to V2](https://docs.pydantic.dev/latest/migration/)
- FastAPI 中的用法：[fastapi.tiangolo.com](https://fastapi.tiangolo.com/)
