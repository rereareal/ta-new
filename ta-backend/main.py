"""FastAPI 应用入口。文档：https://fastapi.tiangolo.com/zh/tutorial/first-steps/"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from core.database import enging, init_db
from core.errors import install_error_handlers
from core.llm import client
from modules.agent.router import router as agent_router
from modules.auth.router import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()  # 启动：建表
    yield  # 运行期间
    await client.close()  # 关闭：释放大模型连接
    enging.dispose()  # 关闭：释放连接池


app = FastAPI(lifespan=lifespan)
install_error_handlers(app)  # 统一错误格式 {code, detail}
app.include_router(auth_router)
app.include_router(agent_router)
