"""Agent 接口：极薄路由，收参 -> 调 service -> 返回 Schema / SSE 流。

路由层只负责鉴权、收参和返回流，不写模型循环。业务错误由 service 抛 ServiceError，
非流式接口交给全局处理器统一转成 {code, detail}；流式接口已开始推流，只能在流内
捕获 ServiceError 并推一条 error 事件收尾。
"""

import json
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from core.errors import ServiceError
from modules.agent import service
from modules.agent.schemas import AgentContext, ChatReply, ChatRequest, RunRequest
from modules.auth.deps import get_current_user
from modules.auth.models import User

router = APIRouter(prefix="/agent", tags=["agent"])

CurrentUser = Annotated[User, Depends(get_current_user)]


def encode_sse(event: str, data: dict) -> str:
    """把事件编码成 SSE 帧：event: / data: / 空行。"""
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _new_context(user: User) -> AgentContext:
    return AgentContext(user_id=user.id, run_id=uuid4().hex)


@router.post("/chat")
async def chat(req: ChatRequest, user: CurrentUser) -> ChatReply:
    """多轮工具调用问答（非流式），用于在 /docs 快速验证工具循环。"""
    reply = await service.run_agent_once(req.message, _new_context(user))
    return ChatReply(reply=reply)


@router.post("/runs")
async def create_run(
    req: RunRequest, request: Request, user: CurrentUser
) -> StreamingResponse:
    """多轮工具调用问答（SSE 流式），逐字推送文本并实时通知工具执行状态。"""

    async def event_stream():
        ctx = _new_context(user)
        try:
            async for ev in service.run_agent_stream(req.message, ctx):
                if await request.is_disconnected():
                    return
                yield encode_sse(ev["event"], ev["data"])
        except ServiceError as exc:
            yield encode_sse("error", {"code": exc.code, "detail": exc.detail})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
