"""应用配置：从环境变量和 .env 文件读取。

文档：设置与环境变量 https://fastapi.tiangolo.com/zh/advanced/settings/

优先级：系统环境变量 > 项目根目录 .env > 字段默认值。
本地开发请先复制模板：cp .env.example .env
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "sqlite:///./ta.db"

    # JWT 签名密钥：必填，泄露 = 任何人都能伪造登录态，切勿提交到仓库。
    secret_key: str
    algorithm: str = "HS256"

    # token 有效期（分钟）
    access_token_expire_minutes: int = 60 * 24


settings = Settings()  # type: ignore[call-arg]
