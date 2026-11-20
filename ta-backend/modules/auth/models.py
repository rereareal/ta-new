"""数据库表模型（SQLModel = SQLAlchemy + Pydantic）。

文档：SQL 数据库 https://fastapi.tiangolo.com/zh/tutorial/sql-databases/

table=True 的类才会映射成数据库表（字段即列）；它由 core/database.py 的
init_db() 统一建表。
"""

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    # id 省略 = 自增主键；类型允许 None，是因为 INSERT 之前还没有值。
    id: int | None = Field(default=None, primary_key=True)
    # unique=True 让数据库层直接兜住重复用户名：并发下比“先查再插”更可靠。
    username: str = Field(index=True, unique=True)
    # 只存哈希，绝不存明文。
    password_hash: str
