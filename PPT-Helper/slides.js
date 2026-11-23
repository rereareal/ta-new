/* ==========================================================================
   slides.js —— 把 Markdown 拆成页、渲染、翻页
   无构建、无框架；marked / highlight.js / KaTeX 都是可选增强
   ========================================================================== */

const deck = document.getElementById('deck');
const pageno = document.getElementById('pageno');
const hud = document.getElementById('hud');
const fitToggle = document.getElementById('fit-toggle');
const themeToggle = document.getElementById('theme-toggle');

let slides = [];
let idx = 0;
let baseUrl = null;   // md 文件地址，用于解析相对图片路径

/* 填充方式：contain = 等比留白，stretch = 拉伸铺满 */
let pickerMode = false;

const FIT_KEY = 'slides-fit';
let fitMode = 'contain';
try {
  if (localStorage.getItem(FIT_KEY) === 'stretch') fitMode = 'stretch';
} catch { /* 隐私模式下 localStorage 可能不可用 */ }

/* 配色主题：light = 浅色，dark = 深色 */
const THEME_KEY = 'slides-theme';
let themeMode = 'light';
try {
  if (localStorage.getItem(THEME_KEY) === 'dark') themeMode = 'dark';
} catch { /* 隐私模式下 localStorage 可能不可用 */ }

function applyTheme() {
  document.documentElement.dataset.theme = themeMode;
  if (!themeToggle) return;
  const dark = themeMode === 'dark';
  themeToggle.textContent = dark ? '浅色' : '深色';
  themeToggle.title = dark
    ? '当前：深色模式，点击切回浅色（D）'
    : '当前：浅色模式，点击切换深色（D）';
}

function toggleTheme() {
  themeMode = themeMode === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(THEME_KEY, themeMode); } catch { /* 忽略 */ }
  applyTheme();
}

applyTheme();

/* ---------- Markdown → 页 ---------- */

