"""数据库引擎、建表与请求级 Session。

文档：SQL 数据库 https://fastapi.tiangolo.com/zh/tutorial/sql-databases/
"""

from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine

from core.config import DATABASE_URL

# check_same_thread=False 允许 SQLite 连接跨线程使用：
# FastAPI 会把普通 def 接口丢到线程池执行，连接可能在不同线程里被用到。
enging = create_engine(url=DATABASE_URL, connect_args={"check_same_thread": False})


def init_db() -> None:
    """建表，在应用启动时（main.py 的 lifespan）调用一次。

    必须先 import 所有 table=True 的模型，SQLModel.metadata 才知道要建哪些表；
    放在函数内 import 是为了避免 core -> modules 的循环导入。
    create_all 只建缺失的表，不会修改已有表结构；改字段请用 Alembic 之类的迁移工具。
    """
    from modules.auth import models  # noqa: F401

    SQLModel.metadata.create_all(enging)


def get_session() -> Iterator[Session]:
    """给每个请求一个 Session：yield 前创建，请求结束（或抛异常）后关闭。"""
    with Session(enging) as session:
        yield session


# 任何模块都能用的 Session 依赖别名，接口参数直接写 session: SessionDep。
SessionDep = Annotated[Session, Depends(get_session)]
