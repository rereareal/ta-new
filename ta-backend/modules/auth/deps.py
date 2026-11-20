"""依赖注入（Depends）与鉴权。

文档：依赖项 https://fastapi.tiangolo.com/zh/tutorial/dependencies/
     安全（Bearer token） https://fastapi.tiangolo.com/zh/tutorial/security/

这里只做 HTTP 层的事：从请求头取 token，剩下的交给 service。
"""

from typing import Annotated

from fastapi import Header

from core.database import SessionDep
from modules.auth import service
from modules.auth.models import User


def get_current_user(
    session: SessionDep,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    """解析 Authorization: Bearer <token>，返回当前用户。

    token -> 用户 的校验属于业务，放在 service.authenticate_token；
    失败时它抛 Unauthorized，由全局处理器转成 401 + {code, detail}。
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise service.Unauthorized("未登录或 token 无效")
    return service.authenticate_token(session, authorization.split(" ", 1)[1])