/** 按独占一行的 --- 分页；代码块内部的 --- 不算分页符 */
function splitSlides(md) {
  const out = [];
  let cur = [];
  let inFence = false;
  let fenceChar = '';

  for (const line of md.split(/\r?\n/)) {
    const fence = line.match(/^\s*(```+|~~~+)/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceChar = fence[1][0];
      } else if (fence[1][0] === fenceChar) {
        inFence = false;
      }
      cur.push(line);
      continue;
    }
    if (!inFence && /^\s*---+\s*$/.test(line)) {
      out.push(cur.join('\n'));
      cur = [];
      continue;
    }
    cur.push(line);
  }
  out.push(cur.join('\n'));

  return out.filter(s => s.trim() !== '');
}

/* ---------- 渲染 ---------- */

function isCover(body) {
  const kids = [...body.children];
  if (!kids.length || kids[0].tagName !== 'H1') return false;
  return (
    kids.length <= 3 &&
    kids.every(n => ['H1', 'H2', 'P', 'BLOCKQUOTE'].includes(n.tagName))
  );
}

/* ---------- 扩展语法：::: cols / ::: note|tip|warn ---------- */

/** 把 ::: 容器展开成 HTML，再交给 marked。代码块内的 ::: 不算 */
function expandBlocks(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\s*(```+|~~~+)/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) { out.push(line); continue; }

    const open = line.match(/^:::\s*(cols|grid|cards|card|badges|timeline|bars|pie|donut|tabs|note|tip|warn|chapter|toc)(?:\s+(.*))?\s*$/);
    if (!open) { out.push(line); continue; }

    const kind = open[1];
    const arg = (open[2] || '').trim();

    // 找到配对的结束行（支持嵌套一层）
    let depth = 1;
    let j = i + 1;
    let fence = false;
    for (; j < lines.length; j++) {
      if (/^\s*(```+|~~~+)/.test(lines[j])) { fence = !fence; continue; }
      if (fence) continue;
      if (/^:::\s*$/.test(lines[j])) {
        depth--;
        if (depth === 0) break;
      } else if (/^:::\s*\S/.test(lines[j])) {
        depth++;
      }
    }

    const body = lines.slice(i + 1, j).join('\n');
    out.push(renderBlock(kind, arg, body));
    i = j;
  }

  return out.join('\n');
}

function renderBlock(kind, arg, body) {
  if (kind === 'toc') {
    // 目录内容要等所有页面都解析完才知道，先留一个占位
    const pages = /^pages$/i.test(arg) ? ' data-toc-pages' : '';
    return `<div class="toc" data-toc${pages}></div>`;
  }
  if (kind === 'chapter') {
    const title = arg ? marked.parseInline(arg) : '';
    const sub = body.trim() ? marked.parse(expandBlocks(body.trim())) : '';
    return (
      `<div class="chapter-divider">` +
        `<span class="chapter-num"></span>` +
        `<h2>${title}</h2>` +
        sub +
      `</div>`
    );
  }
  if (kind === 'cols' || kind === 'grid') {
    const style = arg ? ` style="grid-template-columns:${arg}"` : '';
    const inner = splitColumns(body)
      .map(c => `<div class="col">${marked.parse(expandBlocks(c.trim()))}</div>`)
      .join('');
    return `<div class="cols"${style}>${inner}</div>`;
  }
  if (kind === 'card') {
    const title = arg ? `<div class="card-title">${marked.parseInline(arg)}</div>` : '';
    return `<div class="card">${title}${marked.parse(expandBlocks(body.trim()))}</div>`;
  }
  if (kind === 'cards') {
    const cells = splitColumns(body).map(c => c.trim()).filter(Boolean);
    const cols = arg
      ? (/^\d+$/.test(arg) ? `repeat(${arg}, minmax(0, 1fr))` : arg)
      : `repeat(${cells.length || 2}, minmax(0, 1fr))`;
    const inner = cells
      .map(c => `<div class="card">${marked.parse(expandBlocks(c))}</div>`)
      .join('');
    return `<div class="cards" style="grid-template-columns:${cols}">${inner}</div>`;
  }
  if (kind === 'timeline') {
    return `<div class="timeline">${marked.parse(expandBlocks(body.trim()))}</div>`;
  }
  if (kind === 'badges') {
    return renderBadges(body);
  }
  if (kind === 'bars') {
    return renderBars(body, arg);
  }
  if (kind === 'pie' || kind === 'donut') {
    return renderPie(body, arg);
  }
  if (kind === 'tabs') {
    return renderTabs(body, arg);
  }
  return `<div class="callout ${kind}">${marked.parse(expandBlocks(body.trim()))}</div>`;
}

/** 按独占一行的 ||| 分栏；代码块里的 ||| 不算 */
function splitColumns(body) {
  const out = [];
  let cur = [];
  let fence = false;

  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```+|~~~+)/.test(line)) fence = !fence;
    if (!fence && /^\s*\|\|\|\s*$/.test(line)) {
      out.push(cur.join('\n'));
      cur = [];
      continue;
    }
    cur.push(line);
  }
  out.push(cur.join('\n'));
  return out;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/** 图表数据：每行「标签 | 数值」，数值可以是 40、40%、3.5h */
function parseChartRows(body) {
  const rows = [];
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(/^(.*?)[|｜]([^|｜]*)$/);
    if (!m) continue;

    const label = m[1].trim();
    const raw = m[2].trim();
    if (!label) continue;

    const num = parseFloat(raw.replace(/[^0-9.\-]/g, ''));
    rows.push({ label, raw, value: Number.isFinite(num) && num > 0 ? num : 0 });
  }
  return rows;
}

function chartTitle(arg) {
  return arg ? `<div class="chart-title">${marked.parseInline(arg)}</div>` : '';
}

function renderBars(body, arg) {
  const rows = parseChartRows(body);
  if (!rows.length) return `<p class="muted">图表需要「标签 | 数值」形式的行。</p>`;

  const max = Math.max(...rows.map(r => r.value), 1);
  const bars = rows.map(r => {
    const width = (r.value / max) * 100;
    return (
      `<div class="bar-row">` +
        `<span class="bar-label">${escapeHtml(r.label)}</span>` +
        `<span class="bar-track"><span class="bar-fill" style="width:${width.toFixed(1)}%"></span></span>` +
        `<span class="bar-value">${escapeHtml(r.raw)}</span>` +
      `</div>`
    );
  }).join('');

  return `<div class="chart bars">${chartTitle(arg)}${bars}</div>`;
}

function renderPie(body, arg) {
  const rows = parseChartRows(body).filter(r => r.value > 0);
  if (!rows.length) return `<p class="muted">图表需要「标签 | 数值」形式的行。</p>`;

  const total = rows.reduce((s, r) => s + r.value, 0);
  let acc = 0;
  const stops = [];
  rows.forEach((r, i) => {
    const start = acc;
    acc += (r.value / total) * 100;
    stops.push(`var(--chart-${(i % 6) + 1}) ${start.toFixed(2)}% ${acc.toFixed(2)}%`);
  });

  const legend = rows.map((r, i) => {
    const pct = Math.round((r.value / total) * 100);
    return (
      `<li>` +
        `<span class="swatch" style="background:var(--chart-${(i % 6) + 1})"></span>` +
        `<span class="legend-label">${escapeHtml(r.label)}</span>` +
        `<span class="legend-value">${pct}%</span>` +
      `</li>`
    );
  }).join('');

  return (
    `<div class="chart pie">${chartTitle(arg)}` +
      `<div class="pie-wrap">` +
        `<div class="pie-ring" style="background:conic-gradient(${stops.join(', ')})"></div>` +
        `<ul class="pie-legend">${legend}</ul>` +
      `</div>` +
    `</div>`
  );
}

function renderBadges(body) {
  const items = [];

  for (const line of body.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;

    const m = t.match(/^(ok|info|warn|bad)\s+(.+)$/i);
    const tone = m ? m[1].toLowerCase() : 'info';
    const label = m ? m[2].trim() : t;
    if (!label) continue;
    items.push(`<span class="badge ${tone}">${escapeHtml(label)}</span>`);
  }

  if (!items.length) return `<p class="muted">状态标签需要「ok / info / warn / bad + 文字」。</p>`;
  return `<div class="badges">${items.join('')}</div>`;
}

function renderTabs(body, arg) {
  const labels = arg ? arg.split(/[|｜]/).map(s => s.trim()) : [];
  const panes = splitColumns(body).map(c => c.trim()).filter(Boolean);

  const buttons = panes.map((_, i) =>
    `<button type="button" class="tab-btn${i === 0 ? ' active' : ''}" data-tab="${i}">${escapeHtml(labels[i] || `选项卡 ${i + 1}`)}</button>`
  ).join('');

  const contents = panes.map((p, i) =>
    `<div class="tab-pane${i === 0 ? ' active' : ''}" data-pane="${i}">${marked.parse(expandBlocks(p))}</div>`
  ).join('');

  return `<div class="tabs"><div class="tab-bar">${buttons}</div><div class="tab-body">${contents}</div></div>`;
}

/* ---------- mermaid：按需加载 ---------- */

let mermaidReady = null;

function loadMermaid() {
  if (mermaidReady) return mermaidReady;
  mermaidReady = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'vendor/mermaid/mermaid.min.js';
    s.onload = () => {
      try {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          fontFamily: getComputedStyle(document.body).fontFamily,
          themeVariables: {
            primaryColor: '#ffffff',
            primaryTextColor: '#1f2937',
            primaryBorderColor: '#e3ddf0',
            lineColor: '#b8b0cb',
            secondaryColor: '#fbfaff',
            tertiaryColor: '#ffffff',
            edgeLabelBackground: '#ffffff',
            clusterBkg: '#fbfaff',
            clusterBorder: '#e3ddf0',
            fontSize: '20px',
          },
          flowchart: {
            curve: 'basis',
            padding: 14,
            nodeSpacing: 52,
            rankSpacing: 62,
            useMaxWidth: true,
          },
        });
        resolve(window.mermaid);
      } catch (e) { reject(e); }
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return mermaidReady;
}

