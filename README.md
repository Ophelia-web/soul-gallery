# Soul Gallery · 灵魂画廊

> Discover the masterpiece that reflects your soul.

Soul Gallery 是一场以世界名画为结果的人格体验。用户回答 32 个关于日常选择的问题，系统根据八条人格光谱与隐藏的思考节奏，在 108 幅公开馆藏和 12 幅隐藏画作中寻找最接近的结果。

## 当前版本

- 古典但现代的响应式视觉系统（桌面 / 平板 / 手机）
- 完整中英双语界面、题库与 120 幅画作人格文案
- 32 道完整题库与更具体的情境说明
- 八维人格光谱 + 不显示在屏幕上的思考节奏
- 108 幅公开画作 + 12 幅隐藏画作
- 馆藏、结果与相邻作品完整显示原作比例（不裁切）
- Wikimedia Commons 已核验精确文件在线载入
- `scripts/audit-commons.mjs` / `audit-i18n.mjs` / `audit-results.mjs`
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
│   ├── questions.js
│   └── i18n.js
├── lib/
│   ├── commons.js
│   └── scoring.js
├── assets/
│   └── favicon.svg
├── scripts/
│   ├── audit-commons.mjs
│   ├── audit-i18n.mjs
│   └── audit-results.mjs
├── IMAGE_AUDIT.md
├── render.yaml
├── site.webmanifest
└── README.md
```

## 本地运行

```bash
python3 -m http.server 8000
```

打开 `http://localhost:8000`。可用 `?lang=en` / `?lang=zh` 切换语言；分享结果形如 `?result=starry-night&lang=zh`。

## 图像策略

每幅作品在 `data/artworks.js` 中绑定精确的 Wikimedia Commons `commonsFile` 文件名。页面通过 Commons API 的 `titles` 参数请求该精确文件的缩略图，不进行自由文本搜索。

馆藏目录、主结果与相邻作品使用原始宽高比完整显示（`object-fit: contain`）。首页拼贴可继续使用艺术化构图。

```bash
node scripts/audit-commons.mjs
node scripts/audit-i18n.mjs
node scripts/audit-results.mjs
```

图片仍然在线加载，不会进入 GitHub 仓库。本轮核验结果见 `IMAGE_AUDIT.md`。

## 人格算法

题目覆盖八条光谱，另有一条由答题可见时间推导的思考节奏（界面不显示计时器）：

1. 向内感
2. 秩序感
3. 情绪浓度
4. 理想倾向
5. 连接方式
6. 新鲜偏好
7. 行动力度
8. 内在明度
9. 思考节奏（低权重）

十二幅隐藏画作需要同时满足多项光谱区间，不能只靠单题触发。

## License

Website code is released under the MIT License. Artwork images are not covered by the software license; refer to each Wikimedia Commons source page for its rights status.
