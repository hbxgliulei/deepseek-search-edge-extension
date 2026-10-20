# DeepSeek 搜索（Edge 扩展）

在 Microsoft Edge 工具栏直接调用 DeepSeek 网页搜索与抓取 API，点击图标弹出搜索框，无需跳转新标签页。

> 本项目不内置任何 API Key。首次使用请在扩展设置中填入你自己的 DeepSeek API Key。

## 功能

- 工具栏弹窗内直接检索，结果含标题、站点、日期与相关度
- 单条结果可「抓全文」，调用 Fetch API 在弹窗内展开 Markdown 正文
- 支持 DeepSeek 检索语法：`site:`、`-site:`、`lang:zh`、`after:2026`、`"精确短语"`
- 设置项：API Key、返回条数（1–50），保存在扩展本地存储
- 深色界面，弹窗尺寸 400px

## 安装

1. 下载本仓库（`Code` → `Download ZIP`）或 Releases 中的安装包，解压到任意目录
2. 在 Edge 地址栏打开 `edge://extensions`
3. 打开左下角「开发人员模式」
4. 点击「加载解压缩的扩展」，选择本目录（`manifest.json` 所在目录）
5. 点击工具栏的拼图图标，将「DeepSeek 搜索」固定到工具栏

## 配置

首次点击图标时，界面会提示填写 API Key：

1. 在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 创建 API Key
2. 点击弹窗右上角「设置」，粘贴 Key 并保存
3. Key 仅保存在本机扩展存储（`chrome.storage.local`），不会上传到任何第三方

## 计费

本扩展调用 DeepSeek 官方的 Search / Fetch 接口：

| 接口 | 端点 | 计费 |
| --- | --- | --- |
| Search | `POST https://api.deepseek.com/v1/tools/search` | 5 元 / 1000 次成功请求 |
| Fetch | `POST https://api.deepseek.com/v1/tools/fetch` | 5 元 / 1000 次成功请求 |

单次约 0.005 元，失败请求不计费。余额不足时接口返回 402，扩展会提示充值地址。

## 文件结构

```
deepseek-search/
├── manifest.json     # Manifest V3 清单
├── popup.html        # 弹窗界面
├── popup.js          # 检索 / 抓取 / 设置逻辑
├── icons/            # 16 / 48 / 128 图标
└── README.md
```

## 权限说明

| 权限 | 用途 |
| --- | --- |
| `storage` | 保存 API Key 与返回条数 |
| `host_permissions: https://api.deepseek.com/*` | 调用官方 Search / Fetch 接口 |

不申请任何页面读取权限，不注入内容脚本，不收集使用数据。

## 说明

- 本地加载的扩展在每次启动 Edge 时可能提示「关闭开发人员模式扩展」，选择保留即可
- 未上架 Edge 加载项商店，如需免提示安装需自行提交审核

## License

[MIT](LICENSE)
