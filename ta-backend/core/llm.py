"""OpenAI 异步客户端：全项目复用，应用启停时各创建 / 释放一次。

和 core/database.py 里的数据库引擎同一思路：连接池跨请求复用，避免每次请求重复建连。
FastAPI 跑在单线程异步事件循环上，所以用 AsyncOpenAI 而不是同步 OpenAI，否则等模型
吐字会卡住其他请求。密钥从 settings.openai_api_key 注入，不写死在代码里。
"""

from openai import AsyncOpenAI

from core.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)
