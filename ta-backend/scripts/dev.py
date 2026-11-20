"""本地开发启动脚本（工具，不属于应用包）。

`uv run dev` 等价于 `uv run uvicorn main:app --host 127.0.0.1 --port 3000 --reload`。

放在 scripts/ 而不是 core/：应用运行时不 import 这个文件，它只是开发期的启动器，
不应该混进 core/ 那套「应用依赖的基础设施」里。

文档：uvicorn 部署与参数 https://www.uvicorn.org/deployment/
"""

import argparse

import uvicorn

# 开发服务器监听地址：8000 常被占用，这里约定用 3000。
DEV_HOST = "127.0.0.1"
DEV_PORT = 3000


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="dev",
        description="启动本地开发服务器（默认开启代码热重载）",
    )
    parser.add_argument("--host", default=DEV_HOST, help=f"监听地址，默认 {DEV_HOST}")
    parser.add_argument("--port", type=int, default=DEV_PORT, help=f"端口，默认 {DEV_PORT}")
    parser.add_argument("--no-reload", action="store_true", help="关闭代码热重载")
    args = parser.parse_args()

    uvicorn.run(
        "main:app",
        host=args.host,
        port=args.port,
        reload=not args.no_reload,
    )