/** 把 ```mermaid 代码块换成真正的图表 */
async function renderMermaid(body) {
  const blocks = [...body.querySelectorAll('pre > code.language-mermaid')];
  if (!blocks.length) return false;

  let mermaid;
  try { mermaid = await loadMermaid(); } catch { return false; }

  for (const code of blocks) {
    const pre = code.parentElement;
    const graph = code.textContent;
    try {
      const { svg } = await mermaid.render('mmd-' + Math.random().toString(36).slice(2), graph);
      const box = document.createElement('div');
      box.className = 'diagram';
      box.innerHTML = svg;

      // 统一圆角，mermaid 默认的 5px 偏方
      box.querySelectorAll('.node rect, .node .label-container').forEach(r => {
        r.setAttribute('rx', '10');
        r.setAttribute('ry', '10');
      });
      pre.replaceWith(box);
    } catch (err) {
      pre.classList.add('diagram-error');
      pre.title = '图表语法错误：' + err.message;
    }
  }
  return true;
}

function enhance(body) {
  body.querySelectorAll('pre code').forEach(el => {
    try { window.hljs?.highlightElement(el); } catch { /* 高亮失败不影响显示 */ }
  });

  if (window.renderMathInElement) {
    try {
      renderMathInElement(body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
        ],
        throwOnError: false,
      });
    } catch { /* 公式失败就退回原文 */ }
  }
}

