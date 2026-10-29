# 🌌 Miao's Space

> A personal corner of the internet for writing, coding, anime, and books.

Miao's Space 是一个基于 [Astro](https://astro.build/) 和 [Fuwari](https://github.com/saicaca/fuwari) 构建的个人网站，用于记录技术学习、开发项目、生活随笔，以及收藏喜欢的动画和书籍。

项目在 Fuwari 原有博客功能的基础上，增加了动画收藏墙、小说书架和基于 PocketBase 的收藏管理后台。

![Astro](https://img.shields.io/badge/Astro-5-BC52EE?logo=astro)
![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![PocketBase](https://img.shields.io/badge/PocketBase-SQLite-B8DBE4)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

### 📝 Personal Blog

基于 Fuwari 的静态博客系统。

- 使用 Markdown 编写和管理文章
- 文章分类、标签与归档
- 文章目录（Table of Contents）
- Expressive Code 代码高亮
- 扩展 Markdown 语法
- Pagefind 静态全文搜索
- RSS 订阅
- 响应式页面布局
- 浅色、深色和跟随系统主题
- 平滑的页面过渡动画

文章由 Astro 在构建时生成静态 HTML，内容通过 Git 进行版本管理。

### 🎬 Anime Collection

独立的动画收藏页面，以海报墙形式展示个人动画收藏。

- 展示动画封面和标题
- 记录观看状态
- 记录个人评分和观看进度
- 区分公开与私人收藏
- 使用 Bangumi API 获取动画资料

支持的收藏状态包括：

| Status | Description |
|---|---|
| `wish` | 想看 |
| `in_progress` | 在看 |
| `completed` | 已看完 |
| `on_hold` | 搁置 |
| `dropped` | 弃番 |

### 📚 Book Collection

独立的书籍收藏页面，用于展示个人阅读记录。

- 展示书籍封面和标题
- 支持小说、轻小说及其他书籍
- 记录阅读状态
- 记录个人评分与阅读进度
- 支持个人短评
- 区分公开与私人收藏

动画与书籍共用同一套收藏数据结构，并通过作品类型进行区分。

### ⚙️ Collection Management

基于 PocketBase 构建的个人收藏管理后台。

**身份认证**

- 使用 PocketBase Auth Collection 进行登录
- 管理员身份认证
- 保持有效的登录状态
- 通过 API Rules 控制数据访问权限

**Bangumi 集成**

- 按动画或书籍类型搜索作品
- 显示搜索结果、封面和 Bangumi ID
- 自动获取作品标题、封面与简介
- 检查作品是否已存在于数据库

**收藏管理**

- 添加动画和书籍收藏
- 查看所有已有收藏
- 编辑收藏状态
- 修改个人评分
- 更新观看或阅读进度
- 添加和修改个人短评
- 设置公开或私人收藏
- 检测重复作品和重复收藏

当前收藏管理系统已经支持 Create、Read 和 Update 操作。

删除收藏、退出登录和更多管理功能仍在开发计划中。

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | Astro 5 |
| UI Components | Svelte 5 |
| Programming Language | TypeScript |
| Styling | Tailwind CSS |
| Blog Theme | Fuwari |
| Content Management | Markdown / Astro Content Collections |
| Backend | PocketBase |
| Database | SQLite |
| External Data | Bangumi API |
| Search Engine | Pagefind |
| Code Quality | Biome |
| Continuous Integration | GitHub Actions |
| Package Manager | pnpm |

### Architecture

Miao's Space 采用静态博客与动态收藏系统相结合的架构。

**博客部分**

- Markdown 文件保存在 Git 仓库
- Astro Content Collections 管理文章数据
- Astro 在构建阶段生成静态页面
- Pagefind 为静态内容建立搜索索引

**收藏部分**

- Astro 提供动画墙、小说书架和管理页面
- 浏览器通过 PocketBase API 读取公开收藏
- 管理后台使用 PocketBase SDK 进行认证和数据操作
- Bangumi API 提供动画与书籍的基础资料
- PocketBase 使用 SQLite 保存作品和收藏记录

```text
                 Miao's Space
                      |
              Astro + Svelte
                      |
         +------------+------------+
         |                         |
    Personal Blog             Collections
         |                         |
      Markdown              Anime / Books
         |                         |
  Astro Static Build          PocketBase API
         |                         |
      Pagefind                 SQLite Database
                                   |
                              Bangumi API
```

## 🏗️ Project Structure

```text
src/
├── assets/                     # Images and static assets
├── components/
│   ├── manage/
│   │   ├── LoginForm.astro
│   │   ├── BangumiSearch.astro
│   │   ├── CollectionForm.astro
│   │   └── CollectionManager.astro
│   └── ...                     # Fuwari components
│
├── content/
│   ├── posts/                  # Markdown blog posts
│   └── spec/                   # Site content
│
├── layouts/                    # Astro layouts
│
├── lib/
│   ├── bangumi.ts              # Bangumi API client
│   └── pocketbase.ts           # PocketBase SDK client
│
├── pages/
│   ├── anime.astro             # Anime collection wall
│   ├── books.astro             # Book collection shelf
│   ├── manage/
│   │   └── index.astro         # Management dashboard
│   └── ...                     # Blog pages
│
├── scripts/
│   ├── collection-wall.ts      # Public collection rendering
│   └── manage/
│       ├── auth.ts
│       ├── search.ts
│       ├── selected-work.ts
│       ├── collection-create.ts
│       ├── collection-list.ts
│       └── collection-edit.ts
│
├── styles/                     # Global styles
├── config.ts                   # Website configuration
└── ...
```

管理后台使用模块化结构，将身份认证、Bangumi 搜索、新增收藏、收藏列表和编辑功能分别维护，减少页面之间的耦合。

## 🚀 Getting Started

### Requirements

- Node.js 20+
- pnpm 9+
- 一个可访问的 PocketBase 实例（收藏功能需要）

### Installation

克隆项目：

```bash
git clone https://github.com/Rick-Miao/personal-blog.git
cd personal-blog
```

安装依赖：

```bash
pnpm install
```

启动本地开发服务器：

```bash
pnpm dev
```

访问：

```text
http://localhost:4321
```

### Configuration

网站基础配置位于：

```text
src/config.ts
```

可以在这里修改网站标题、导航栏、主题颜色及其他基本设置。

PocketBase 客户端配置位于：

```text
src/lib/pocketbase.ts
```

项目目前连接独立部署的 PocketBase 服务。

若需要使用自己的 PocketBase 实例，请修改 API 地址，并配置对应的数据集合和访问权限。

当前收藏系统主要使用两个 Base Collections：

- `works`：存储动画、书籍等作品的基础资料。
- `collections`：存储个人收藏状态、评分、进度、短评及公开设置。

管理身份通过 PocketBase 的 `users` Auth Collection 实现。

**注意：** 仅启动 Astro 开发服务器并不能自动创建 PocketBase 数据库。收藏页面和管理后台需要独立、可正常访问且配置正确的后端服务。

### Development

```bash
pnpm dev
```

### Production Build

```bash
pnpm build
```

构建完成后，静态网站文件位于：

```text
dist/
```

本地预览生产构建：

```bash
pnpm preview
```

## 📝 Writing Posts

博客文章保存在：

```text
src/content/posts/
```

可以手动创建 Markdown 文件，也可以使用 Fuwari 提供的文章创建脚本。

示例 Frontmatter：

```yaml
---
title: My First Blog Post
published: 2026-10-29
description: My first article on Miao's Space.
tags: [Development, Astro]
category: Technology
draft: false
---
```

其中：

| Field | Description |
|---|---|
| `title` | 文章标题 |
| `published` | 发布时间 |
| `description` | 文章描述 |
| `tags` | 文章标签 |
| `category` | 文章分类 |
| `draft` | 是否为草稿 |

文章内容使用 Markdown 编写，并在 Astro 构建时转换为静态页面。

## 🧪 Code Quality

项目使用 Biome、Astro Check 和 GitHub Actions 维护代码质量。

### Astro Type Check

```bash
pnpm exec astro check
```

### Biome

```bash
pnpm exec biome ci ./src
```

### Production Build

```bash
pnpm run build
```

GitHub Actions 会在代码推送或 Pull Request 时执行相应检查。

## 🔐 Security

收藏系统通过 PocketBase API Rules 实现访问控制。

- 匿名访问者仅能读取允许公开的收藏内容
- 私人收藏不对匿名访问者公开
- 管理操作需要经过身份认证
- 新增、编辑等操作由 PocketBase 服务端权限规则限制
- 管理员密码和认证 Token 不应提交到 Git 仓库
- 自行部署时需要配置自己的 PocketBase 用户和 API Rules

公开 GitHub 仓库并不意味着公开数据库中的私人收藏信息。

实际数据安全仍取决于 PocketBase 权限规则、部署配置和账号安全。

## 🗺️ Roadmap

### ✅ Completed

- [x] Personal blog based on Fuwari
- [x] Markdown articles and static site generation
- [x] Responsive website layout
- [x] Light and dark themes
- [x] Pagefind search integration
- [x] Anime collection wall
- [x] Book collection shelf
- [x] Bangumi API integration
- [x] PocketBase authentication
- [x] Collection creation
- [x] Collection listing and editing
- [x] Public and private collection visibility
- [x] Duplicate collection detection
- [x] Modular collection management architecture
- [x] GitHub Actions CI checks

### 🚧 Planned

**Collection Management**

- [ ] Collection deletion
- [ ] Logout and improved session management
- [ ] Cancel editing
- [ ] Automatically refresh collection list after creation
- [ ] Collection filtering and sorting
- [ ] Improved management dashboard

**Blog & Community**

- [ ] Article comment system
- [ ] Guest comments with nickname
- [ ] Comment moderation and approval
- [ ] Spam protection and rate limiting
- [ ] Comment notifications

**Website & Deployment**

- [ ] Automated deployment
- [ ] Production website launch
- [ ] Further performance optimization
- [ ] Mobile user experience improvements
- [ ] Documentation for self-hosted deployment

Roadmap 中的功能属于开发计划，具体实现方案和优先级可能随项目发展调整。

## 🙏 Acknowledgements

Miao's Space is based on [Fuwari](https://github.com/saicaca/fuwari), an open-source Astro blog template created by [saicaca](https://github.com/saicaca).

The original Fuwari project provides the foundation for the blog layout, styling, Markdown features, navigation, and other core functionality.

This project builds upon Fuwari with additional features, including an anime collection wall, a book collection shelf, Bangumi API integration, and a PocketBase-powered collection management system.

Special thanks to:

- [Fuwari](https://github.com/saicaca/fuwari) — Original blog template
- [Astro](https://astro.build/) — Web framework
- [Svelte](https://svelte.dev/) — Interactive UI components
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [PocketBase](https://pocketbase.io/) — Backend and database
- [Bangumi](https://bgm.tv/) — Anime and book information
- [Pagefind](https://pagefind.app/) — Static search engine
- [Biome](https://biomejs.dev/) — Code quality tools

## 📄 License

This project is based on Fuwari, originally created by saicaca and distributed under the MIT License.

The original copyright notices and license terms are retained in the [LICENSE](./LICENSE) file.

Modifications and additional functionality have been developed for Miao's Space.

---

Made with ☕ and curiosity.