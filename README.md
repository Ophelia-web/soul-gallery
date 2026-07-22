# Soul Gallery · 灵魂画廊

> Discover the masterpiece that reflects your soul.

Soul Gallery 是一场以世界名画为结果的人格体验。用户回答 32 个关于日常选择的问题，系统根据八条人格光谱，在 48 幅公开馆藏和 6 幅隐藏画作中寻找最接近的结果。

## 当前版本

这是可直接部署的第一版 MVP，已包含：

- 古典但现代的响应式视觉系统
- 中文首页、观展须知与 32 道完整题库
- 八维人格光谱与距离匹配算法
- 48 幅公开画作 + 6 幅隐藏画作
- 每幅画的独立人格文案、阴影面与成长提示
- 结果页、相邻馆藏、博物馆信息与分享链接
- 两处隐藏彩蛋：连续点击 Logo 五次；结果页点击画框三次
- Wikimedia Commons 已核验精确文件在线载入与来源链接
- `scripts/audit-commons.mjs` 图像审计脚本
- Render Blueprint 配置

## 技术结构

项目使用原生 HTML、CSS 和 JavaScript ES Modules，不依赖前端框架，也不需要安装 npm 包。

```text
soul-gallery/
├── index.html
├── app.js
├── styles.css
├── data/
│   ├── artworks.js
│   └── questions.js
├── lib/
│   ├── commons.js
│   └── scoring.js
├── assets/
│   └── favicon.svg
├── scripts/
│   └── audit-commons.mjs
├── IMAGE_AUDIT.md
├── render.yaml
├── site.webmanifest
└── README.md
```

## 本地运行

ES Modules 不能直接通过 `file://` 完整运行，请在项目根目录启动一个本地静态服务器：

```bash
python -m http.server 8000
```

然后打开：

```text
http://localhost:8000
```

## 在 Render 部署

仓库已经包含 `render.yaml`。在 Render 中选择 **New → Blueprint** 并连接此仓库即可。

也可以手动创建 Static Site：

- Build Command: `echo "Soul Gallery is ready"`
- Publish Directory: `.`
- Branch: `main`

项目使用查询参数分享结果，例如：

```text
https://your-site.onrender.com/?result=starry-night
```

因此不依赖额外的 SPA Rewrite Rule。

## 图像策略

每幅作品在 `data/artworks.js` 中绑定精确的 Wikimedia Commons `commonsFile` 文件名。页面通过 Commons API 的 `titles` 参数请求该精确文件的缩略图，不进行自由文本搜索，也不采用搜索结果中的第一张图。

核验范围包括文件名、作者、作品名、分辨率与长宽比。可用以下命令重新检查全部资源：

```bash
node scripts/audit-commons.mjs
```

图片仍然在线加载，不会进入 GitHub 仓库。本轮核验结果见 `IMAGE_AUDIT.md`。

## 人格算法

题目覆盖八条光谱：

1. 向内感
2. 秩序感
3. 情绪浓度
4. 理想倾向
5. 连接方式
6. 新鲜偏好
7. 行动力度
8. 内在明度

每幅画都有一组八维人格轮廓。系统计算用户轮廓与画作轮廓的加权距离，并返回最接近的主画与三幅相邻馆藏。

六幅隐藏画作需要同时满足特定的极端或少见光谱区间，不能只靠单题触发。

## 下一阶段建议

- 生成适合小红书、朋友圈和 Instagram 的结果海报
- 加入中英双语切换
- 用真实用户测试数据校准题目与画作人格轮廓
- 增加匿名统计，观察结果分布和隐藏画作触发率
- 为每幅画增加历史背景与所在博物馆链接
- 持续用 `node scripts/audit-commons.mjs` 回归检查 Commons 文件可用性

## License

Website code is released under the MIT License. Artwork images are not covered by the software license; refer to each Wikimedia Commons source page for its rights status.
