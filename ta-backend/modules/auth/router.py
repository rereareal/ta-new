"""认证接口：只做「收参数 -> 调 service -> 返回 Schema」。

文档：路径操作 https://fastapi.tiangolo.com/zh/tutorial/first-steps/
     返回类型与响应模型 https://fastapi.tiangolo.com/zh/tutorial/response-model/

成功一律 200；业务错误由 service 抛 ServiceError，全局处理器统一转成
{code, detail}，所以这里不需要 try/except，也不用写 responses。
"""

from typing import Annotated

from fastapi import APIRouter, Depends

from core.database import SessionDep
from modules.auth import service
from modules.auth.deps import get_current_user
from modules.auth.models import User
from modules.auth.schemas import Token, UserCreate, UserLogin, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(user: UserCreate, session: SessionDep) -> UserPublic:
    """注册新用户。"""
    db_user = service.create_user(session, user.username, user.password)
    return UserPublic.model_validate(db_user)


@router.post("/login")
def login(user: UserLogin, session: SessionDep) -> Token:
    """登录，返回 access_token。"""
    return Token(access_token=service.login(session, user.username, user.password))


@router.get("/me")
def read_me(current_user: Annotated[User, Depends(get_current_user)]) -> UserPublic:
    """当前登录用户，需在请求头带 Authorization: Bearer <token>。"""
    return UserPublic.model_validate(current_user)
