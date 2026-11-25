# PPT Helper

用 Markdown 写幻灯片，在浏览器里放着讲。零构建、零依赖，素材是一个 HTML 文件加几个静态资源。

风格参考 [jyywiki](https://jyywiki.cn/)：纯白底色 + 顶部紫色标题栏，灰阶排版，正文顶部对齐。画面按 16:9 等比缩放，也可以切成拉伸铺满。

## 开始

幻灯片默认放在 `decks/` 里，一个 `.md` 一份；想放在其他目录，可以用 `--dir <目录>` 指定。

```bash
npm start                   # 等价于 node server.js，打开选择页
node server.js 我的分享      # 直接打开 decks/我的分享.md（自动补 .md）
node server.js fastapi      # 名字不用写全，能唯一匹配就行
node server.js 我的分享 --no-open   # 不自动开浏览器
```

启动后会顺手用默认浏览器打开页面（macOS / Windows / Linux 都支持）。端口用 `--port` 或 `PORT` 环境变量改，默认 8000。

**没有 build 步骤。** 这个项目是零构建的：`index.html` + `slides.js` + `slides.css` + `vendor/` 直接由 `server.js` 原样发出。改完 `.md` 或样式刷新浏览器就生效，不需要打包、编译或迁移数据库。

编辑 `.md` 后刷新浏览器即可。想回到选择页，按 `L`。

不想开服务器也可以：直接用浏览器打开 `index.html`，把 `.md` 文件拖进窗口。

### 让它像一条命令一样顺手

在 `~/.bashrc` / `~/.zshrc` 里加个别名：

```bash
alias ppt='node /path/to/PPT-Helper/server.js'
```

之后在任何目录敲 `ppt 我的分享` 就能开讲。`server.js` 自带可执行头，也可以 `chmod +x server.js` 后 `./server.js 我的分享`，或者 `npm link` 一次，之后直接用 `ppt`。

想更省事，也可以把它绑成编辑器的快捷键（例如 VS Code 的 `.vscode/tasks.json`）：

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

```
decks/
  操作系统.md
  组会分享.md
```

- 文件名就是命令行里用的名字（支持前缀匹配，不用写全），标题默认取文件第一个 `# 标题`
- 浏览器里的选择页会列出全部，点选或按数字键 1–9 打开
- 也可以直接改地址栏：`http://localhost:8000/?src=decks/组会分享.md`

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

右下角的按钮（或按 `M`）可以在两种填充方式间切换：

- **等比**（默认）：按 16:9 缩放，屏幕比例不符时两侧留白，画面不变形
- **拉伸**：铺满整个窗口，画面会被拉长或压扁

选择会记在浏览器的 localStorage 里，下次打开沿用。画面四周有一圈很淡的边界线，底边是一条紫色线，方便看清幻灯片范围。

滚轮是「一次手势翻一页」：触控板一划只会翻一页，松手后再滑可以立刻继续翻，连续快速滑动就能连续跳页。

底部的快捷键提示在非全屏时常驻显示，全屏后自动隐藏。

手机上可以左右滑动翻页。地址栏的 `#3` 表示第 3 页，可以直接分享某一页的链接。

## 改样式

- 配色和字号：`slides.css` 顶部的 CSS 变量；标题栏颜色是 `--violet`（默认 `#191970`），正文基准字号是 `.slide-body { --fs }`
- 依赖全部在本地：`vendor/` 里是 marked、highlight.js 和 KaTeX（含字体），断网也能完整使用

## 文件

```
decks/         幻灯片内容，一份一个 .md ← 主要改这里
SYNTAX.md      Markdown 语法与排版说明
index.html     页面骨架
slides.css     版式
slides.js      分页、渲染、翻页、缩放
server.js      本地服务器 + decks 列表接口 + 命令行启动（也是 bin，支持 --dir）
vendor/        marked 11 · highlight.js 11.9 · KaTeX 0.16 · mermaid 11
```