/** 超宽的一行代码折行显示，避免被裁掉 */
function wrapLongCode(body) {
  body.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code');
    if (!code || pre.classList.contains('diagram-error')) return;
    pre.classList.remove('wrap');
    if (code.scrollWidth > pre.clientWidth + 1) pre.classList.add('wrap');
  });
}

/** 内容超出一页时，整体缩小字号直到放得下（高度和宽度都要满足） */
function fit(section) {
  const body = section.querySelector('.slide-body');
  const MAX = 26;
  const MIN = 14;

  wrapLongCode(body);
  body.style.setProperty('--fs', MAX + 'px');

  let fs = MAX;
  while (fs > MIN) {
    const tooTall = body.scrollHeight > body.clientHeight + 1;
    const tooWide = body.scrollWidth > body.clientWidth + 1;
    if (!tooTall && !tooWide) break;
    fs -= 1;
    body.style.setProperty('--fs', fs + 'px');
    wrapLongCode(body);
  }
}

/** 把本页首个标题提到顶部 header，正文里不再重复 */
function addHeader(section, body, index, total) {
  const h = body.querySelector('h1, h2, h3');
  if (!h) return;

  const text = h.textContent.trim();
  h.remove();

  const head = document.createElement('header');
  head.className = 'slide-head';
  head.style.setProperty('--p', ((index + 1) / total) * 100 + '%');

  const box = document.createElement('div');
  box.className = 'head-text';

  // 章节名做成标题上方的小字，不占额外宽度
  if (section.dataset.chapterTitle) {
    const ch = document.createElement('span');
    ch.className = 'head-chapter';
    ch.textContent = section.dataset.chapterTitle;
    box.appendChild(ch);
  }

  const title = document.createElement('span');
  title.className = 'head-title';
  title.textContent = text;
  box.appendChild(title);

  const num = document.createElement('span');
  num.className = 'head-num';
  num.textContent = `${index + 1} / ${total}`;

  head.append(box, num);
  section.querySelector('.slide-inner').prepend(head);
}

/* ---------- 章节与目录 ---------- */

/** 本页首个标题的文字，用于目录 */
function pageTitle(section) {
  const h = section.querySelector('.slide-body h1, .slide-body h2, .slide-body h3');
  return h ? h.textContent.trim() : '';
}

/** 扫描全部页面，得出章节顺序以及每章下的页面 */
function collectOutline() {
  const chapters = [];
  const loose = [];
  let current = null;

  slides.forEach((section, i) => {
    const body = section.querySelector('.slide-body');
    const divider = body.querySelector('.chapter-divider');
    const standalone = divider && body.children.length === 1;

    if (standalone) {
      const heading = divider.querySelector('h2');
      const title = heading?.textContent.trim() || `第 ${chapters.length + 1} 章`;
      if (heading && !heading.textContent.trim()) heading.textContent = title;
      current = {
        title,
        index: i,
        num: String(chapters.length + 1).padStart(2, '0'),
        pages: [],
      };
      chapters.push(current);
      divider.querySelector('.chapter-num').textContent = current.num;
      section.classList.add('chapter');
      section.dataset.chapterTitle = title;
      section.dataset.chapterNum = current.num;
      return;
    }

    // 封面和目录页本身不进目录
    if (section.classList.contains('cover') || body.querySelector('[data-toc]')) return;

    const entry = { title: pageTitle(section), index: i };
    if (current) {
      current.pages.push(entry);
      section.dataset.chapterTitle = current.title;
      section.dataset.chapterNum = current.num;
    } else {
      loose.push(entry);
    }
  });

  return { chapters, loose };
}

