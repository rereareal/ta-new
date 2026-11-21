"""统一错误处理。

约定：
- 成功一律 200，响应体是接口声明的返回模型；
- 业务层只抛 ServiceError（错误类型 + 描述），不碰 HTTP，状态码只出 400 / 401；
- 404（路径不存在）与 500（未预期异常）由框架层统一兜底；
- 全项目只出现 200 / 400 / 401 / 404 / 500 五个状态码，映射规则只在本文件维护。

失败响应体固定为 {"code": ..., "detail": ...}。

文档：https://fastapi.tiangolo.com/zh/tutorial/handling-errors/
"""

from enum import StrEnum
from typing import cast

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class ErrorCode(StrEnum):
    """机器可读的错误码：前端按 code 做分支，不再猜状态码。"""

    # 业务层
    USERNAME_TAKEN = "USERNAME_TAKEN"            # 用户名已被占用
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"  # 用户名或密码错误
    UNAUTHORIZED = "UNAUTHORIZED"                # 未登录 / token 无效

    # 框架层
    VALIDATION_ERROR = "VALIDATION_ERROR"        # 参数校验失败
    NOT_FOUND = "NOT_FOUND"                      # 路径不存在（仅框架路由触发）
    HTTP_ERROR = "HTTP_ERROR"                    # 其余框架层 HTTP 错误兜底
    INTERNAL_ERROR = "INTERNAL_ERROR"            # 服务端未预期异常


class ServiceError(Exception):
    """业务错误基类：子类只需指定 code，状态码由处理器决定。"""

    code: ErrorCode

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


# 业务错误码 -> HTTP 状态码（业务层只允许 400 / 401，未列出的默认 400）
STATUS_BY_CODE: dict[ErrorCode, int] = {
    ErrorCode.USERNAME_TAKEN: status.HTTP_400_BAD_REQUEST,
    ErrorCode.INVALID_CREDENTIALS: status.HTTP_400_BAD_REQUEST,
    ErrorCode.UNAUTHORIZED: status.HTTP_401_UNAUTHORIZED,
}


def _json(status_code: int, code: ErrorCode, detail: str) -> JSONResponse:
    headers = (
        # UNAUTHORIZED 按 HTTP 规范要带 WWW-Authenticate，属于协议细节，不放业务层
        {"WWW-Authenticate": "Bearer"}
        if status_code == status.HTTP_401_UNAUTHORIZED
        else None
    )
    return JSONResponse(
        status_code=status_code,
        content={"code": code.value, "detail": detail},
        headers=headers,
    )


# 处理器签名必须是 (Request, Exception)，类型收窄只能在函数内部做。
async def service_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """业务错误 -> HTTP 响应（只映射到 400 / 401）。"""
    err = cast(ServiceError, exc)
    return _json(
        STATUS_BY_CODE.get(err.code, status.HTTP_400_BAD_REQUEST),
        err.code,
        err.detail,
    )


async def validation_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """参数校验失败（FastAPI 默认 422，这里统一成 400）。"""
    first = cast(RequestValidationError, exc).errors()[0]
    field = ".".join(str(part) for part in first["loc"] if part != "body")
    return _json(
        status.HTTP_400_BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
        f"{field}: {first['msg']}",
    )


async def http_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """框架层错误兜底：401 / 404 原样保留，5xx 压成 500，其余（403/405/415...）压成 400。"""
    err = cast(StarletteHTTPException, exc)
    if err.status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR:
        return _json(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            ErrorCode.INTERNAL_ERROR,
            "服务器内部错误",
        )
    if err.status_code == status.HTTP_401_UNAUTHORIZED:
        return _json(
            status.HTTP_401_UNAUTHORIZED, ErrorCode.UNAUTHORIZED, str(err.detail)
        )
    if err.status_code == status.HTTP_404_NOT_FOUND:
        return _json(status.HTTP_404_NOT_FOUND, ErrorCode.NOT_FOUND, str(err.detail))
    return _json(status.HTTP_400_BAD_REQUEST, ErrorCode.HTTP_ERROR, str(err.detail))


async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """未预期异常兜底：统一返回 500，不把内部报错细节暴露给调用方。"""
    return _json(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR,
        "服务器内部错误",
    )


def install_error_handlers(app: FastAPI) -> None:
    """main.py 调用一次，装上四个处理器。"""
    app.add_exception_handler(ServiceError, service_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)
