const SEARCH_URL = "https://api.deepseek.com/v1/tools/search";
const FETCH_URL = "https://api.deepseek.com/v1/tools/fetch";
const PAGE_SIZE = 10;
let FETCH_COUNT = 30;

const $ = (id) => document.getElementById(id);
const state = { key: "", q: "", results: [], page: 1, elapsed: 0 };

function setStats(text, isError) {
  const el = $("stats");
  el.textContent = text;
  el.className = "stats" + (isError ? " error" : "");
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function termsFromQuery(q) {
  return q
    .replace(/\b(site|lang|after|before):\S+/gi, " ")
    .replace(/["]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^-/, ""))
    .filter((w) => w.length >= 1 && w.length <= 24);
}

function highlight(text, terms) {
  let html = esc(text);
  for (const t of terms) {
    const safe = esc(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp("(" + safe + ")", "gi"), "<mark>$1</mark>");
  }
  return html;
}

function fmtDate(d) {
  if (!d) return "";
  const t = new Date(d);
  return isNaN(t.getTime()) ? "" : t.toLocaleDateString("zh-CN");
}

async function callApi(url, body) {
  if (!state.key) throw new Error("未配置 API Key");
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + state.key,
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  if (!resp.ok) {
    if (resp.status === 402) throw new Error("账户余额不足（402），请到 platform.deepseek.com 充值");
    if (resp.status === 401) throw new Error("API Key 无效（401），请点击扩展图标在设置中更新");
    if (resp.status === 429) throw new Error("请求过于频繁（429），稍后重试");
    throw new Error("HTTP " + resp.status + "：" + text.slice(0, 200));
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function render() {
  const terms = termsFromQuery(state.q);
  const total = state.results.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  state.page = Math.min(Math.max(1, state.page), pages);
  const start = (state.page - 1) * PAGE_SIZE;
  const items = state.results.slice(start, start + PAGE_SIZE);

  $("results").innerHTML = items.map((r) => {
    const meta = [
      r.site_name ? esc(r.site_name) : "",
      r.date ? fmtDate(r.date) : "",
      r.rerank_score !== undefined ? "相关度 " + Number(r.rerank_score).toFixed(2) : "",
    ].filter(Boolean).join(" · ");
    const summary = r.summary || r.snippet || "";
    return '<div class="entry">' +
      '<h2><a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + highlight(r.title || "(无标题)", terms) + '</a></h2>' +
      '<div class="url">' + esc(r.url) + '</div>' +
      '<div class="snippet">' + highlight(summary, terms) + '</div>' +
      '<div class="entry-meta"><span>' + meta + '</span>' +
      '<button class="mini-btn" data-fetch="' + esc(r.url) + '">抓全文</button>' +
      '</div></div>';
  }).join("") || '<div class="empty">没有找到结果，试试减少限定词或更换关键词。</div>';

  const pager = $("pager");
  if (pages <= 1) {
    pager.innerHTML = "";
    return;
  }
  const nums = [];
  for (let p = 1; p <= pages; p++) {
    if (pages > 9 && p > 2 && p < pages - 1 && Math.abs(p - state.page) > 1) {
      if (nums[nums.length - 1] !== "...") nums.push("...");
      continue;
    }
    nums.push(p);
  }
  pager.innerHTML =
    '<button data-page="' + (state.page - 1) + '"' + (state.page === 1 ? " disabled" : "") + '>上一页</button>' +
    nums.map((n) => n === "..."
      ? '<button disabled>…</button>'
      : '<button data-page="' + n + '"' + (n === state.page ? ' class="active"' : "") + '>' + n + '</button>').join("") +
    '<button data-page="' + (state.page + 1) + '"' + (state.page === pages ? " disabled" : "") + '>下一页</button>';
}

async function doSearch(q) {
  const query = (q || "").trim();
  if (!query) { $("q").focus(); return; }
  state.q = query;
  state.page = 1;
  $("q").value = query;
  const url = new URL(location.href);
  url.searchParams.set("q", query);
  history.replaceState(null, "", url.toString());
  document.title = query + " - DeepSeek 搜索";

  if (!state.key) {
    setStats("尚未配置 API Key：请点击浏览器工具栏的扩展图标，在「设置」中填写后刷新本页", true);
    return;
  }

  const btn = $("searchBtn");
  btn.disabled = true;
  setStats("搜索中…", false);
  $("results").innerHTML = "";
  $("pager").innerHTML = "";
  const t0 = performance.now();
  try {
    const data = await callApi(SEARCH_URL, { query, count: FETCH_COUNT });
    state.results = Array.isArray(data.results) ? data.results : [];
    const sec = ((performance.now() - t0) / 1000).toFixed(2);
    setStats(state.results.length
      ? '找到 ' + state.results.length + ' 条结果（' + sec + ' 秒）'
      : '未找到与「' + query + '」相关的结果', false);
    render();
  } catch (e) {
    setStats(e.message, true);
  } finally {
    btn.disabled = false;
  }
}

async function doFetch(url, btn) {
  btn.disabled = true;
  btn.textContent = "抓取中…";
  try {
    const data = await callApi(FETCH_URL, { url });
    const content = String(data.content || data.markdown || "").replace(/\\([^a-zA-Z0-9])/g, "$1");
    const entry = btn.closest(".entry");
    let art = entry.querySelector(".article");
    if (!art) {
      art = document.createElement("div");
      art.className = "article";
      entry.appendChild(art);
    }
    art.textContent = (data.title ? data.title + "\n\n" : "") + (content || "(未返回正文)");
    btn.textContent = "重新抓取";
  } catch (e) {
    btn.textContent = "抓取失败";
    setStats(e.message, true);
  } finally {
    btn.disabled = false;
  }
}

$("searchBtn").addEventListener("click", () => doSearch($("q").value));
$("q").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch($("q").value);
});
$("results").addEventListener("click", (e) => {
  const url = e.target.getAttribute("data-fetch");
  if (url) doFetch(url, e.target);
});
$("pager").addEventListener("click", (e) => {
  const p = parseInt(e.target.getAttribute("data-page"), 10);
  if (!isNaN(p)) {
    state.page = p;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

(async function init() {
  const params = new URLSearchParams(location.search);
  state.q = params.get("q") || "";
  const c = parseInt(params.get("count"), 10);
  if (!isNaN(c)) FETCH_COUNT = Math.min(50, Math.max(10, c));
  $("q").value = state.q;
  const data = await chrome.storage.local.get(["dsKey"]);
  state.key = data.dsKey || "";
  if (state.q) {
    doSearch(state.q);
  } else {
    setStats("输入关键词开始搜索", false);
    $("q").focus();
  }
})();
