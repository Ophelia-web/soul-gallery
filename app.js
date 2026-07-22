import { artworks, artworkById, DIMENSIONS, visibleArtworks, hiddenArtworks } from './data/artworks.js';
import { questions } from './data/questions.js';
import { getResult, profileForArtwork, strongestDimensions } from './lib/scoring.js';
import { hydrateArtworkImages } from './lib/commons.js';

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');

const state = {
  view: 'home',
  questionIndex: 0,
  answers: {},
  result: null,
  logoClicks: 0,
  frameClicks: 0,
};

const featuredIds = [
  'starry-night',
  'girl-pearl',
  'kiss-klimt',
  'great-wave',
  'birth-venus',
  'early-spring',
];

function artworkImageMarkup(artwork, { className = '', width = 1200, eager = false } = {}) {
  const palette = artwork.palette || ['#4f5c52', '#9a8062', '#d1ba92'];
  const commonsFile = artwork.commonsFile || '';

  return `
    <figure
      class="art-image ${className}"
      data-art-image
      data-file="${commonsFile.replaceAll('"', '&quot;')}"
      data-alt="${artwork.titleZh} · ${artwork.titleEn}"
      data-width="${width}"
      style="--art-a:${palette[0]};--art-b:${palette[1]};--art-c:${palette[2]}"
    >
      <div class="image-skeleton" aria-hidden="true"><span></span></div>
      <img
        ${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'}
        alt=""
        decoding="async"
      />
    </figure>
  `;
}

function shell(content, { minimal = false } = {}) {
  return `
    <div class="site-shell ${minimal ? 'site-shell--minimal' : ''}">
      <header class="site-header">
        <button class="brand" data-action="home" aria-label="返回首页">
          <span class="brand-mark" aria-hidden="true"><i></i></span>
          <span class="brand-copy">
            <strong>Soul Gallery</strong>
            <small>灵魂画廊</small>
          </span>
        </button>
        <nav class="header-nav" aria-label="主导航">
          <button data-action="collection">馆藏目录</button>
          <button data-action="about">观展须知</button>
        </nav>
      </header>
      <main>${content}</main>
      <footer class="site-footer">
        <div>
          <span>Soul Gallery · 灵魂画廊</span>
          <span>Discover the masterpiece that reflects your soul.</span>
        </div>
        <p>这是一场审美化的人格体验，不用于心理诊断。画作图像由 Wikimedia Commons 按已核验的文件来源在线载入，版权状态以原始来源页为准。</p>
      </footer>
    </div>
  `;
}