/** 目录里的一行：序号 / 标题 / 引导点 / 页码 */
function tocAnchor(page) {
  const a = document.createElement('a');
  a.className = 'toc-row';
  a.href = '#' + page;
  a.dataset.goto = String(page);
  return a;
}

const pageLabel = i => String(i + 1).padStart(2, '0');

function fillOutline(container, outline, { pages = false } = {}) {
  container.innerHTML = '';

  const list = document.createElement('div');
  list.className = 'toc-list';

  // 没有章节时按页列出，相当于一份普通目录
  if (!outline.chapters.length) {
    if (!outline.loose.length) {
      container.appendChild(tocEmpty());
      return;
    }
    outline.loose.forEach(entry => {
      const row = tocAnchor(entry.index + 1);
      row.classList.add('flat');
      row.append(
        tocText('toc-title', entry.title || '（未命名）'),
        tocText('toc-dots'),
        tocText('toc-page', pageLabel(entry.index)),
      );
      list.appendChild(row);
    });
    container.appendChild(list);
    return;
  }

  outline.chapters.forEach(chapter => {
    const group = document.createElement('div');
    group.className = 'toc-group';

    const row = tocAnchor(chapter.index + 1);
    row.append(
      tocText('toc-num', chapter.num),
      tocText('toc-title', chapter.title || '（未命名）'),
      tocText('toc-dots'),
      tocText('toc-page', pageLabel(chapter.index)),
    );
    group.appendChild(row);

    // pages 模式下额外列出本章的每一页
    if (pages && chapter.pages.length) {
      const sub = document.createElement('div');
      sub.className = 'toc-sub-list';
      for (const p of chapter.pages) {
        const a = document.createElement('a');
        a.className = 'toc-sub';
        a.href = '#' + (p.index + 1);
        a.dataset.goto = String(p.index + 1);
        a.append(
          tocText('toc-sub-title', p.title || '（未命名）'),
          tocText('toc-sub-page', pageLabel(p.index)),
        );
        sub.appendChild(a);
      }
      group.appendChild(sub);
    }

    list.appendChild(group);
  });

  // 页内目录页面多的时候分两列，避免被裁掉；侧边面板保持单列可滚动
  const entryCount = outline.chapters.reduce(
    (n, c) => n + 1 + (pages ? c.pages.length : 0), 0,
  );
  if (pages && entryCount > 12 && container.classList.contains('toc')) {
    list.classList.add('two-col');
  }

  container.appendChild(list);
}

function tocText(className, text = '') {
  const el = document.createElement('span');
  el.className = className;
  el.textContent = text;
  return el;
}

function tocEmpty() {
  const empty = document.createElement('p');
  empty.className = 'muted';
  empty.textContent = '这份幻灯片还没有内容。';
  return empty;
}

/** 把每页里的 ::: toc 占位填成真目录 */
function fillTocs(outline) {
  deck.querySelectorAll('[data-toc]').forEach(box => {
    fillOutline(box, outline, { pages: box.hasAttribute('data-toc-pages') });
  });
}

/* ---------- 目录面板（T） ---------- */

const tocPanel = document.getElementById('toc-panel');
const tocBody = document.getElementById('toc-body');

function isTocOpen() {
  return !!tocPanel && !tocPanel.hidden;
}

function openToc() {
  if (!tocPanel || !slides.length) return;
  tocPanel.hidden = false;
  updateTocActive(true);
}

function closeToc() {
  if (tocPanel) tocPanel.hidden = true;
}

function toggleToc() {
  isTocOpen() ? closeToc() : openToc();
}

