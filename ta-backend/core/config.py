"""配置常量。

文档：设置与环境变量 https://fastapi.tiangolo.com/zh/advanced/settings/

真实项目应改成从环境变量 / .env 读取（配合 pydantic-settings），
这里的硬编码值仅用于本地开发。
"""

DATABASE_URL = "sqlite:///./ta.db"

# JWT 签名密钥：泄露 = 任何人都能伪造登录态，生产环境必须从环境变量注入。
SECRET_KEY = "dev-only-secret-key-change-me-in-production"
ALGORITHM = "HS256"

# token 有效期（分钟）
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
