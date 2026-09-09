# Claire.dev — 个人双语博客

[English](./README.md) | **中文**

基于 [Astro 5](https://astro.build) 的中英双语静态博客：白底蓝色点缀、打字机动画、零客户端框架，部署在 Netlify，支持 Decap CMS 在线发文。

**线上地址**：https://clairelyt.netlify.app
（如果重命名 Netlify 站点，需同步更新 `astro.config.mjs` 里的 `site` 和 `public/robots.txt` 里的 Sitemap 行）

## 功能

- **纯静态站点**：快、安全、免费托管，无任何客户端框架
- **中英双语**：英文在根路径，中文在 `/zh`；文章分别放在 `src/content/blog/en/` 和 `zh/`，同名文件自动关联为互译版本，导航栏一键切换语言
- **在线写作（CMS）**：访问 `/admin` 进入 Decap CMS，可视化创建/编辑中英文文章、管理联系方式，保存即 commit 到 `main` 并自动部署
- **内容校验**：frontmatter 由 Zod schema 校验（`title`、`description`、`pubDate` 必填，`tags` 可选），格式错误在构建时直接报错
- **SEO**：自动生成 sitemap、RSS（`/rss.xml`、`/zh/rss.xml`）、Open Graph、canonical 与 hreflang 标签
- **代码高亮**：Shiki（github-light 主题），Astro 内置
- **自托管字体**：不走 Google Fonts CDN，国内访问无障碍
- **响应式设计**：尊重 reduced-motion 偏好；无跟踪、无评论、无广告

## 使用

环境要求：Node.js 22（与 CI、Netlify 一致）。

```bash
npm install        # 安装依赖
npm run dev        # 本地开发，http://localhost:4321
npm run build      # 构建到 dist/
npm run preview    # 本地预览构建产物
npm run check      # astro check 类型检查
```

### 发布新文章（无需改代码）

**方式一：CMS（推荐）**
线上访问 `/admin`，选择 Blog (English) 或 博客（中文），填写 slug、标题、摘要、日期、正文后发布。中英文版本使用**相同的 slug** 即可自动关联。

**方式二：手写 Markdown**
在 `src/content/blog/en/`（英文）或 `zh/`（中文）下新建 `my-new-post.md`，文件名即 URL（`/blog/my-new-post` 或 `/zh/blog/my-new-post`）：

```markdown
---
title: "My New Post"
description: "A one-line summary shown in the post list."
pubDate: 2026-09-08
tags: ["java", "opensource"]
---

正文（Markdown）……
```

然后提交推送（本地 `git push`，或直接在 GitHub 网页上 *Add file* → *Create new file*），Netlify 检测到推送后约 1 分钟自动重建上线。

### 更新联系方式（无需改代码）

在 CMS 的 Site Settings 中编辑，或直接改 `src/data/contacts.json`——每条包含 `label`（名称）、`value`（显示文字）、`url`（链接）：

```json
{
  "label": "GitHub",
  "value": "ClaireLytt",
  "url": "https://github.com/ClaireLytt"
}
```

中英文 About 页会同时更新。

### 目录结构

```
src/
├── content/blog/{en,zh}/    # 文章（同名 = 互译）
├── content.config.ts        # 内容集合 schema
├── layouts/BaseLayout.astro # 全站布局（导航、语言切换、SEO 标签）
├── pages/                   # 路由（en 在根路径，zh 在 /zh 前缀下）
└── data/contacts.json       # 联系方式（可在 CMS 中编辑）
public/admin/                # Decap CMS 配置
.github/workflows/ci.yml     # CI
```

## CI

每次 PR 到 `main`、以及每次 push 到 `main`（含 CMS 发文的提交）都会触发 [GitHub Actions](.github/workflows/ci.yml)：

| 检查 | 说明 | 是否阻断 |
|---|---|---|
| `astro check` | .astro/.ts 类型检查（strict 模式） | ✅ 阻断 |
| `astro build` | 构建；同时校验所有文章 frontmatter | ✅ 阻断 |
| 内链检查 | lychee 离线扫描 `dist/` 中的站内链接与资源引用，抓死链 | ✅ 阻断 |
| 中英配对检查 | 提示只有单语言版本的文章 | ⚠️ 仅警告 |
| 外链检查 | 检查文章中的外部链接是否可达（独立 job，网络误报不挡合并） | ⚠️ 非阻断 |

说明：

- **PR 是门禁**：检查不过不合并；**push main 是报警**：CMS 直接发到 `main` 的文章如有问题，会在 GitHub Actions 中显示红叉
- 中英配对与外链检查的结果以 warning 注解形式出现在 Actions 运行页的 Summary 中

## 部署（一次性设置）

1. 把仓库推到 GitHub（公开即可——只有你有 push 权限）
2. 用 GitHub 账号登录 [Netlify](https://app.netlify.com)
3. *Add new site* → *Import an existing project* → 选择本仓库
4. 构建配置自动从 `netlify.toml` 读取（Node 22、`npm run build` → 发布 `dist/`），点 *Deploy*
5. 站点上线在 `https://<random-name>.netlify.app`，可在 *Site settings → Site details → Change site name* 改名

此后每次 push `main` 都会自动构建部署。

## License

源代码基于 [MIT 协议](./LICENSE)开源；博客文章内容（`src/content/blog/`）**保留所有权利**，请勿未经许可转载。