function updateTocActive(scroll = false) {
  if (!tocPanel || tocPanel.hidden) return;
  const current = String(idx + 1);
  let active = null;
  tocBody.querySelectorAll('a[data-goto]').forEach(a => {
    const on = a.dataset.goto === current;
    a.classList.toggle('active', on);
    if (on) active = a;
  });
  if (scroll && active) active.scrollIntoView?.({ block: 'center' });
}


function build(md, mdUrl = null) {
  baseUrl = mdUrl;
  closeToc();
  deck.innerHTML = '';
  slides = [];
  idx = 0;

  let parts;
  try {
    parts = splitSlides(md);
  } catch {
    parts = [md];
  }

  if (!parts.length) return;

  parts.forEach((src, i) => {
    const section = document.createElement('section');
    section.className = 'slide';
    section.dataset.page = String(i + 1);

    const inner = document.createElement('div');
    inner.className = 'slide-inner';

    const body = document.createElement('div');
    body.className = 'slide-body';
    try {
      body.innerHTML = marked.parse(expandBlocks(src));
    } catch (err) {
      body.textContent = src;
    }

    inner.appendChild(body);
    section.appendChild(inner);
    deck.appendChild(section);
    if (isCover(body)) section.classList.add('cover');
    slides.push(section);
  });

  const total = slides.length;

  // 先把章节和页面顺序扫一遍，目录、header 里的章节名都靠它
  const outline = collectOutline();
  fillTocs(outline);
  fillOutline(tocBody, outline, { pages: true });

  slides.forEach((section, i) => {
    const body = section.querySelector('.slide-body');
    if (!section.classList.contains('cover') && !section.classList.contains('chapter')) {
      addHeader(section, body, i, total);
    }

    // 相对路径的图片，按 md 文件所在位置解析
    if (baseUrl) {
      body.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src') || '';
        if (!src || /^(https?:|data:|blob:|\/)/i.test(src)) return;
        try { img.src = new URL(src, baseUrl).href; } catch { /* 保持原样 */ }
      });
    }

    enhance(body);
    fit(section);

    // 图片尺寸变化后重新排版
    body.querySelectorAll('img').forEach(img => {
      if (img.complete) return;
      const refit = () => fit(section);
      img.addEventListener('load', refit, { once: true });
      img.addEventListener('error', refit, { once: true });
    });
  });

  // 图表是异步渲染的，画完再重新排版一次
  renderAllDiagrams();

  const title = slides[0].querySelector('.head-title, h1')?.textContent?.trim();
  if (title) document.title = title;

  document.getElementById('error').hidden = true;
  picker.hidden = true;
  pickerMode = false;
  document.body.classList.remove('is-picker');
  document.getElementById('hud').style.display = '';
  fitToggle.style.display = '';
  document.getElementById('toc-toggle').style.display = '';
  document.getElementById('hint').style.display = '';

  const start = parseInt(location.hash.slice(1), 10);
  go(Number.isFinite(start) ? start - 1 : 0);
  rescale();
}

async function renderAllDiagrams() {
  for (const section of slides) {
    const changed = await renderMermaid(section.querySelector('.slide-body'));
    if (changed) fit(section);
  }
}

/* ---------- 导航 ---------- */

function go(i, push = true) {
  if (!slides.length) return;
  idx = Math.max(0, Math.min(slides.length - 1, i));

  slides.forEach((s, k) => s.classList.toggle('active', k === idx));

  pageno.textContent = `${idx + 1} / ${slides.length}`;
  // 封面和章节页没有 header，页码放在右下角；其余页面页码在 header 里
  const bare = slides[idx]?.classList.contains('cover') || slides[idx]?.classList.contains('chapter');
  hud.style.visibility = bare ? 'visible' : 'hidden';

  updateTocActive();

  if (push) history.replaceState(null, '', '#' + (idx + 1));
}

const next = () => go(idx + 1);
const prev = () => go(idx - 1);

/* ---------- 缩放 ---------- */

