"""认证业务逻辑：只处理规则与数据，不关心 HTTP。"""

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from core.errors import ServiceError, Unauthorized
from core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)
from modules.auth.models import User


# ── 业务错误：各模块原地定义，全局处理器默认映射为 400 ──────────────────
class UsernameTaken(ServiceError):
    code = "USERNAME_TAKEN"
    default_detail = "用户名已被占用"


class InvalidCredentials(ServiceError):
    """用户不存在或密码错误。两者有意合并，避免泄露哪些用户名已注册。"""

    code = "INVALID_CREDENTIALS"
    default_detail = "用户名或密码错误"


# ── 查询 / 注册 / 登录 ────────────────────────────────────────────────
def get_user_by_username(session: Session, username: str) -> User | None:
    return session.exec(select(User).where(User.username == username)).first()


def create_user(session: Session, username: str, password: str) -> User:
    """写入新用户，返回带自增 id 的 User（密码只存哈希）。"""
    user = User(username=username, password_hash=hash_password(password))
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        # 并发下两个请求可能同时通过“查重”，最终由数据库唯一索引拦下。
        session.rollback()
        raise UsernameTaken() from None
    session.refresh(user)
    return user


def authenticate_token(session: Session, token: str) -> User:
    """把 token 解析成用户；验签失败、过期、用户已删除都当未登录。"""
    username = decode_token(token)
    if username is None:
        raise Unauthorized()
    user = get_user_by_username(session, username)
    if user is None:
        raise Unauthorized()
    return user


def login(session: Session, username: str, password: str) -> str:
    """校验密码并签发 access token。"""
    user = get_user_by_username(session, username)
    if user is None or not verify_password(password, user.password_hash):
        raise InvalidCredentials()
    return create_access_token(user.username)