function renderHome() {
  state.view = 'home';
  history.replaceState({}, '', location.pathname);

  const featured = featuredIds.map((id, index) => {
    const artwork = artworkById[id];
    return `
      <div class="hero-art hero-art--${index + 1}">
        ${artworkImageMarkup(artwork, { width: 900, eager: index < 2 })}
        <span>${artwork.titleZh}</span>
      </div>
    `;
  }).join('');

  app.innerHTML = shell(`
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">A PERSONALITY EXHIBITION · 2026</p>
        <h1>你的灵魂，<br />早已被一位画家画过。</h1>
        <p class="hero-intro">回答 32 个关于日常选择的问题。你不需要懂艺术，只需要凭第一反应，找到那幅一直在等你的画。</p>
        <div class="hero-actions">
          <button class="button button--primary" data-action="start">
            <span>领取入馆券</span><i aria-hidden="true">→</i>
          </button>
          <button class="button button--ghost" data-action="collection">先看馆藏</button>
        </div>
        <dl class="hero-facts">
          <div><dt>32</dt><dd>道日常选择</dd></div>
          <div><dt>48</dt><dd>幅公开馆藏</dd></div>
          <div><dt>6</dt><dd>幅隐藏画作</dd></div>
        </dl>
      </div>
      <div class="hero-gallery" aria-label="部分馆藏预览">
        <div class="gallery-glow"></div>
        ${featured}
        <div class="museum-label">
          <span>ROOM 01</span>
          <strong>THE INNER COLLECTION</strong>
          <small>请勿寻找正确答案</small>
        </div>
      </div>
    </section>

    <section class="manifesto section-frame">
      <div class="section-number">01</div>
      <div>
        <p class="eyebrow">CURATOR'S NOTE</p>
        <h2>这不是一场艺术常识考试。</h2>
      </div>
      <div class="manifesto-copy">
        <p>我们不会问你是否认识莫奈，也不会让你在梵高和维米尔之间选择喜好。问题发生在更普通的地方：一次雨天、一段沉默、一个临时改变的计划。</p>
        <p>最终结果不是“你最喜欢哪幅画”，而是<strong>哪幅画的节奏、光线与情绪结构，最接近你处理世界的方式。</strong></p>
      </div>
    </section>

    <section class="experience-grid">
      <article>
        <span>Ⅰ</span>
        <h3>凭第一反应</h3>
        <p>犹豫太久时，人会开始回答“理想中的自己”。真正的你通常出现在最先闪过的选择里。</p>
      </article>
      <article>
        <span>Ⅱ</span>
        <h3>接受复杂结果</h3>
        <p>你会得到一幅主画、三幅相邻馆藏和八项人格光谱。没有任何一幅画比另一幅更高级。</p>
      </article>
      <article>
        <span>Ⅲ</span>
        <h3>留意隐藏展厅</h3>
        <p>六幅画不会出现在公开目录里。它们只在某些极少见的人格组合出现时，悄悄打开门。</p>
      </article>
    </section>

    <section class="closing-cta">
      <p class="eyebrow">ADMISSION IS FREE</p>
      <h2>世界名画正在寻找它真正的主人。</h2>
      <button class="button button--primary button--large" data-action="start">现在入场 <i>→</i></button>
    </section>
  `);

  bindGlobalActions();
  hydrateArtworkImages(app);
}

