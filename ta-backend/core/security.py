"""密码哈希与 JWT 签发 / 校验。

文档：安全 - OAuth2 密码与 JWT https://fastapi.tiangolo.com/zh/tutorial/security/oauth2-jwt/

官方教程用 passlib/pwdlib + bcrypt；这里改用标准库 scrypt（同为抗暴力破解的
慢哈希，且不引入额外依赖），思路完全一致：只保存哈希，绝不保存明文。
"""

import hashlib
import hmac
import os
from datetime import UTC, datetime, timedelta

import jwt  # PyJWT

from core.config import settings

_SCRYPT_N, _SCRYPT_R, _SCRYPT_P = 2**14, 8, 1


# ── 密码：scrypt + 每条密码独立随机盐 ─────────────────────────────────
# 存储格式：scrypt$<盐的 hex>$<哈希的 hex>，盐随哈希一起存，不需要额外字段。
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(
        password.encode(), salt=salt, n=_SCRYPT_N, r=_SCRYPT_R, p=_SCRYPT_P
    )
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        scheme, salt_hex, digest_hex = password_hash.split("$")
    except ValueError:
        return False
    if scheme != "scrypt":
        return False
    digest = hashlib.scrypt(
        password.encode(),
        salt=bytes.fromhex(salt_hex),
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
    )
    # 等时比较：避免攻击者通过响应时间猜出哈希前缀。
    return hmac.compare_digest(digest.hex(), digest_hex)


# ── Token：JWT（服务端不存 session，靠签名自证）────────────────────────
def create_access_token(subject: str) -> str:
    """把用户名放进 sub 字段，带过期时间，用 SECRET_KEY 签名。"""
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": subject, "exp": expire},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def decode_token(token: str) -> str | None:
    """验签 + 检查过期；篡改、伪造、过期都会抛异常，统一当作无效返回 None。"""
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
    except jwt.PyJWTError:
        return None
    return payload.get("sub")