function rescale() {
  if (!deck) return;

  const sx = innerWidth / 1280;
  const sy = innerHeight / 720;

  deck.classList.toggle('is-stretch', fitMode === 'stretch');

  if (fitMode === 'stretch') {
    // 拉伸：铺满整个窗口，画面会变形
    deck.style.setProperty('--sx', String(sx));
    deck.style.setProperty('--sy', String(sy));
  } else {
    // 等比：按 16:9 取最大比例，两侧留白
    const s = Math.min(sx, sy);
    deck.style.setProperty('--sx', String(s));
    deck.style.setProperty('--sy', String(s));
  }
}

function toggleFit() {
  fitMode = fitMode === 'stretch' ? 'contain' : 'stretch';
  try { localStorage.setItem(FIT_KEY, fitMode); } catch { /* 忽略 */ }
  updateFitLabel();
  rescale();
  if (isOverview()) { /* 概览里不需要缩放 */ }
}

function updateFitLabel() {
  fitToggle.textContent = fitMode === 'stretch' ? '拉伸' : '等比';
  fitToggle.title = fitMode === 'stretch'
    ? '当前：拉伸铺满（画面会变形），点击切回等比'
    : '当前：等比留白，点击切换为拉伸铺满（M）';
}

/* ---------- 概览 ---------- */

function toggleOverview() {
  const on = document.body.classList.toggle('overview');
  if (on) {
    closeToc();
    const active = slides[idx];
    if (active) active.scrollIntoView?.({ block: 'nearest' });
  } else {
    rescale();
  }
}

function isOverview() {
  return document.body.classList.contains('overview');
}

/* ---------- 事件 ---------- */

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen?.();
  } else {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }
}

window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  if (e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    toggleTheme();
    return;
  }

  if (pickerMode) return;

  // 目录面板打开时只接受关闭快捷键，避免误翻页
  if (isTocOpen()) {
    if (e.key === 'Escape' || e.key === 't' || e.key === 'T') {
      e.preventDefault();
      closeToc();
    }
    return;
  }

  // 按钮自己处理回车 / 空格
  if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('.tab-btn')) return;

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
    case ' ':
    case 'Enter':
      e.preventDefault();
      if (isOverview()) return;
      next();
      break;

    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
    case 'Backspace':
      e.preventDefault();
      if (isOverview()) return;
      prev();
      break;

    case 'Home':
      go(0);
      break;

    case 'End':
      go(slides.length - 1);
      break;

    case 'f':
    case 'F':
      toggleFullscreen();
      break;

    case 'o':
    case 'O':
      toggleOverview();
      break;

    case 'm':
    case 'M':
      toggleFit();
      break;

    case 't':
    case 'T':
      e.preventDefault();
      toggleToc();
      break;

    case 'l':
    case 'L':
      location.href = location.pathname;   // 回到选择页
      break;

    case 'Escape':
      if (isTocOpen()) closeToc();
      else if (document.fullscreenElement) document.exitFullscreen?.();
      else if (isOverview()) toggleOverview();
      break;
  }
});

window.addEventListener('hashchange', () => {
  const n = parseInt(location.hash.slice(1), 10);
  if (Number.isFinite(n) && n - 1 !== idx) go(n - 1, false);
});

window.addEventListener('resize', () => {
  if (!isOverview()) rescale();
});

// 全屏切换时窗口尺寸不一定触发 resize，这里再算一次
document.addEventListener('fullscreenchange', rescale);

fitToggle.addEventListener('click', toggleFit);
themeToggle?.addEventListener('click', toggleTheme);

/* 目录面板 */
document.getElementById('toc-toggle')?.addEventListener('click', toggleToc);
document.getElementById('toc-close')?.addEventListener('click', closeToc);
tocPanel?.addEventListener('click', e => {
  if (e.target === tocPanel) closeToc();
});

/* 点击页内目录 / 目录面板里的条目跳页 */
document.addEventListener('click', e => {
  const link = e.target.closest('[data-goto]');
  if (!link) return;
  e.preventDefault();
  const n = parseInt(link.dataset.goto, 10);
  if (Number.isFinite(n)) go(n - 1);
  if (isTocOpen()) closeToc();
});

