"""统一错误处理。

约定：
- 成功一律 200，响应体是接口声明的返回模型；
- 业务层只需在各自模块继承 ServiceError 声明 code（及可选默认文案），不碰 HTTP；
- 业务错误默认映射到 400，只有 Unauthorized（及其子类）映射到 401；
- 404（路径不存在）与 500（未预期异常）由框架层统一兜底；
- 全项目只出现 200 / 400 / 401 / 404 / 500 五个状态码，映射规则只在本文件维护。

失败响应体固定为 {"code": ..., "detail": ...}。

文档：https://fastapi.tiangolo.com/zh/tutorial/handling-errors/
"""

from enum import StrEnum
from typing import ClassVar, cast

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class _FrameworkErrorCode(StrEnum):
    """框架层固定错误码：由全局处理器兜底产生，业务模块不得复用。"""

    VALIDATION_ERROR = "VALIDATION_ERROR"  # 参数校验失败
    NOT_FOUND = "NOT_FOUND"  # 路径不存在（仅框架路由触发）
    HTTP_ERROR = "HTTP_ERROR"  # 其余框架层 HTTP 错误兜底
    INTERNAL_ERROR = "INTERNAL_ERROR"  # 服务端未预期异常


class ServiceError(Exception):
    """业务错误基类：各模块原地继承并声明 code，默认映射为 400。"""

    code: ClassVar[str]
    default_detail: ClassVar[str] = ""
    _registry: ClassVar[dict[str, type[ServiceError]]] = {}

    def __init_subclass__(cls, **kwargs: object) -> None:
        super().__init_subclass__(**kwargs)
        code = cls.__dict__.get("code")
        if not isinstance(code, str) or not code.strip():
            raise TypeError(f"{cls.__name__} 必须定义非空字符串类属性 code")
        if code in _FrameworkErrorCode:
            raise ValueError(f"错误码 {code!r} 为框架保留字，业务异常不可复用")
        existing = ServiceError._registry.get(code)
        if existing is not None and (existing.__module__, existing.__qualname__) != (
            cls.__module__,
            cls.__qualname__,
        ):
            raise ValueError(
                f"错误码 {code!r} 重复定义：{existing.__qualname__} 与 {cls.__qualname__}"
            )
        ServiceError._registry[code] = cls

    def __init__(self, detail: str | None = None) -> None:
        self.detail = self.default_detail if detail is None else detail
        super().__init__(self.detail)


class Unauthorized(ServiceError):
    """未登录或凭证无效：跨模块通用，全局处理器映射为 401。"""

    code = "UNAUTHORIZED"
    default_detail = "未登录或 token 无效"


def _json(status_code: int, code: str, detail: str) -> JSONResponse:
    headers = (
        # UNAUTHORIZED 按 HTTP 规范要带 WWW-Authenticate，属于协议细节，不放业务层
        {"WWW-Authenticate": "Bearer"}
        if status_code == status.HTTP_401_UNAUTHORIZED
        else None
    )
    return JSONResponse(
        status_code=status_code,
        content={"code": str(code), "detail": detail},
        headers=headers,
    )


# 处理器签名必须是 (Request, Exception)，类型收窄只能在函数内部做。
async def service_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """业务错误 -> HTTP 响应（Unauthorized 映射为 401，其余统一 400）。"""
    err = cast(ServiceError, exc)
    status_code = (
        status.HTTP_401_UNAUTHORIZED
        if isinstance(err, Unauthorized)
        else status.HTTP_400_BAD_REQUEST
    )
    return _json(status_code, err.code, err.detail)


async def validation_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """参数校验失败（FastAPI 默认 422，这里统一成 400）。"""
    first = cast(RequestValidationError, exc).errors()[0]
    field = ".".join(str(part) for part in first["loc"] if part != "body")
    return _json(
        status.HTTP_400_BAD_REQUEST,
        _FrameworkErrorCode.VALIDATION_ERROR,
        f"{field}: {first['msg']}",
    )


async def http_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """框架层错误兜底：401 / 404 原样保留，5xx 压成 500，其余（403/405/415...）压成 400。"""
    err = cast(StarletteHTTPException, exc)
    if err.status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR:
        return _json(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            _FrameworkErrorCode.INTERNAL_ERROR,
            "服务器内部错误",
        )
    if err.status_code == status.HTTP_401_UNAUTHORIZED:
        return _json(status.HTTP_401_UNAUTHORIZED, Unauthorized.code, str(err.detail))
    if err.status_code == status.HTTP_404_NOT_FOUND:
        return _json(
            status.HTTP_404_NOT_FOUND, _FrameworkErrorCode.NOT_FOUND, str(err.detail)
        )
    return _json(
        status.HTTP_400_BAD_REQUEST, _FrameworkErrorCode.HTTP_ERROR, str(err.detail)
    )


async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """未预期异常兜底：统一返回 500，不把内部报错细节暴露给调用方。"""
    return _json(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        _FrameworkErrorCode.INTERNAL_ERROR,
        "服务器内部错误",
    )


def install_error_handlers(app: FastAPI) -> None:
    """main.py 调用一次，装上四个处理器。"""
    app.add_exception_handler(ServiceError, service_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)
