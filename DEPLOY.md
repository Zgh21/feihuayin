# 部署到线上（GitHub Pages）

本项目是**纯静态站点**（无构建、无后端），可以直接托管在 GitHub Pages 上，并且因为 Pages 是 **HTTPS**，麦克风录音权限会比本地 `file://` 更稳定。

## 方式 A：GitHub Pages（推荐，永久免费）

### 1. 在 GitHub 建一个空仓库
打开 <https://github.com/new>：
- Repository name 随便起，例如 `feihuayin-demo`
- 选 **Public**
- **不要**勾选 "Add a README file"
- 点 Create repository

### 2. 在本目录推送代码
本目录已经初始化好 git 并提交过一次，你只需要绑定远程仓库再推送：

```bash
cd C:/Users/zgh21/feihuayin-demo
git remote add origin https://github.com/<你的用户名>/feihuayin-demo.git
git branch -M main
git push -u origin main
```

（第一次推送会让你登录 GitHub，按提示用浏览器授权即可。）

### 3. 打开 Pages
仓库页 → **Settings** → 左侧 **Pages**：
- Source 选 `Deploy from a branch`
- Branch 选 `main`，目录选 `/ (root)`
- 点 **Save**

### 4. 拿到在线链接
等 1–2 分钟，访问：

```
https://<你的用户名>.github.io/feihuayin-demo/
```

> 这个链接可以直接发微信、发群里、手机浏览器打开，麦克风录音在 HTTPS 下正常工作。

---

## 方式 B：拖拽即上线（最快，30 秒）

不想碰 git 就用这两个，把**整个 `feihuayin-demo` 文件夹**拖进网页即可，立刻拿到公开链接：

- <https://app.netlify.com/drop>
- <https://pages.cloudflare.com>（Cloudflare Pages → 直接上传）

---

## 方式 C：让我直接帮你推

我在当前环境里**没有安装 `gh` CLI、也没有你的 GitHub 凭据**，所以没法替你创建仓库/推送。两种办法可以让我代劳：

1. 你安装 GitHub CLI 并登录：`winget install GitHub.cli`，然后 `gh auth login`，之后叫我，我就能直接建仓库 + 推送 + 开 Pages；
2. 或者你先在网页上把空仓库建好，把仓库地址发我，我再执行后面的推送步骤。

---

## 部署后自检清单

| 检查项 | 线上（HTTPS）预期 |
| --- | --- |
| 打开首页 | 正常显示「飞花音」首页与快速开局卡片 |
| 按住录音 | 浏览器弹麦克风授权；允许后录到自己的声音，语音条标注「我的录音」 |
| 一起听 / 语音条 ▶ | 有版权片段的 25 首播放真实原唱 30s；其余显示「合成试听」 |
| 接歌时长 | 默认 30 秒，可在「我的 → 设置 → 接歌时长」改为 8/15/20/30 |
| NPC 接歌 | 每位 NPC 随机思考 3–5 秒后开口 |

## 文件说明（发布所需）

```
index.html     入口
styles.css     样式
app.js         逻辑
data.js        曲库 / 真实试听地址 / 题库
assets/        水墨背景板
.nojekyll      让 GitHub Pages 原样输出静态文件
```
