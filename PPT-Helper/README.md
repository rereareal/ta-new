# PPT Helper

用 Markdown 写幻灯片，在浏览器里直接演示。零构建、零依赖，只需一个 HTML 文件和几个静态资源。

风格参考 [jyywiki](https://jyywiki.cn/)：纯白底色搭配顶部深蓝标题栏，灰阶排版，正文顶部对齐。画面默认按 16:9 等比缩放，也可切换为拉伸铺满。

## 开始

幻灯片默认放在 `decks/` 目录中，一份演示对应一个 `.md` 文件；如需放在其他目录，可通过 `--dir <目录>` 指定。

```bash
node server.js                      # 打开幻灯片选择页
node server.js 我的分享             # 直接打开 decks/我的分享.md，自动补全后缀
node server.js fastapi              # 名字无需写全，能唯一匹配即可
node server.js 我的分享 --no-open   # 启动服务但不自动打开浏览器
```

启动后会自动使用默认浏览器打开页面，支持 macOS、Windows 与 Linux。端口可通过 `--port` 或 `PORT` 环境变量调整，默认为 8000。

**没有 build 步骤。** `index.html`、`slides.js`、`slides.css` 与 `vendor/` 直接由 `server.js` 原样提供服务。改完 `.md` 或样式后刷新浏览器即可生效，按 `L` 可回到选择页。

如果不想启动本地服务器，也可以直接用浏览器打开 `index.html`，把 `.md` 文件拖入窗口。

### 让它像一条命令一样顺手

在 `~/.bashrc` 或 `~/.zshrc` 中添加别名：

```bash
alias ppt='node /path/to/PPT-Helper/server.js'
```

之后在任意目录执行 `ppt 我的分享` 即可开讲。`server.js` 自带可执行头，也可赋予执行权限后直接运行 `./server.js 我的分享`。

也可以将其配置为编辑器的快捷任务，例如在 VS Code 的 `.vscode/tasks.json` 中添加：

```json
{
  "version": "2.0.0",
  "tasks": [{
    "label": "预览幻灯片",
    "type": "shell",
    "command": "node ${workspaceFolder}/server.js ${fileBasenameNoExtension}",
    "problemMatcher": []
  }]
}
```

## 写多份幻灯片

```text
decks/
  操作系统.md
  组会分享.md
```

- 文件名即命令行中使用的名称，支持前缀匹配；页面标题默认取文件第一个 `# 标题`
- 浏览器选择页会列出全部讲稿，支持点击或按数字键 1–9 打开
- 也可直接在地址栏指定讲稿：`http://localhost:8000/?src=decks/组会分享.md`

## 语法说明

完整的 Markdown 语法、分页规则、章节目录与排版增强（卡片、分栏、时间线、图表、选项卡等）见 [SYNTAX.md](SYNTAX.md)。

## 播放

| 按键 | 作用 |
| --- | --- |
| `→` `↓` `空格` `PgDn` / 滚轮向下 | 下一页 |
| `←` `↑` `PgUp` / 滚轮向上 | 上一页 |
| `Home` / `End` | 首页 / 末页 |
| `F` | 全屏 |
| `O` | 缩略图概览，点击跳转 |
| `M` | 等比 / 拉伸 切换 |
| `D` | 深色 / 浅色 模式切换 |
| `T` | 目录面板，点击跳页 |
| `L` | 回到幻灯片选择页 |
| `Esc` | 退出全屏 / 目录 / 概览 |

右下角按钮或 `M` 键可在两种填充方式间切换：

- **等比**（默认）：按 16:9 缩放，屏幕比例不符时两侧留白，画面不变形
- **拉伸**：铺满整个窗口，画面会随窗口比例拉伸

选择会保存在浏览器的 `localStorage` 中，下次打开自动沿用。画面四周有淡色边界线与紫色底边，方便确认幻灯片范围。

滚轮采用「一次手势翻一页」机制：触控板单次滑动只翻一页，松手后可继续滑动翻页，连续快速滑动可连续跳页。底部快捷键提示在非全屏时常驻显示，全屏后自动隐藏。

移动端支持左右滑动翻页；地址栏中的 `#3` 表示第 3 页，可直接分享指定页链接。

## 改样式

- 配色与字号位于 `slides.css` 顶部的 CSS 变量中：标题栏颜色为 `--violet`，正文基准字号为 `.slide-body { --fs }`
- 依赖全部保存在本地 `vendor/` 目录中，包含 marked、highlight.js 与 KaTeX，断网也可完整使用

## 文件

```text
decks/         幻灯片内容，一份一个 .md
SYNTAX.md      Markdown 语法与排版说明
index.html     页面骨架
slides.css     版式
slides.js      分页、渲染、翻页与缩放
server.js      本地服务器、decks 列表接口与命令行入口
vendor/        marked 11 · highlight.js 11.9 · KaTeX 0.16 · mermaid 11
```
