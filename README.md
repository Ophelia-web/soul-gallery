# Soul Gallery · 灵魂画廊

> Discover the masterpiece that reflects your soul.

Soul Gallery 是一场以世界名画为结果的人格体验。访客回答 32 个来自日常生活的选择题，系统结合八条人格光谱与低权重的思考节奏，在 108 幅公开画作和 6 幅隐藏画作中，寻找与其感知方式最接近的作品。

## 体验内容

- 古典而现代的中英双语视觉体验
- 带访客姓名的 Soul Gallery 电子门票
- 32 道日常选择题
- 八项人格光谱与一项思考节奏
- 108 幅公开画作与 6 幅隐藏画作
- 主画、三幅相邻画作与完整人格解读
- 保持原作宽高比的首页拼贴、馆藏与结果展示
- 馆藏按画面比例相邻排列
- 可携带访客姓名的结果分享链接
- 桌面、平板与手机响应式布局
- Wikimedia Commons 精确文件在线载入

## 测试如何运作

题目覆盖以下八条人格光谱：

1. 向内感
2. 秩序感
3. 情绪浓度
4. 理想倾向
5. 连接方式
6. 新鲜偏好
7. 行动力度
8. 内在明度

系统还会记录每道题在页面可见状态下的思考时间，并将其汇总为低权重的“思考节奏”。页面不显示计时器，切换到其他标签页的时间不计入结果。

每幅画拥有独立的人格轮廓。最终结果来自整体距离，而不是由某一道题直接决定。

## 图像来源

每幅作品在 `data/artworks.js` 中绑定一个经过核验的 Wikimedia Commons `commonsFile`。页面通过 Commons API 的 `titles` 参数读取该精确文件，不进行模糊搜索，也不会自动采用搜索结果中的其他图片。

网站在 `data/artwork-ratios.js` 中保存每幅作品经核验的原始宽高比。首页拼贴、馆藏和结果页都以真实比例显示画作；馆藏根据宽高比排序，使相近比例的画作尽量出现在相邻位置。图片在线载入，不存入仓库。

## 项目结构

```text
soul-gallery/
├── index.html
├── app.js
├── styles.css
├── data/
│   ├── artworks.js
│   ├── artwork-ratios.js
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
│   ├── audit-results.mjs
│   └── build-artwork-ratios.mjs
├── IMAGE_AUDIT.md
├── render.yaml
├── site.webmanifest
├── LICENSE
└── README.md
```

## 本地运行

```bash
python3 -m http.server 8000
```

打开：

```text
http://localhost:8000
```

语言参数：

```text
?lang=zh
?lang=en
```

## 质量审计

```bash
node scripts/build-artwork-ratios.mjs
node scripts/audit-commons.mjs
node scripts/audit-i18n.mjs
node scripts/audit-results.mjs
```

这些脚本分别更新宽高比数据，并检查画作文件、双语完整性和结果可达性。

## Render 部署

本项目是纯静态网站，可在 Render 中部署为 Static Site。

- Build Command: `echo "Soul Gallery is ready"`
- Publish Directory: `.`
- Branch: `main`

仓库中的 `render.yaml` 也可用于 Render Blueprint 部署。

## License

Website code is released under the MIT License. Artwork images are not covered by the software license; refer to each Wikimedia Commons source page for its rights status.
