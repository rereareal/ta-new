#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

// viewerRoot：页面、样式、脚本和 vendor 所在的目录（本仓库）
// deckRoot：幻灯片 .md 及配图所在的目录（默认本仓库的 decks/，可用 --dir 指到别处）
const viewerRoot = dirname(fileURLToPath(import.meta.url));

/* ---------- 命令行参数 ---------- */

const opts = {
  port: Number(process.env.PORT) || 8000,
  deckDir: null,
  deck: null,
  open: true,
};

const args = process.argv.slice(2);

for (let i = 0; i < args.length; i++) {
  const a = args[i];

  if (a === '--no-open') opts.open = false;
  else if (a === '--help' || a === '-h') opts.help = true;
  else if (a === '--port') opts.port = Number(args[++i]) || opts.port;
  else if (a.startsWith('--port=')) opts.port = Number(a.slice('--port='.length)) || opts.port;
  else if (a === '--dir' || a === '--decks') opts.deckDir = args[++i];
  else if (a.startsWith('--dir=')) opts.deckDir = a.slice('--dir='.length);
  else if (a.startsWith('--decks=')) opts.deckDir = a.slice('--decks='.length);
  else if (a.startsWith('-')) {
    console.error(`\n  不认识的参数：${a}（--help 查看用法）\n`);
    process.exit(1);
  } else opts.deck = a;
}

if (opts.help) {
  console.log(`
  用法：ppt [幻灯片名] [选项]

  幻灯片名   打开 decks/ 下的某一份（可省略 .md，支持前缀匹配）
  选项
    --dir <目录>   幻灯片目录，默认 ./decks（也可用 --decks）
    --port <端口>  监听端口，默认 8000（也可用环境变量 PORT）
    --no-open      不自动打开浏览器

  示例
    ppt                       # 列出目录里的所有幻灯片
    ppt 我的分享               # 直接打开某一份
    ppt --dir ./slides         # 指向别的目录
    ppt --dir ../PPT-Helper/decks  # 直接用另一份仓库里的幻灯片
`);
  process.exit(0);
}

const deckRoot = resolve(opts.deckDir ?? join(viewerRoot, 'decks'));

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

/* ---------- decks 目录 ---------- */

async function listDecks() {
  let files = [];
  try {
    files = (await readdir(deckRoot)).filter(f => f.endsWith('.md') && !f.startsWith('.'));
  } catch {
    return [];
  }

  const decks = [];
  for (const name of files.sort((a, b) => a.localeCompare(b, 'zh'))) {
    let title = name.replace(/\.md$/, '');
    try {
      const text = await readFile(join(deckRoot, name), 'utf8');
      const m = text.match(/^#\s+(.+)$/m);
      if (m) title = m[1].trim();
    } catch { /* 读不到就用文件名 */ }
    decks.push({ name, title });
  }
  return decks;
}

async function findDeck(arg) {
  const name = basename(arg.endsWith('.md') ? arg : arg + '.md');
  try {
    await stat(join(deckRoot, name));
    return { name };
  } catch { /* 继续尝试模糊匹配 */ }

  // 精确文件名没找到，按前缀 / 包含匹配
  const decks = await listDecks();
  const needle = name.replace(/\.md$/, '').toLowerCase();
  const matches = decks.filter(d => {
    const stem = d.name.replace(/\.md$/, '').toLowerCase();
    return stem.startsWith(needle) || stem.includes(needle);
  });

  if (matches.length === 1) return { name: matches[0].name };
  if (matches.length > 1) return { name: null, matches };
  return { name: null, matches: [] };
}

/* ---------- 静态文件 ---------- */

async function serveFile(res, base, path) {
  let rel = decodeURIComponent(path);
  if (rel.endsWith('/')) rel += 'index.html';

  const file = resolve(join(base, normalize(rel)));
  if (file !== base && !file.startsWith(base + sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  try {
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

/* ---------- 启动 ---------- */

let initial = null;

if (opts.deck) {
  const found = await findDeck(opts.deck);

  if (found.name) {
    initial = found.name;
  } else {
    if (found.matches?.length > 1) {
      console.error(`\n  「${opts.deck}」匹配到多份，说具体一点：\n`);
      for (const d of found.matches) console.error(`    ${d.name.replace(/\.md$/, '')}  ${d.title}`);
      console.error('');
    } else {
      console.error(`\n  找不到 ${join(deckRoot, opts.deck.endsWith('.md') ? opts.deck : opts.deck + '.md')}\n`);
      const decks = await listDecks();
      if (decks.length) {
        console.error('  可用的：');
        for (const d of decks) console.error(`    ${d.name.replace(/\.md$/, '')}  ${d.title}`);
        console.error('');
      } else {
        console.error(`  ${deckRoot} 下还没有 .md 文件。\n`);
      }
    }
    process.exit(1);
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (pathname === '/api/decks') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(await listDecks()));
    return;
  }

  // /decks/xxx.md 与 /decks/assets/xxx.png 都从幻灯片目录取
  if (pathname === '/decks' || pathname.startsWith('/decks/')) {
    await serveFile(res, deckRoot, pathname.slice('/decks'.length));
    return;
  }

  await serveFile(res, viewerRoot, pathname);
}).listen(opts.port, () => {
  const query = initial ? `?src=${encodeURIComponent('decks/' + initial)}` : '';
  const url = `http://localhost:${opts.port}/${query}`;

  console.log(`\n  Slides  →  ${url}\n`);
  console.log(`  幻灯片目录: ${deckRoot}\n`);
  if (initial) console.log(`  文件: ${join(deckRoot, initial)}\n`);

  if (opts.open) openBrowser(url);
});

function openBrowser(url) {
  const [cmd, cmdArgs] =
    process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
    : ['xdg-open', [url]];

  try {
    const child = spawn(cmd, cmdArgs, { stdio: 'ignore', detached: true });
    child.on('error', () => { /* 没有图形环境就忽略 */ });
    child.unref();
  } catch { /* 忽略 */ }
}
