const $ = (id) => document.getElementById(id);
let state = { key: "", count: 30 };

async function loadSettings() {
  const data = await chrome.storage.local.get(["dsKey", "dsCount"]);
  state.key = data.dsKey || "";
  state.count = data.dsCount || 30;
  renderStatus();
}

function renderStatus() {
  const el = $("status");
  if (state.key) {
    el.textContent = "API Key 已配置，搜索将在新标签页打开结果页";
    el.className = "status";
  } else {
    el.textContent = "尚未配置 API Key，请先点右上角「设置」";
    el.className = "status warn";
  }
}

function openSearch() {
  const q = $("q").value.trim();
  if (!q) {
    $("q").focus();
    return;
  }
  if (!state.key) {
    $("settings").classList.add("show");
    $("cfgKey").focus();
    renderStatus();
    return;
  }
  const url =
    chrome.runtime.getURL("search.html") +
    "?q=" + encodeURIComponent(q) +
    "&count=" + state.count;
  chrome.tabs.create({ url });
  window.close();
}

$("searchBtn").addEventListener("click", openSearch);
$("q").addEventListener("keydown", (e) => {
  if (e.key === "Enter") openSearch();
});
$("settingsBtn").addEventListener("click", () => {
  $("cfgKey").value = state.key;
  $("cfgCount").value = state.count;
  $("settings").classList.toggle("show");
  if ($("settings").classList.contains("show")) $("cfgKey").focus();
});
$("cancelBtn").addEventListener("click", () => $("settings").classList.remove("show"));
$("saveBtn").addEventListener("click", async () => {
  const key = $("cfgKey").value.trim();
  if (!key) {
    $("status").textContent = "API Key 不能为空";
    $("status").className = "status warn";
    return;
  }
  state.key = key;
  state.count = Math.min(50, Math.max(10, parseInt($("cfgCount").value, 10) || 30));
  await chrome.storage.local.set({ dsKey: state.key, dsCount: state.count });
  $("settings").classList.remove("show");
  renderStatus();
});

loadSettings();
