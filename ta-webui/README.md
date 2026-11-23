# ta-webui（Vue 3）

独立的前端工程：从 `ta` 仓库的 `apps/web/` 复制而来，Vue 3 + Vue Router + Pinia + Tailwind CSS，视觉基于 Stitch 导出的页面重新实现。

与原仓库的差别只在工程外壳：原来引用 `pnpm-workspace.yaml` 的 `catalog:` 版本现在写进 `package.json`，工具链配置（`fmt` / `lint`）合并进本目录的 `vite.config.ts`，其余源码保持一致。

```bash
pnpm install
pnpm dev        # http://localhost:5173，/api 代理到 127.0.0.1:8000
```

## 页面

| 路径                   | 页面        | 说明                                    |
| ---------------------- | ----------- | --------------------------------------- |
| `/`                    | 智能家教    | 对话主入口；课程/单元上下文、录音、朗读 |
| `/knowledge`           | 知识库      | 课程列表                                |
| `/knowledge/:courseId` | 课程结构    | 知识树、单元 Markdown、先修、引用资源   |
| `/progress`            | 学情诊断    | 课程进度、单元状态、专项诊断            |
| `/admin`               | 管理控制台  | 服务状态与入口                          |
| `/admin/resources`     | 资源库      | 上传、解析状态、切片详情                |
| `/admin/agent`         | 智能体      | 工具、提示词版本                        |
| `/login`               | 登录 / 注册 | FastAPI 认证；首个注册用户成为管理员    |
| `/system`              | 系统状态    | `/health`、`/ready`                     |

## 技术栈

- Vue 3 + TypeScript + Vue Router + Pinia
- Tailwind CSS（本地构建，不再用 CDN）
- markdown-it + DOMPurify
- 不再依赖 Element Plus

## 结构

```text
src/
├── main.ts / App.vue      # 应用入口、401 全局失效处理
├── assets/styles.css      # Tailwind 入口、Markdown、Toast 过渡样式
├── router/index.ts        # 路由与登录/管理员守卫
├── config.ts              # apiBaseUrl 与 demoMode 开关
├── types/                 # 叶子领域模型、ApiError / FieldError
├── api/                   # 唯一的 HTTP 层（client.ts 统一超时、Bearer、401、AbortSignal）
├── utils/                 # 纯函数叶子层（只依赖 types/）
│   ├── errors.ts          # 异常 → 一句可展示的中文
│   ├── labels.ts          # 领域状态 → { 文案, 语义色 }
│   ├── nav.ts             # 导航高亮判断
│   ├── status.ts          # 异步加载状态
│   └── tone.ts            # Tone 类型与徽标/圆点的 class
├── stores/                # session / chat / courses / progress / resources / agent / system / toast / reset
├── composables/           # useRecorder / useTts
├── demo/                  # 演示数据，仅由 api 层在 demoMode 下动态 import
│   ├── courses.ts / units.ts / progress.ts / resources.ts / agent.ts
│   └── tutor.ts           # 演示导师会话与回复
├── components/
│   ├── layout/            # AppShell / AppHeader / AdminNav / AppLogo / ApiStatus
│   ├── ui/                # AppIcon / AppModal / PageHeader / ToastHost
│   │                      # MarkdownContent / ErrorBanner / StatusBadge
│   ├── chat/              # ChatMessage / ChatComposer
│   ├── knowledge/         # KnowledgeTree
│   └── progress/          # MasteryRadar
└── views/                 # 对话、知识库、学情、管理、登录、系统、404
```

## 依赖方向

单向，上层依赖下层，同层之间不互相引用：

```text
views ─┐
       ├─→ stores ─┐
components ─┘      ├─→ api ──(dynamic)─→ demo（演示分支）
       └─→ composables ─┘
                            ↓
               utils ───→ types（叶子层，无外部依赖）
```

- **`types/` 是最底层**：领域模型与 `ApiError`，不依赖任何内部模块。
- **`utils/` 是纯函数叶子**：只允许依赖 `types/`，不 import `api/`、`stores/` 或组件。
- **`views/` 不直接调用业务 API**，也不导入 `demo/`，只读 store 与配置。
- **`components/ui/` 是无业务耦合通用件**；布局壳与状态轮询组件放在 `components/layout/`。
- **`api/` 是唯一的请求出口**，`demo/` 通过动态 `import("@/demo/...")` 隔离在此，关闭演示后生产包不会打入演示数据。

## 认证与演示

- 除 `/login` 外，所有页面都通过路由守卫要求先登录；未登录会跳转到 `/login?next=...`。
- 真实登录/注册调用 `/api/auth/login`、`/api/auth/register`，会话存 `localStorage` 的 `ta.session`（token / email / role）。
- 开发环境 `demoMode` 默认开启：课程、进度、资源、工具和导师回复来自 `src/demo/`；认证仍走真实 FastAPI。
- 第一个注册用户自动成为管理员，后续注册用户为学习者。
- 关闭演示：在 `.env.local` 设置 `VITE_DEMO_MODE=false`，并确保 API 在 `8000`。
- 管理员页面按 `session.isAdmin` 控制，路由用 `meta.requiresAdmin` 守卫；后端尚未校验角色。

## 对话与语音

- 对话使用 `/api/agent/sessions` 与 `/api/agent/sessions/{id}/messages`。
- 录音：`MediaRecorder` → `/api/speech/stt`；演示模式使用浏览器 `SpeechRecognition`。
- 朗读：`/api/speech/tts` → 音频 blob；演示模式使用 `speechSynthesis`。
- 消息始终显示文字，语音只是增强。后端语音接口尚未实现（当前 `404`），会显示真实错误。

## 命令

```bash
pnpm dev          # 开发服务器（5173）
pnpm build        # vue-tsc + 构建到 dist/
pnpm typecheck    # vue-tsc
pnpm check        # 格式 + Lint + Vite Plus 类型检查
pnpm test         # 运行单元测试
pnpm lint
pnpm format       # Oxfmt 写入
```
