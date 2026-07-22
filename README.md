# Soul Gallery · 灵魂画廊

> Discover the masterpiece that reflects your soul.

Soul Gallery 是一场以世界名画为结果的人格体验。访客回答 32 道选择题，系统依据八条等权人格光谱，在 108 幅公开画作和 6 幅隐藏画作中，寻找与其感知方式最接近的作品。

## 体验内容

- 古典而现代的中英双语视觉体验
- 带访客姓名的 Soul Gallery 电子门票
- 可下载的 1536 × 1024 高清 PNG 电子票
- 32 道选择题
- 八项等权人格光谱
- 108 幅公开画作与 6 幅隐藏画作
- 主画、三幅相邻画作与完整人格解读
- 保持原作宽高比的首页拼贴、馆藏与结果展示
- 馆藏按画面比例相邻排列；进入时先展示 8 幅，可展开全部 108 幅公开馆藏
- 展开前不会加载其余 100 幅图片；回到顶部后恢复 8 幅预览
- 首页统一的入馆须知与策展人手记
- 可携带访客姓名的结果分享链接
- 桌面、平板与手机响应式布局
- Wikimedia Commons 精确文件在线载入

## 品牌素材

```text
assets/branding/
├── soul-gallery-emblem.png
└── soul-gallery-ticket-template.png
```

导航栏使用透明馆徽图片。门票页使用完整英文门票模板，通过浏览器原生 Canvas API 将姓名与随机票号写入预览，并可下载为高清 PNG。

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

评分方法：

- 每条光谱由 4 道题构成，共 32 道题
- 每题四个有序选项，按选项顺序计为 0、33.33、66.67、100
- 同维度四题等权平均，得到该维 0–100 的位置
- 八个维度之间等权，不记录答题时间
- 使用八维 RMSE 比较访客轮廓与画作轮廓
- 光谱相似度 = 100 − RMSE
- 相同答案始终得到相同结果

Soul Gallery 参考多维特质测量与四级有序选择的结构，仅供娱乐与自我观察。它不是标准化心理量表，也不用于心理诊断。

## 首页动态

首页入口采用 CSS 与原生 JavaScript 生成的克制光影：

- CSS 生成的天窗光与窗框淡影
- 内嵌 SVG 树影
- 画作暖色聚光与边框掠光
- 指针柔光与多层视差
- 缓慢纸张纹理与少量空气尘埃
- 尊重 `prefers-reduced-motion`
- 不使用外部背景素材或第三方动画库

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
│   ├── scoring.js
│   └── ambient.js
├── assets/
│   ├── branding/
│   │   ├── soul-gallery-emblem.png
│   │   └── soul-gallery-ticket-template.png
│   └── favicon.svg
├── scripts/
│   ├── audit-commons.mjs
│   ├── audit-i18n.mjs
│   ├── audit-scoring.mjs
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
node scripts/audit-commons.mjs
node scripts/audit-i18n.mjs
node scripts/audit-scoring.mjs
node scripts/audit-results.mjs
```

这些脚本分别检查画作文件、双语完整性、八维评分确定性与结果可达性。

## Render 部署

本项目是纯静态网站，可在 Render 中部署为 Static Site。

- Build Command: `echo "Soul Gallery is ready"`
- Publish Directory: `.`
- Branch: `main`

仓库中的 `render.yaml` 也可用于 Render Blueprint 部署。

## License

Website code is released under the MIT License. Artwork images are not covered by the software license; refer to each Wikimedia Commons source page for its rights status.
