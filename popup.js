const SEARCH_URL = "https://api.deepseek.com/v1/tools/search";
const FETCH_URL = "https://api.deepseek.com/v1/tools/fetch";

const $ = (id) => document.getElementById(id);
let state = { key: "", count: 8 };

function setStatus(text, isError) {
  const el = $("status");
  el.textContent = text;
  el.className = "status" + (isError ? " error" : "");
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function fmtDate(d) {
  if (!d) return "";
  const t = new Date(d);
  return isNaN(t.getTime()) ? "" : t.toLocaleDateString("zh-CN");
}

async function loadSettings() {
  const data = await chrome.storage.local.get(["dsKey", "dsCount"]);
  state.key = data.dsKey || "";
  state.count = data.dsCount || 8;
}

function ensureKey() {
  if (state.key) return true;
  setStatus("请先在「设置」中填入 DeepSeek API Key", true);
  $("settings").classList.add("show");
  $("cfgKey").focus();
  return false;
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
    if (resp.status === 401) throw new Error("API Key 无效（401），请在设置中检查");
    if (resp.status === 429) throw new Error("请求过于频繁（429），稍后重试");
    throw new Error("HTTP " + resp.status + "：" + text.slice(0, 160));
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function renderResults(query, data) {
  const items = Array.isArray(data.results) ? data.results : [];
  const box = $("results");
  if (!items.length) {
    box.innerHTML = '<div class="card"><div class="summary">没有找到结果。</div></div>';
    setStatus('"' + query + '" 无结果', false);
    return;
  }
  box.innerHTML = items.map((r) => {
    const metaParts = [
      r.site_name ? esc(r.site_name) : "",
      r.date ? fmtDate(r.date) : "",
      r.rerank_score !== undefined ? "相关度 " + Number(r.rerank_score).toFixed(2) : "",
    ].filter(Boolean);
    const summary = esc(r.summary || r.snippet || "").slice(0, 320);
    return '<div class="card">' +
      '<h3><a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.title || "(无标题)") + '</a></h3>' +
      '<div class="meta">' + metaParts.join(" · ") + '</div>' +
      '<div class="summary">' + summary + '</div>' +
      '<div class="actions">' +
      '<button class="link-btn" data-fetch="' + esc(r.url) + '">抓全文</button>' +
      '<a class="link-btn" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">打开网页</a>' +
      '</div></div>';
  }).join("");
  setStatus('"' + query + '" 返回 ' + items.length + " 条", false);
}

async function doSearch() {
  const q = $("q").value.trim();
  if (!q) { $("q").focus(); return; }
  if (!ensureKey()) return;
  const btn = $("searchBtn");
  btn.disabled = true;
  setStatus("搜索中…", false);
  $("results").innerHTML = "";
  try {
    const data = await callApi(SEARCH_URL, { query: q, count: state.count });
    renderResults(q, data);
  } catch (e) {
    setStatus(e.message, true);
  } finally {
    btn.disabled = false;
  }
}

async function doFetch(url, btn) {
  if (!ensureKey()) return;
  btn.disabled = true;
  btn.textContent = "抓取中…";
  try {
    const data = await callApi(FETCH_URL, { url });
    const content = String(data.content || data.markdown || "").replace(/\\([^a-zA-Z0-9])/g, "$1");
    const card = btn.closest(".card");
    let art = card.querySelector(".article");
    if (!art) {
      art = document.createElement("div");
      art.className = "article";
      card.appendChild(art);
    }
    art.textContent = (data.title ? data.title + "\n\n" : "") + (content || "(未返回正文)");
    btn.textContent = "重新抓取";
  } catch (e) {
    btn.textContent = "抓取失败";
    setStatus(e.message, true);
  } finally {
    btn.disabled = false;
  }
}

$("searchBtn").addEventListener("click", doSearch);
$("q").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
});
$("results").addEventListener("click", (e) => {
  const url = e.target.getAttribute("data-fetch");
  if (url) doFetch(url, e.target);
});
$("settingsBtn").addEventListener("click", () => {
  $("cfgKey").value = state.key;
  $("cfgCount").value = state.count;
  $("settings").classList.toggle("show");
});
$("cancelBtn").addEventListener("click", () => $("settings").classList.remove("show"));
$("saveBtn").addEventListener("click", async () => {
  const key = $("cfgKey").value.trim();
  if (!key) {
    setStatus("API Key 不能为空", true);
    return;
  }
  state.key = key;
  state.count = Math.min(50, Math.max(1, parseInt($("cfgCount").value, 10) || 8));
  await chrome.storage.local.set({ dsKey: state.key, dsCount: state.count });
  $("settings").classList.remove("show");
  setStatus("设置已保存", false);
});

loadSettings().then(() => {
  if (state.key) {
    setStatus("就绪，每次检索约 0.005 元", false);
  } else {
    setStatus("首次使用：点右上角「设置」填入 API Key", false);
  }
});
