"""统一错误处理。

约定：
- 成功一律 200，响应体是接口声明的返回模型；
- 全项目只出现 200 / 400 / 401 / 404 四个状态码；
- 业务层只抛 ServiceError（错误类型 + 描述），不碰 HTTP；
- 状态码映射和响应体格式只在本文件里，改规则不用动业务代码。

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

    VALIDATION_ERROR = "VALIDATION_ERROR"        # 参数校验失败
    USERNAME_TAKEN = "USERNAME_TAKEN"            # 用户名已被占用
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"  # 用户名或密码错误
    UNAUTHORIZED = "UNAUTHORIZED"                # 未登录 / token 无效
    NOT_FOUND = "NOT_FOUND"                      # 路径或资源不存在
    HTTP_ERROR = "HTTP_ERROR"                    # 框架层错误兜底


class ServiceError(Exception):
    """业务错误基类：子类只需指定 code，状态码由处理器决定。"""

    code: ErrorCode

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


# 错误码 -> HTTP 状态码（唯一映射表）
STATUS_BY_CODE: dict[ErrorCode, int] = {
    ErrorCode.VALIDATION_ERROR: status.HTTP_400_BAD_REQUEST,
    ErrorCode.USERNAME_TAKEN: status.HTTP_400_BAD_REQUEST,
    ErrorCode.INVALID_CREDENTIALS: status.HTTP_400_BAD_REQUEST,
    ErrorCode.UNAUTHORIZED: status.HTTP_401_UNAUTHORIZED,
    ErrorCode.NOT_FOUND: status.HTTP_404_NOT_FOUND,
    ErrorCode.HTTP_ERROR: status.HTTP_400_BAD_REQUEST,
}


def _json(status_code: int, code: ErrorCode, detail: str) -> JSONResponse:
    headers = (
        # UNAUTHORIZED 按 HTTP 规范要带 WWW-Authenticate，属于协议细节，不放业务层
        {"WWW-Authenticate": "Bearer"}
        if code is ErrorCode.UNAUTHORIZED
        else None
    )
    return JSONResponse(
        status_code=status_code,
        content={"code": code.value, "detail": detail},
        headers=headers,
    )


# 处理器签名必须是 (Request, Exception)，类型收窄只能在函数内部做。
async def service_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """业务错误 -> HTTP 响应。"""
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
    """框架层错误兜底：404 原样保留，其余（405/415...）压成 400。"""
    err = cast(StarletteHTTPException, exc)
    if err.status_code == status.HTTP_404_NOT_FOUND:
        return _json(status.HTTP_404_NOT_FOUND, ErrorCode.NOT_FOUND, str(err.detail))
    if err.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN):
        return _json(err.status_code, ErrorCode.UNAUTHORIZED, str(err.detail))
    return _json(status.HTTP_400_BAD_REQUEST, ErrorCode.HTTP_ERROR, str(err.detail))


def install_error_handlers(app: FastAPI) -> None:
    """main.py 调用一次，装上三个处理器。"""
    app.add_exception_handler(ServiceError, service_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_error_handler)
