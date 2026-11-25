"""本地工具注册表与执行入口。

Function Calling 的本质：模型不会替你运行 Python 函数，它只返回「想调哪个工具 + 参数 JSON」，
真正校验和执行的是后端。所以这里把「给模型的工具定义」和「真实执行函数」收在同一个注册表里，
便于单独测试。身份信息只从后端传入的 ctx 拿，模型只填业务参数。
"""

import inspect
from collections.abc import Callable

from pydantic import BaseModel

from modules.agent.schemas import AgentContext

# 工具注册表：函数名 -> (参数模型, 函数)；TOOL_SCHEMAS 是交给模型的 JSON Schema 清单。
TOOL_REGISTRY: dict[str, tuple[type[BaseModel], Callable]] = {}
TOOL_SCHEMAS: list[dict] = []


def register_tool(args_model: type[BaseModel]) -> Callable[[Callable], Callable]:
    """把函数注册为可供模型调用的工具，并把参数模型转成 JSON Schema。"""

    def decorator(func: Callable) -> Callable:
        schema = args_model.model_json_schema()
        schema["additionalProperties"] = False
        TOOL_REGISTRY[func.__name__] = (args_model, func)
        TOOL_SCHEMAS.append(
            {
                "type": "function",
                "name": func.__name__,
                "description": inspect.getdoc(func) or "",
                "parameters": schema,
                "strict": True,
            }
        )
        return func

    return decorator


async def execute_tool(name: str, raw_args: str, ctx: AgentContext) -> str:
    """按名称查注册表，校验参数 JSON 后执行，返回交给模型的结果文本。"""
    args_model, func = TOOL_REGISTRY[name]
    return await func(ctx, args_model.model_validate_json(raw_args))


# ── 第一个只读工具：先用内存示例讲义模拟课件检索（后续迭代替换成查数据库）───
DEMO_NOTES = [
    "【第3章 事务】事务是不可分割的操作序列，满足 ACID 特性。",
    "【第3章 隔离级别】包括读未提交、读已提交、可重复读和串行化。",
]


class SearchArgs(BaseModel):
    keyword: str


@register_tool(SearchArgs)
async def search_course_materials(ctx: AgentContext, args: SearchArgs) -> str:
    """按关键词检索课程讲义。学生问具体课程概念时调用。"""
    hits = [n for n in DEMO_NOTES if args.keyword in n]
    return "\n".join(hits) if hits else "未找到匹配讲义"