function renderQuiz() {
  state.view = 'quiz';
  const question = questions[state.questionIndex];
  const current = state.questionIndex + 1;
  const progress = Math.round((state.questionIndex / questions.length) * 100);
  const selectedValue = state.answers[question.id];

  app.innerHTML = shell(`
    <section class="quiz-page">
      <div class="quiz-progress" aria-label="答题进度">
        <div class="progress-meta">
          <span>ROOM ${String(Math.ceil(current / 8)).padStart(2, '0')}</span>
          <span>${String(current).padStart(2, '0')} / ${questions.length}</span>
        </div>
        <div class="progress-track"><i style="width:${progress}%"></i></div>
      </div>

      <div class="question-card" data-question-card>
        <div class="question-index">${String(current).padStart(2, '0')}</div>
        <p class="eyebrow">A SMALL DECISION</p>
        <h1>${question.prompt}</h1>
        <p class="question-note">${question.note}</p>
        <div class="options" role="radiogroup" aria-label="选择一个最接近你的答案">
          ${question.options.map((option, index) => `
            <button
              class="option ${selectedValue === option.value ? 'is-selected' : ''}"
              data-action="answer"
              data-value="${option.value}"
              role="radio"
              aria-checked="${selectedValue === option.value}"
            >
              <span>${String.fromCharCode(65 + index)}</span>
              <strong>${option.label}</strong>
              <i aria-hidden="true">↗</i>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="quiz-controls">
        <button class="text-button" data-action="previous" ${state.questionIndex === 0 ? 'disabled' : ''}>← 上一题</button>
        <button class="text-button" data-action="exit-quiz">暂时离馆</button>
      </div>
    </section>
  `, { minimal: true });

  bindGlobalActions();
}

function answerQuestion(value) {
  const question = questions[state.questionIndex];
  state.answers[question.id] = Number(value);

  const card = document.querySelector('[data-question-card]');
  card?.classList.add('is-leaving');

  window.setTimeout(() => {
    if (state.questionIndex < questions.length - 1) {
      state.questionIndex += 1;
      renderQuiz();
    } else {
      beginCuration();
    }
  }, 260);
}

function beginCuration() {
  state.result = getResult(state.answers, questions);
  state.view = 'loading';

  const phrases = [
    '正在比对你的情绪光谱',
    '正在穿过四十八间公开展厅',
    '正在确认隐藏馆藏是否为你开门',
    '正在把最后一束光放进画框',
  ];

  app.innerHTML = `
    <main class="curation-page">
      <div class="curation-orbit" aria-hidden="true"><i></i><i></i><i></i></div>
      <p class="eyebrow">THE CURATOR IS WORKING</p>
      <h1>请在展厅中央稍候。</h1>
      <p class="curation-status" data-curation-status>${phrases[0]}</p>
      <div class="curation-line"><i></i></div>
      <small>不要刷新页面。你的画正在被取下。</small>
    </main>
  `;

  let index = 0;
  const interval = window.setInterval(() => {
    index += 1;
    const node = document.querySelector('[data-curation-status]');
    if (node && phrases[index]) node.textContent = phrases[index];
  }, 560);

  window.setTimeout(() => {
    window.clearInterval(interval);
    renderResult(state.result);
  }, 2350);
}

function resultNumber(artwork, match) {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const index = String(artworks.findIndex((item) => item.id === artwork.id) + 1).padStart(2, '0');
  return `SG-${date.getFullYear()}${month}${day}-${index}-${match}`;
}

function profileBars(profile) {
  return DIMENSIONS.map((dimension) => {
    const value = Math.round(profile[dimension.key]);
    return `
      <div class="spectrum-row">
        <div class="spectrum-label"><span>${dimension.low}</span><strong>${dimension.label}</strong><span>${dimension.high}</span></div>
        <div class="spectrum-track"><i style="width:${value}%"></i><b style="left:${value}%"></b></div>
      </div>
    `;
  }).join('');
}

function renderResult(result, { shared = false } = {}) {
  state.view = 'result';
  state.result = result;
  state.frameClicks = 0;

  const { artwork, match } = result.primary;
  const profile = result.profile;
  const strongest = strongestDimensions(profile, 3);
  const number = resultNumber(artwork, match);
  const url = new URL(location.href);
  url.searchParams.set('result', artwork.id);
  history.replaceState({}, '', url);
  saveResult(artwork.id);

  app.innerHTML = shell(`
    <section class="result-hero">
      <div class="result-kicker">
        <span>${artwork.hidden ? 'HIDDEN COLLECTION UNLOCKED' : 'YOUR SOUL PORTRAIT'}</span>
        <span>馆藏编号 ${number}</span>
      </div>
      <div class="result-layout">
        <div class="result-art-column">
          <div class="ornate-frame ${artwork.hidden ? 'ornate-frame--hidden' : ''}" data-result-frame>
            ${artworkImageMarkup(artwork, { className: 'result-art', width: 1900, eager: true })}
            <div class="frame-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          </div>
          <button class="source-link" data-action="open-source">查看高清图像来源 ↗</button>
        </div>
        <div class="result-copy">
          ${artwork.hidden ? '<div class="hidden-seal">隐藏馆藏 · 仅为少数人格开放</div>' : ''}
          <p class="eyebrow">${artwork.movement} · ${artwork.year}</p>
          <h1>${artwork.titleZh}</h1>
          <h2>${artwork.titleEn}</h2>
          <p class="artist">${artwork.artist}</p>
          <div class="match-score"><strong>${match}</strong><span>%<small>灵魂契合度</small></span></div>
          <blockquote>“${artwork.tagline}”</blockquote>
          <p class="main-reading">${artwork.reading}</p>
          <div class="keyword-row">${artwork.keywords.map((keyword) => `<span>${keyword}</span>`).join('')}</div>
          <div class="result-actions">
            <button class="button button--primary" data-action="share">分享这幅画 <i>↗</i></button>
            <button class="button button--ghost" data-action="restart">重新观展</button>
          </div>
        </div>
      </div>
    </section>

    <section class="interpretation section-frame">
      <div class="section-number">02</div>
      <div class="interpretation-title">
        <p class="eyebrow">READING THE BACK OF THE CANVAS</p>
        <h2>画框背面，也写着你。</h2>
      </div>
      <div class="interpretation-cards">
        <article>
          <span>你的天赋</span>
          <p>${strengthNarrative(strongest)}</p>
        </article>
        <article>
          <span>容易忽略的阴影</span>
          <p>${artwork.shadow}</p>
        </article>
        <article>
          <span>下一笔可以画在哪里</span>
          <p>${artwork.growth}</p>
        </article>
      </div>
    </section>

    <section class="spectrum-section">
      <div class="spectrum-heading">
        <p class="eyebrow">YOUR INNER SPECTRUM</p>
        <h2>你在八条光谱上的位置</h2>
        <p>这些数值不是评分。它们只是说明，你习惯从哪一侧进入世界。</p>
      </div>
      <div class="spectrum-panel">${profileBars(profile)}</div>
    </section>

    <section class="companions-section">
      <div class="companions-heading">
        <p class="eyebrow">THE NEIGHBOURING ROOMS</p>
        <h2>与你相邻的三间展厅</h2>
      </div>
      <div class="companion-grid">
        ${result.companions.map(({ artwork: companion, match: companionMatch }, index) => `
          <article class="companion-card">
            ${artworkImageMarkup(companion, { width: 900 })}
            <div>
              <span>0${index + 1}</span>
              <h3>${companion.titleZh}</h3>
              <p>${companion.tagline}</p>
              <small>${companionMatch}% 相邻契合</small>
            </div>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="museum-card">
      <div>
        <p class="eyebrow">WHERE THE ORIGINAL LIVES</p>
        <h2>现在，真正的它在这里。</h2>
      </div>
      <div class="museum-details">
        <strong>${artwork.museum}</strong>
        <span>${artwork.city}</span>
        <p>有一天经过这座城市时，也许你可以去看看这幅真正照见过你的画。</p>
      </div>
    </section>

    <section class="result-final">
      <p>${shared ? '这是朋友分享给你的灵魂画像。' : '一幅画无法定义你，但它也许替你照亮了一个角落。'}</p>
      <button class="text-button text-button--large" data-action="restart">再走一次不同的路线 →</button>
    </section>

    <dialog class="secret-dialog" data-secret-dialog>
      <button data-action="close-secret" aria-label="关闭">×</button>
      <p class="eyebrow">A NOTE BEHIND THE FRAME</p>
      <h2>馆员偷偷留给你一句话</h2>
      <p>${secretNote(artwork)}</p>
      <small>你发现了结果页的小彩蛋。不是每个人都会点击画框三次。</small>
    </dialog>
  `);

  bindGlobalActions();
  hydrateArtworkImages(app);
}

function strengthNarrative(strongest) {
  return strongest.map((item) => {
    const direction = item.value >= 50 ? item.high : item.low;
    return `${direction}`;
  }).join('、') + '构成了你最鲜明的底色。你不需要把这些特质推到极致，它们已经在许多选择里替你建立了独特的节奏。';
}

function secretNote(artwork) {
  const notes = [
    `你不是需要被修复的画。${artwork.titleZh}之所以动人，也从来不是因为它毫无裂纹。`,
    `真正的收藏不是把一幅画锁起来，而是愿意一次次用新的目光看它。也请这样看待自己。`,
    `你今天选择的答案，只属于今天的你。以后再来，展厅也许会为你换一束光。`,
  ];
  const index = artworks.findIndex((item) => item.id === artwork.id) % notes.length;
  return notes[index];
}

function renderCollection() {
  state.view = 'collection';
  history.replaceState({}, '', location.pathname);

  app.innerHTML = shell(`
    <section class="collection-hero">
      <p class="eyebrow">THE PUBLIC COLLECTION</p>
      <h1>四十八幅画，<br />四十八种面对世界的方式。</h1>
      <p>这里只展示公开馆藏。六幅隐藏画作没有名称、没有预览，也不会通过点击进入。</p>
    </section>

    <section class="collection-grid">
      ${visibleArtworks.map((artwork, index) => `
        <article class="collection-card">
          <div class="collection-index">${String(index + 1).padStart(2, '0')}</div>
          ${artworkImageMarkup(artwork, { width: 850 })}
          <div class="collection-copy">
            <span>${artwork.movement}</span>
            <h2>${artwork.titleZh}</h2>
            <p>${artwork.titleEn}</p>
            <small>${artwork.keywords.join(' · ')}</small>
          </div>
        </article>
      `).join('')}
    </section>

    <section class="hidden-corridor">
      <div>
        <p class="eyebrow">THE CLOSED CORRIDOR</p>
        <h2>还有六扇门没有写名字。</h2>
        <p>它们不是“更稀有的奖励”，而是六种非常极端、彼此矛盾或少见的人格结构。只有答案真正靠近时，门才会打开。</p>
      </div>
      <div class="hidden-doors">
        ${hiddenArtworks.map((_, index) => `<div><span>H-${String(index + 1).padStart(2, '0')}</span><i></i></div>`).join('')}
      </div>
    </section>

    <section class="closing-cta">
      <p class="eyebrow">READY TO ENTER?</p>
      <h2>不要先挑喜欢的画。让画来挑你。</h2>
      <button class="button button--primary button--large" data-action="start">领取入馆券 <i>→</i></button>
    </section>
  `);

  bindGlobalActions();
  hydrateArtworkImages(app);
}

function renderAbout() {
  state.view = 'about';
  history.replaceState({}, '', location.pathname);

  app.innerHTML = shell(`
    <section class="about-page">
      <p class="eyebrow">BEFORE YOU ENTER</p>
      <h1>观展须知</h1>
      <div class="about-grid">
        <article><span>01</span><h2>不要回答“更好”的选项</h2><p>测试没有正确答案。请选择现实中的反应，而不是你认为成熟、善良或聪明的人应该怎样回答。</p></article>
        <article><span>02</span><h2>犹豫时，选第一眼</h2><p>如果两个答案都像你，通常第一眼停留的那个更接近你的自动反应。</p></article>
        <article><span>03</span><h2>结果不是诊断</h2><p>Soul Gallery 是一场人格叙事与审美体验，不是心理量表，也不能替代专业评估。</p></article>
        <article><span>04</span><h2>今天的你可以改变</h2><p>人格并非一幅永远定稿的画。生活阶段、关系和环境都会改变你此刻更接近哪间展厅。</p></article>
      </div>
      <div class="about-method">
        <div><p class="eyebrow">HOW IT WORKS</p><h2>我们比较的不是喜好，而是结构。</h2></div>
        <p>32 道问题分别落在八条光谱：向内感、秩序感、情绪浓度、理想倾向、连接方式、新鲜偏好、行动力度与内在明度。每幅画拥有自己的光谱轮廓，结果来自整体距离，而不是某一道题的标签。</p>
      </div>
      <button class="button button--primary button--large" data-action="start">我明白了，开始观展 <i>→</i></button>
    </section>
  `);

  bindGlobalActions();
}

function renderCuratorEasterEgg() {
  const existing = document.querySelector('[data-curator-modal]');
  if (existing) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'secret-dialog curator-dialog';
  dialog.dataset.curatorModal = 'true';
  dialog.innerHTML = `
    <button data-action="close-curator" aria-label="关闭">×</button>
    <p class="eyebrow">THE FIFTH KNOCK</p>
    <h2>你敲了五次馆门。</h2>
    <p>所以馆员决定承认一件事：展厅并不真的知道你是谁。它只是把你交出的细节排列成光线，再请你自己完成观看。</p>
    <small>这是首页 Logo 的隐藏彩蛋。</small>
  `;
  document.body.appendChild(dialog);
  dialog.addEventListener('click', (event) => {
    if (event.target.dataset.action === 'close-curator') dialog.close();
  });
  dialog.addEventListener('close', () => dialog.remove());
  dialog.showModal();
}

function bindGlobalActions() {
  app.querySelectorAll('[data-action]').forEach((element) => {
    element.addEventListener('click', handleAction);
  });

  const resultFrame = app.querySelector('[data-result-frame]');
  resultFrame?.addEventListener('click', () => {
    state.frameClicks += 1;
    if (state.frameClicks === 3) {
      const dialog = app.querySelector('[data-secret-dialog]');
      dialog?.showModal();
    }
  });
}

function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  switch (action) {
    case 'home':
      state.logoClicks += 1;
      if (state.logoClicks >= 5) {
        state.logoClicks = 0;
        renderCuratorEasterEgg();
      } else {
        renderHome();
      }
      break;
    case 'start':
      state.questionIndex = 0;
      state.answers = {};
      state.result = null;
      renderQuiz();
      break;
    case 'answer':
      answerQuestion(event.currentTarget.dataset.value);
      break;
    case 'previous':
      if (state.questionIndex > 0) {
        state.questionIndex -= 1;
        renderQuiz();
      }
      break;
    case 'exit-quiz':
      if (confirm('暂时离开后，本次未完成的答案不会保存。确定离馆吗？')) renderHome();
      break;
    case 'collection':
      renderCollection();
      break;
    case 'about':
      renderAbout();
      break;
    case 'restart':
      state.questionIndex = 0;
      state.answers = {};
      state.result = null;
      renderQuiz();
      break;
    case 'share':
      shareResult();
      break;
    case 'open-source':
      openImageSource(event.currentTarget);
      break;
    case 'close-secret':
      event.currentTarget.closest('dialog')?.close();
      break;
    default:
      break;
  }
}

async function shareResult() {
  const artwork = state.result?.primary?.artwork;
  if (!artwork) return;
  const shareData = {
    title: `我的灵魂画像是《${artwork.titleZh}》`,
    text: `${artwork.tagline} —— 我在 Soul Gallery 找到了自己的灵魂画像。`,
    url: location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
    showToast('结果文案和链接已复制');
  } catch (error) {
    if (error?.name !== 'AbortError') showToast('暂时无法分享，请复制浏览器地址');
  }
}

function openImageSource(button) {
  const imageNode = document.querySelector('.result-art[data-art-image]');
  const source = imageNode?.dataset.source;
  if (source) {
    window.open(source, '_blank', 'noopener,noreferrer');
  } else {
    showToast('图像来源仍在加载，请稍后再试');
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function saveResult(id) {
  try {
    const previous = JSON.parse(localStorage.getItem('soul-gallery:results') || '[]');
    const next = [id, ...previous.filter((item) => item !== id)].slice(0, 6);
    localStorage.setItem('soul-gallery:results', JSON.stringify(next));
  } catch {
    // Local storage is optional.
  }
}

function resultFromSharedArtwork(artwork) {
  const profile = profileForArtwork(artwork);
  const companions = visibleArtworks
    .filter((item) => item.id !== artwork.id)
    .map((item) => {
      const distance = Math.sqrt(item.profile.reduce((sum, value, index) => sum + (value - artwork.profile[index]) ** 2, 0) / item.profile.length);
      return { artwork: item, distance, match: Math.round(94 - distance * 0.18) };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  return {
    profile,
    primary: { artwork, match: 92, distance: 0 },
    companions,
    unlockedHidden: artwork.hidden ? [{ artwork, match: 92, distance: 0 }] : [],
  };
}

function boot() {
  const params = new URLSearchParams(location.search);
  const resultId = params.get('result');
  const sharedArtwork = resultId ? artworkById[resultId] : null;

  if (sharedArtwork) {
    renderResult(resultFromSharedArtwork(sharedArtwork), { shared: true });
  } else {
    renderHome();
  }
}

boot();
