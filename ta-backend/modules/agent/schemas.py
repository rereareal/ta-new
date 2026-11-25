"""Agent 接口的请求 / 响应模型与一次运行的上下文。

文档：请求体 https://fastapi.tiangolo.com/zh/tutorial/body/
"""

from dataclasses import dataclass

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)


class ChatReply(BaseModel):
    reply: str


class RunRequest(BaseModel):
    message: str = Field(min_length=1)


@dataclass
class AgentContext:
    """一次运行（run）的请求级上下文：由 router 创建，贯穿 service 与 tools。

    - user_id：从 get_current_user 拿到，工具做权限 / 归属校验时用；
    - run_id：本次运行的标识，SSE 收尾事件会回给前端；
    - last_response_id：上一轮 OpenAI response 的 id（MVP 无会话持久化，恒为 None）。
    """

    user_id: int
    run_id: str
    last_response_id: str | None = None