deck.addEventListener('click', e => {
  if (isOverview()) return;
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;

  const tabs = btn.closest('.tabs');
  if (!tabs) return;

  const index = btn.dataset.tab;
  tabs.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  tabs.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === index));

  const section = btn.closest('.slide');
  if (section) fit(section);
});

deck.addEventListener('click', e => {
  if (!isOverview()) return;
  const section = e.target.closest('.slide');
  if (!section) return;
  go(slides.indexOf(section));
  toggleOverview();
});

/* 触屏左右滑动 */
let touchX = 0;
let touchY = 0;
window.addEventListener('touchstart', e => {
  touchX = e.touches[0].clientX;
  touchY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  if (isOverview() || isTocOpen()) return;
  if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
  dx < 0 ? next() : prev();
}, { passive: true });

/* 滚轮翻页
   一次滚动手势只翻一页（触控板的惯性滚动会连发几十个事件），
   手势之间停顿超过 GESTURE_GAP 就视为新的一次，可以立刻继续翻。 */
const WHEEL_STEP = 40;      // 累计滚动量阈值
const GESTURE_GAP = 120;    // 超过这个间隔（ms）算另一次手势

let wheelAcc = 0;
let lastWheelAt = 0;
let flippedInGesture = false;

window.addEventListener('wheel', e => {
  if (isOverview()) return;   // 概览里正常滚动列表
  if (isTocOpen()) return;    // 目录面板里正常滚动条目
  if (e.ctrlKey) return;      // 触控板捏合缩放
  e.preventDefault();

  const now = performance.now();
  if (now - lastWheelAt > GESTURE_GAP) {
    wheelAcc = 0;
    flippedInGesture = false;
  }
  lastWheelAt = now;

  if (flippedInGesture) return;

  wheelAcc += e.deltaY;
  if (Math.abs(wheelAcc) < WHEEL_STEP) return;

  wheelAcc > 0 ? next() : prev();
  flippedInGesture = true;
}, { passive: false });

/* 把 .md 直接拖进窗口 */
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', async e => {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  build(await file.text(), null);
});

/* ---------- 启动 ---------- */

function openDeck(name) {
  location.search = '?src=' + encodeURIComponent('decks/' + name);
}

async function showPicker() {
  pickerMode = true;
  document.body.classList.add('is-picker');
  picker.hidden = false;
  closeToc();
  document.getElementById('hud').style.display = 'none';
  fitToggle.style.display = 'none';
  document.getElementById('toc-toggle').style.display = 'none';
  document.getElementById('hint').style.display = 'none';

  let decks = [];
  try {
    const res = await fetch('/api/decks', { cache: 'no-store' });
    decks = await res.json();
  } catch { /* 没有服务端就只显示提示 */ }

  if (!decks.length) {
    document.getElementById('picker-sub').textContent = 'decks/ 目录下还没有 .md 文件。';
    return;
  }

  document.getElementById('picker-sub').textContent =
    `共 ${decks.length} 份 · 点选或按数字键打开`;

  const list = document.getElementById('picker-list');
  decks.forEach((deck, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';

    const num = document.createElement('span');
    num.className = 'picker-num';
    num.textContent = i < 9 ? String(i + 1) : '';

    const title = document.createElement('span');
    title.className = 'picker-title';
    title.textContent = deck.title;

    const file = document.createElement('span');
    file.className = 'picker-file';
    file.textContent = deck.name;

    btn.append(num, title, file);
    btn.addEventListener('click', () => openDeck(deck.name));
    li.appendChild(btn);
    list.appendChild(li);
  });

  window.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9 && decks[n - 1]) openDeck(decks[n - 1].name);
  });
}

async function boot() {
  const src = new URLSearchParams(location.search).get('src');

  if (!src) {
    showPicker();
    return;
  }

  try {
    const res = await fetch(src, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    build(await res.text(), new URL(src, location.href).href);
  } catch (err) {
    document.getElementById('error-msg').textContent =
      `无法加载 ${src}（${err.message}）。` +
      '如果你直接双击打开了本地 html 文件，请改用本地服务器启动，见 README。';
    document.getElementById('error').hidden = false;
    pageno.textContent = '';
  }

  updateFitLabel();
  rescale();
}

boot();
