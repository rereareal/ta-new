# ta-webui

教学智能体前端应用，基于 Vue 3、TypeScript 与 Tailwind CSS 构建，内置可离线体验的演示模式。

```bash
pnpm install
pnpm dev        # 默认监听 http://localhost:5173，/api 代理到 127.0.0.1:8000
```

## 页面

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 智能家教 | 对话主入口，支持课程与单元上下文、录音及朗读 |
| `/knowledge` | 知识库 | 课程列表 |
| `/knowledge/:courseId` | 课程结构 | 知识树、单元 Markdown、先修关系与引用资源 |
| `/progress` | 学情诊断 | 课程进度、单元状态与专项诊断 |
| `/admin` | 管理控制台 | 服务状态与管理入口 |
| `/admin/resources` | 资源库 | 资料上传、解析状态与切片详情 |
| `/admin/agent` | 智能体 | 工具与提示词版本管理 |
| `/login` | 登录 / 注册 | 接入 FastAPI 认证，首个注册用户成为管理员 |
| `/system` | 系统状态 | `/health` 与 `/ready` 状态探针 |

## 技术栈

- Vue 3 + TypeScript + Vue Router + Pinia
- Tailwind CSS，本地构建，不依赖外部 CDN
- markdown-it + DOMPurify

## 目录结构

```text
src/
├── main.ts / App.vue      应用入口与 401 全局失效处理
├── assets/styles.css      Tailwind 入口、Markdown 与 Toast 过渡样式
├── router/index.ts        路由表与登录、管理员权限守卫
├── config.ts              统一导出 apiBaseUrl 与 demoMode 开关
├── types/                 最底层领域模型、ApiError 与 FieldError
├── api/                   唯一 HTTP 请求层，统一超时、Bearer Token、401 与取消控制
├── utils/                 纯函数工具层，仅依赖 types/
├── stores/                Pinia 状态管理与登出重置
├── composables/           浏览器语音能力适配：useRecorder 与 useTts
├── demo/                  演示数据与内存导师会话，仅由 api 层在演示模式下动态导入
├── components/            按 layout、ui、chat、knowledge、progress 拆分的组件
└── views/                 对话、知识库、学情、管理、登录、系统与 404 页面
```

## 依赖方向

单向依赖，上层依赖下层，同层之间不互相引用：

```text
views ─┐
       ├─→ stores ─┐
components ─┘      ├─→ api ──(dynamic)─→ demo（演示分支）
       └─→ composables ─┘
                            ↓
               utils ───→ types（叶子层，无外部依赖）
```

- **`types/` 是最底层**：存放领域模型与 `ApiError`，不依赖任何内部模块。
- **`utils/` 是纯函数叶子**：只允许依赖 `types/`，不导入 `api/`、`stores/` 或组件。
- **`views/` 不直接调用业务 API**，也不导入 `demo/`，只读取 store 与配置。
- **`components/ui/` 是无业务耦合的通用组件**；布局壳与状态轮询组件放在 `components/layout/`。
- **`api/` 是唯一的请求出口**：`demo/` 通过动态 `import("@/demo/...")` 隔离在此，关闭演示后生产包不会打入演示数据。

## 认证与演示

- 除 `/login` 外，所有页面均通过路由守卫要求先登录，未登录会跳转到 `/login?next=...`。
- 真实登录与注册调用 `/api/auth/login` 与 `/api/auth/register`，会话保存在 `localStorage` 的 `ta.session` 中。
- 开发环境 `demoMode` 默认开启，课程、进度、资源、工具和导师回复来自 `src/demo/`，认证仍走真实 FastAPI。
- 第一个注册用户自动成为管理员，后续注册用户为学习者。
- 关闭演示模式：在 `.env.local` 中设置 `VITE_DEMO_MODE=false`，并确保后端服务运行在 `8000` 端口。
- 管理员页面按 `session.isAdmin` 控制，路由通过 `meta.requiresAdmin` 守卫，后端尚未校验角色。

## 对话与语音

- 对话使用 `/api/agent/sessions` 与 `/api/agent/sessions/{id}/messages`。
- 录音通过 `MediaRecorder` 请求 `/api/speech/stt`，演示模式使用浏览器 `SpeechRecognition`。
- 朗读请求 `/api/speech/tts` 获取音频，演示模式使用 `speechSynthesis`。
- 消息始终显示文字，语音作为增强能力；后端语音接口尚未实现时，界面会展示真实错误提示。

## 命令

```bash
pnpm dev          # 启动开发服务器，默认端口 5173
pnpm build        # 类型检查并构建生产包到 dist/
pnpm typecheck    # 运行 vue-tsc 类型检查
pnpm check        # 格式 + Lint + 类型检查
pnpm test         # 运行单元测试
pnpm lint         # 代码 Lint 检查
pnpm format       # Oxfmt 自动格式化
```
