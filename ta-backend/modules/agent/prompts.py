"""助教角色与教学引导提示词。

instructions 不会被 previous_response_id 自动继承，每轮都要传入——正好用来动态注入
当前章节大纲和教学引导要求；MVP 先返回固定角色提示，后续在 build_teacher_prompt 里拼装。
"""

from modules.agent.schemas import AgentContext

# 助教角色定位：优先引导学生思考，而不是直接给答案。
TEACHER_PROMPT = "你是计算机课程助教，优先引导学生思考。"


def build_teacher_prompt(ctx: AgentContext) -> str:
    """构建当轮 instructions。MVP 先返回固定角色提示，后续注入当前章节大纲。"""
    return TEACHER_PROMPT
