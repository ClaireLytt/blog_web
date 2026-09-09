# Claire.dev — 个人双语博客

基于 [Astro 5](https://astro.build) 的中英双语静态博客，部署在 Netlify，通过 Decap CMS 在线发文。

**线上地址**：https://clairelyt.netlify.app

## 功能

- **中英双语**：文章分别放在 `src/content/blog/en/` 和 `src/content/blog/zh/`，同名文件（相同 slug）自动关联为互译版本，页面右上角可一键切换语言
- **在线写作（CMS）**：访问 `/admin` 进入 Decap CMS，可视化创建/编辑中英文文章、管理联系方式，保存即直接 commit 到 `main` 并自动部署
- **内容校验**：文章 frontmatter 由 Zod schema 严格校验（`title`、`description`、`pubDate` 必填，`tags` 可选），格式错误会在构建时直接报错
- **SEO**：自动生成 sitemap、RSS（中英各一份 `/rss.xml`、`/zh/rss.xml`）、canonical 与 hreflang 标签
- **代码高亮**：Shiki（github-light 主题）
- **零 JS 运行时**：纯静态输出，无客户端框架

## 使用

环境要求：Node.js 22（与 CI、Netlify 一致）。

```bash
npm install        # 安装依赖
npm run dev        # 本地开发，默认 http://localhost:4321
npm run build      # 构建到 dist/
npm run preview    # 本地预览构建产物
npm run check      # astro check 类型检查
```

### 写文章

**方式一：CMS（推荐）**
线上访问 `/admin`，选择 Blog (English) 或 博客（中文），填写 slug、标题、摘要、日期、正文后发布。中英文版本使用**相同的 slug** 即可自动关联。

**方式二：手写 Markdown**
在 `src/content/blog/en/` 或 `zh/` 下新建 `<slug>.md`：

```markdown
---
title: 文章标题
description: 一句话摘要
pubDate: 2026-09-09
tags: [astro, blog]
---

正文……
```

### 目录结构

```
src/
├── content/blog/{en,zh}/   # 文章（同名 = 互译）
├── content.config.ts       # 内容集合 schema
├── layouts/BaseLayout.astro# 全站布局（导航、语言切换、SEO 标签）
├── pages/                  # 路由（en 在根路径，zh 在 /zh 前缀下）
└── data/contacts.json      # 联系方式（可在 CMS 中编辑）
public/admin/               # Decap CMS 配置
.github/workflows/ci.yml    # CI
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

- **PR 是门禁**：检查不过无法安心合并；**push main 是报警**：CMS 直接发到 `main` 的文章如有问题，会在 GitHub Actions 中显示红叉
- 中英配对与外链检查的结果以 warning 注解形式出现在 Actions 运行页的 Summary 中

## 部署

Netlify 监听 `main` 分支，push 即自动构建部署（`npm run build` → 发布 `dist/`）。Node 版本已在 `netlify.toml` 中钉死为 22，与 CI 一致。
