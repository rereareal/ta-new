"""请求 / 响应模型（Pydantic）：只描述接口的“外形”，不碰数据库。

文档：请求体 https://fastapi.tiangolo.com/zh/tutorial/body/
     响应模型 https://fastapi.tiangolo.com/zh/tutorial/response-model/
"""

from pydantic import BaseModel, ConfigDict, Field


# ── 请求模型：Field 里的约束由 Pydantic 执行 ──────────────────────────
# 校验失败时 FastAPI 自动返回 422，并指出是哪个字段、什么原因。
# 密码强度只在“注册”时校验。
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=6)


# 登录只和库里比对，不做密码强度校验：否则弱密码老用户会被 422 拦下，
# 也等于把密码规则提前暴露给攻击者。
class UserLogin(BaseModel):
    username: str
    password: str


# ── 响应模型：决定“哪些字段能被返回” ─────────────────────────────────
# 模型里没有 password / password_hash，所以即使传入 User 对象，
# 这两个字段也会被丢掉 —— 这就是用响应模型防泄露的做法。
# from_attributes=True 允许直接拿 ORM 对象校验：UserPublic.model_validate(user)。
class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str


# token_type 是 OAuth2 固定的协议值（Bearer 认证），永远是 "bearer"：
# 放在模型默认值里成为唯一定义，返回值处就不用再硬编码一遍。
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
