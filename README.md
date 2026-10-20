# DeepSeek 搜索（Edge 扩展）

在 Microsoft Edge 工具栏点击图标输入关键词，回车后在**新标签页以完整结果页列出** DeepSeek 的网页搜索结果，形式接近常见搜索引擎。

> 本项目不内置任何 API Key。首次使用请在扩展设置中填入你自己的 DeepSeek API Key。

## 功能

- **工具栏搜索**：点击图标 → 输入关键词 → 回车，结果在新标签页整页展示
- **结果页**：标题、URL、摘要、站点、日期、相关度，关键词高亮，每页 10 条，底部分页
- **抓全文**：任意结果可调用 Fetch API 展开 Markdown 正文
- **检索语法**：`site:`、`-site:`、`lang:zh`、`after:2026`、`"精确短语"`
- **设置**：API Key、单次请求条数（10–50），保存在扩展本地存储
- 深色界面，结果页宽度自适应

## 安装

1. 下载本仓库（`Code` → `Download ZIP`）或 Releases 中的安装包，解压到任意目录
2. 在 Edge 地址栏打开 `edge://extensions`
3. 打开左下角「开发人员模式」
4. 点击「加载解压缩的扩展」，选择本目录（`manifest.json` 所在目录）
5. 点击工具栏的拼图图标，将「DeepSeek 搜索」固定到工具栏

## 配置

1. 在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 创建 API Key
2. 点击扩展图标 → 右上角「设置」→ 粘贴 Key → 保存
3. Key 仅保存在本机扩展存储（`chrome.storage.local`），不会上传到任何第三方

## 计费

| 接口 | 端点 | 计费 |
| --- | --- | --- |
| Search | `POST https://api.deepseek.com/v1/tools/search` | 5 元 / 1000 次成功请求 |
| Fetch | `POST https://api.deepseek.com/v1/tools/fetch` | 5 元 / 1000 次成功请求 |

单次约 0.005 元（一次搜索即一次请求，分页不额外计费），失败请求不计费。余额不足时接口返回 402，页面会提示充值地址。

## 文件结构

```
deepseek-search/
├── manifest.json     # Manifest V3 清单
├── popup.html        # 工具栏弹窗（搜索入口 + 设置）
├── popup.js          # 打开结果页、读写设置
├── search.html       # 结果页布局
├── search.js         # 结果页检索、渲染、分页、抓全文
├── icons/            # 16 / 48 / 128 图标
└── README.md
```

## 权限说明

| 权限 | 用途 |
| --- | --- |
| `storage` | 保存 API Key 与请求条数 |
| `host_permissions: https://api.deepseek.com/*` | 调用官方 Search / Fetch 接口 |

不申请页面读取权限，不注入内容脚本，不收集使用数据。

## 说明

- 本地加载的扩展在每次启动 Edge 时可能提示「关闭开发人员模式扩展」，选择保留即可
- 未上架 Edge 加载项商店，如需免提示安装需自行提交审核

## License

[MIT](LICENSE)
