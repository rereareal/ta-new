"""Agent 循环：与大模型对话、调度工具、转发流。

模型负责理解问题、生成讲解和「提出」工具调用请求；真正的参数校验、工具执行和循环控制
由后端掌握。这里把「调用模型 -> 执行工具 -> 回传结果」串成循环，并把上游 OpenAI 流
翻译成项目自己的 SSE 事件，前端只认我们的事件协议，以后换模型供应商不用改前端。
"""

from collections.abc import AsyncIterator

from core.config import settings
from core.errors import ServiceError
from core.llm import client
from modules.agent.prompts import build_teacher_prompt
from modules.agent.schemas import AgentContext
from modules.agent.tools import TOOL_SCHEMAS, execute_tool


# ── 业务错误：各模块原地定义，全局处理器默认映射为 400 ──────────────────
class AgentTurnLimitError(ServiceError):
    code = "AGENT_TURN_LIMIT"
    default_detail = "工具调用轮数超限"


class AgentModelError(ServiceError):
    code = "AGENT_MODEL_ERROR"
    default_detail = "模型请求未正常完成"


async def run_agent_once(user_text: str, ctx: AgentContext, max_turns: int = 5) -> str:
    """多轮工具调用（非流式）：调用模型 -> 执行工具 -> 回传结果，直到给出最终回答。"""
    pending_input: str | list[dict] = user_text
    response_id: str | None = ctx.last_response_id

    for _ in range(max_turns):
        resp = await client.responses.create(
            model=settings.openai_model,
            instructions=build_teacher_prompt(ctx),
            input=pending_input,
            previous_response_id=response_id,
            tools=TOOL_SCHEMAS,
            parallel_tool_calls=False,  # 初期关闭并行，先把日志跑稳
        )
        response_id = resp.id
        calls = [i for i in resp.output if i.type == "function_call"]
        if not calls:
            return resp.output_text  # 无工具调用，返回最终回答
        pending_input = [
            {
                "type": "function_call_output",
                "call_id": c.call_id,
                "output": await execute_tool(c.name, c.arguments, ctx),
            }
            for c in calls
        ]
    raise AgentTurnLimitError()


async def run_agent_stream(
    user_text: str, ctx: AgentContext, max_turns: int = 5
) -> AsyncIterator[dict]:
    """多轮工具调用（流式）：把上游 OpenAI 流翻译成项目自己的 SSE 事件字典。

    每个事件形如 {"event": ..., "data": ...}，由 router 编码成 SSE 帧推给前端。
    """
    pending_input: str | list[dict] = user_text
    response_id: str | None = ctx.last_response_id

    for _ in range(max_turns):
        stream = await client.responses.create(
            model=settings.openai_model,
            instructions=build_teacher_prompt(ctx),
            input=pending_input,
            previous_response_id=response_id,
            tools=TOOL_SCHEMAS,
            parallel_tool_calls=False,
            stream=True,
        )
        pending_calls = []
        async for ev in stream:
            if ev.type == "response.output_text.delta":
                yield {"event": "message.delta", "data": {"text": ev.delta}}
            elif (
                ev.type == "response.output_item.done"
                and ev.item.type == "function_call"
            ):
                pending_calls.append(ev.item)
            elif ev.type == "response.completed":
                response_id = ev.response.id
            elif ev.type in ("response.failed", "response.incomplete", "error"):
                raise AgentModelError()
        if not pending_calls:
            yield {"event": "run.completed", "data": {"run_id": ctx.run_id}}
            return
        pending_input = []
        for c in pending_calls:
            yield {"event": "tool.started", "data": {"tool": c.name}}
            out = await execute_tool(c.name, c.arguments, ctx)
            yield {"event": "tool.completed", "data": {"tool": c.name}}
            pending_input.append(
                {"type": "function_call_output", "call_id": c.call_id, "output": out}
            )
    raise AgentTurnLimitError()
