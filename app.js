import {
  artworks,
  artworkById,
  visibleArtworks,
  hiddenArtworks,
} from './data/artworks.js';
import { questions } from './data/questions.js';
import { UI } from './data/i18n.js';
import {
  getResult,
  profileForArtwork,
  strongestDimensions,
  spectrumDimensions,
  rankArtworksForProfile,
  assignDisplayMatches,
  clamp,
} from './lib/scoring.js';
import { hydrateArtworkImages } from './lib/commons.js';

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const LANGUAGE_STORAGE_KEY = 'soul-gallery:language';
const VISITOR_NAME_KEY = 'soul-gallery:visitor-name';

const hiddenFrameColors = [
  '#45645a',
  '#77574f',
  '#53647b',
  '#887343',
  '#675d78',
  '#6d7650',
];

function sanitizeVisitorName(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function readVisitorName() {
  try {
    return sanitizeVisitorName(localStorage.getItem(VISITOR_NAME_KEY));
  } catch {
    return '';
  }
}

function saveVisitorName(name) {
  try {
    localStorage.setItem(VISITOR_NAME_KEY, sanitizeVisitorName(name));
  } catch {
    // Local storage is optional.
  }
}

function createTicketNumber() {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SG-${datePart}-${randomPart}`;
}

function getInitialLanguage() {
  const params = new URLSearchParams(location.search);
  const queryLanguage = params.get('lang');

  if (queryLanguage === 'en' || queryLanguage === 'zh') {
    return queryLanguage;
  }

  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'zh') {
      return saved;
    }
  } catch {
    // ignore
  }

  return 'zh';
}

const state = {
  view: 'home',
  questionIndex: 0,
  answers: {},
  result: null,
  logoClicks: 0,
  frameClicks: 0,
  language: getInitialLanguage(),
  responseTimes: {},
  questionClock: null,
  visitorName: readVisitorName(),
  ticketNumber: null,
  resultOrigin: 'own',
  resultOwnerName: '',
};

const featuredIds = [
  'starry-night',
  'girl-pearl',
  'kiss-klimt',
  'great-wave',
  'birth-venus',
  'early-spring',
];

document.documentElement.lang = state.language === 'en' ? 'en' : 'zh-CN';

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseQuestionClock();
  } else {
    resumeQuestionClock();
  }
});

function t(key, ...args) {
  const table = UI[state.language] || UI.zh;
  const value = table[key] ?? UI.zh[key] ?? key;
  return typeof value === 'function' ? value(...args) : value;
}

function setLanguage(language) {
  state.language = language === 'en' ? 'en' : 'zh';

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
  } catch {
    // ignore
  }

  document.documentElement.lang = state.language === 'en' ? 'en' : 'zh-CN';
  document.title = t('pageTitle');

  const url = new URL(location.href);
  url.searchParams.set('lang', state.language);
  history.replaceState({}, '', url);

  renderCurrentView();
}

function renderCurrentView() {
  if (state.view === 'quiz') {
    renderQuiz();
    return;
  }
  if (state.view === 'result' && state.result) {
    renderResult(state.result);
    return;
  }
  if (state.view === 'collection') {
    renderCollection();
    return;
  }
  if (state.view === 'ticket') {
    renderTicket();
    return;
  }
  if (state.view === 'loading') {
    return;
  }
  renderHome();
}

function localizedField(item, field) {
  if (state.language === 'en') {
    return item[`${field}En`] ?? item[field];
  }
  return item[field];
}

function localizedQuestionPrompt(question) {
  return state.language === 'en' ? question.promptEn : question.prompt;
}

function localizedQuestionNote(question) {
  return state.language === 'en' ? question.noteEn : question.note;
}

function localizedOptionLabel(option) {
  return state.language === 'en' ? option.labelEn : option.label;
}

function localizedArtworkTitle(artwork) {
  return state.language === 'en' ? artwork.titleEn : artwork.titleZh;
}

function localizedArtworkKeywords(artwork) {
  return state.language === 'en' ? artwork.keywordsEn : artwork.keywords;
}

function bilingualEyebrow(english, chinese = '') {
  const translated = String(chinese || '').trim();

  if (state.language === 'en') {
    return `
      <p class="eyebrow">
        <span>${english}</span>
      </p>
    `;
  }

  return `
    <p class="eyebrow eyebrow--bilingual">
      <span>${english}</span>
      ${translated ? `<small>${translated}</small>` : ''}
    </p>
  `;
}

function bilingualInline(english, chinese) {
  if (state.language === 'en') {
    return english;
  }
  return `${english}<br />${chinese}`;
}

function syncLangInUrl(extra = {}) {
  const url = new URL(location.href);
  url.searchParams.set('lang', state.language);
  Object.entries(extra).forEach(([key, value]) => {
    if (value == null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  history.replaceState({}, '', url);
}

function clearShareParamsFromUrl() {
  syncLangInUrl({
    result: null,
    by: null,
    m: null,
    p: null,
  });
}

function serializeProfile(profile) {
  return spectrumDimensions()
    .map((dimension) => Math.round(profile[dimension.key] ?? 50))
    .join(',');
}

function parseSharedProfile(value) {
  const parts = String(value || '')
    .split(',')
    .map(Number);
  const dimensions = spectrumDimensions();

  if (
    parts.length !== dimensions.length ||
    parts.some((number) => !Number.isFinite(number) || number < 0 || number > 100)
  ) {
    return null;
  }

  return Object.fromEntries(
    dimensions.map((dimension, index) => [dimension.key, parts[index]])
  );
}

function artworkImageMarkup(artwork, { className = '', width = 1200, eager = false } = {}) {
  const palette = artwork.palette || ['#4f5c52', '#9a8062', '#d1ba92'];
  const commonsFile = artwork.commonsFile || '';
  const alt = `${localizedArtworkTitle(artwork)} · ${artwork.titleEn}`;

  return `
    <figure
      class="art-image ${className}"
      data-art-image
      data-file="${commonsFile.replaceAll('"', '&quot;')}"
      data-alt="${alt.replaceAll('"', '&quot;')}"
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
        <button class="brand" data-action="home" aria-label="${t('navHomeAria')}">
          <span class="brand-mark" aria-hidden="true"><i></i></span>
          <span class="brand-copy">
            <strong>Soul Gallery</strong>
            <small>${t('brandSmall')}</small>
          </span>
        </button>
        <nav class="header-nav" aria-label="${t('navMainAria')}">
          <button data-action="collection">${t('navCollection')}</button>
          <button data-action="about">${t('navAbout')}</button>
          <button
            class="lang-switch"
            data-action="toggle-language"
            aria-label="${t('langSwitchAria')}"
          >${t('langSwitch')}</button>
        </nav>
      </header>
      <main>${content}</main>
      <footer class="site-footer">
        <div>
          <span>Soul Gallery · ${t('brandSmall')}</span>
          <span>${t('footerTagline')}</span>
        </div>
        <p>${t('footerLegal')}</p>
      </footer>
    </div>
  `;
}

function startQuestionClock(questionId) {
  state.questionClock = {
    questionId,
    visibleElapsed: 0,
    activeSince: document.hidden ? null : performance.now(),
  };
}

function pauseQuestionClock() {
  const clock = state.questionClock;

  if (!clock || clock.activeSince === null) {
    return;
  }

  clock.visibleElapsed += performance.now() - clock.activeSince;
  clock.activeSince = null;
}

function resumeQuestionClock() {
  const clock = state.questionClock;

  if (!clock || clock.activeSince !== null || document.hidden) {
    return;
  }

  clock.activeSince = performance.now();
}

function finishQuestionClock(questionId) {
  const clock = state.questionClock;

  if (!clock || clock.questionId !== questionId) {
    return null;
  }

  pauseQuestionClock();

  const elapsed = Math.min(45000, Math.max(450, clock.visibleElapsed));
  state.questionClock = null;
  return elapsed;
}

function scrollToAdmissionNotice() {
  const performScroll = () => {
    document.querySelector('#admission-notice')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  if (state.view !== 'home') {
    renderHome();
    requestAnimationFrame(() => {
      requestAnimationFrame(performScroll);
    });
    return;
  }

  performScroll();
}

function renderHome() {
  state.view = 'home';
  clearShareParamsFromUrl();

  const featured = featuredIds
    .map((id, index) => {
      const artwork = artworkById[id];
      return `
      <div class="hero-art hero-art--${index + 1}">
        ${artworkImageMarkup(artwork, { width: 900, eager: index < 2 })}
        <span>${localizedArtworkTitle(artwork)}</span>
      </div>
    `;
    })
    .join('');

  app.innerHTML = shell(`
    <section class="hero">
      <div class="hero-copy">
        ${bilingualEyebrow(`${t('heroEyebrowEn')} · 2026`, t('heroEyebrowZh'))}
        <h1>${t('heroTitle')}</h1>
        <p class="hero-intro">${t('heroIntro')}</p>
        <div class="hero-actions">
          <button class="button button--ghost" data-action="collection">${t('collectionCta')}</button>
          <button class="button button--primary" data-action="ticket">
            <span>${t('startCta')}</span><i aria-hidden="true">→</i>
          </button>
        </div>
        <dl class="hero-facts">
          <div><dt>32</dt><dd>${t('factChoices')}</dd></div>
          <div><dt>108</dt><dd>${t('factPublic')}</dd></div>
          <div><dt>6</dt><dd>${t('factHidden')}</dd></div>
        </dl>
      </div>
      <div class="hero-gallery" aria-label="${state.language === 'en' ? 'Collection preview' : '部分馆藏预览'}">
        <div class="gallery-glow"></div>
        ${featured}
      </div>
    </section>

    <section class="admission-notice section-frame" id="admission-notice">
      <div class="admission-heading">
        <div class="section-number">01</div>
        <div>
          ${bilingualEyebrow(t('curatorNoteEn'), t('curatorNoteZh'))}
          <h2>${t('admissionNoticeTitle')}</h2>
        </div>
      </div>

      <div class="admission-intro">
        <p>${t('manifestoP1')}</p>
        <p>
          ${t('manifestoP2Before')}
          <strong>${t('manifestoP2Strong')}</strong>
        </p>
      </div>

      <div class="admission-rules">
        <article>
          <span>Ⅰ</span>
          <div>
            <h3>${t('step1Title')}</h3>
            <p>${t('step1Body')}</p>
          </div>
        </article>
        <article>
          <span>Ⅱ</span>
          <div>
            <h3>${t('step2Title')}</h3>
            <p>${t('step2Body')}</p>
          </div>
        </article>
        <article>
          <span>Ⅲ</span>
          <div>
            <h3>${t('step3Title')}</h3>
            <p>${t('step3Body')}</p>
          </div>
        </article>
        <article>
          <span>Ⅳ</span>
          <div>
            <h3>${t('step4Title')}</h3>
            <p>${t('step4Body')}</p>
          </div>
        </article>
      </div>

      <div class="admission-method">
        <div>
          ${bilingualEyebrow(t('howWorksEn'), t('howWorksZh'))}
          <h3>${t('howWorksTitle')}</h3>
        </div>
        <p>${t('howWorksBody')}</p>
      </div>

      <div class="admission-cta">
        <button class="button button--primary button--large" data-action="ticket">
          ${t('aboutStart')} <i aria-hidden="true">→</i>
        </button>
      </div>
    </section>

    <section class="closing-cta">
      ${bilingualEyebrow(t('admissionEn'), t('admissionZh'))}
      <h2>${t('closingTitle')}</h2>
      <button class="button button--primary button--large" data-action="ticket">${t('startCta')} <i>→</i></button>
    </section>
  `);

  bindGlobalActions();
  hydrateArtworkImages(app);
}

function renderTicket() {
  state.view = 'ticket';
  clearShareParamsFromUrl();

  if (!state.ticketNumber) {
    state.ticketNumber = createTicketNumber();
  }

  const safeName = escapeHtml(state.visitorName);
  const displayName = safeName || t('ticketUnnamed');

  app.innerHTML = shell(`
    <section class="ticket-page">
      <div class="ticket-intro">
        ${bilingualEyebrow(t('ticketEyebrowEn'), t('ticketEyebrowZh'))}
        <h1>${t('ticketTitle')}</h1>
        <p>${t('ticketIntro')}</p>
      </div>

      <div class="ticket-layout">
        <article class="admission-ticket">
          <div class="ticket-edge ticket-edge--left"></div>
          <div class="ticket-edge ticket-edge--right"></div>

          <header class="ticket-brand">
            <div>
              <strong>Soul Gallery</strong>
              <span>PERSONALITY EXHIBITION · 2026</span>
            </div>
            <span class="ticket-admit">
              ${t('ticketAdmitOne')}
            </span>
          </header>

          <div class="ticket-center">
            <p>${t('ticketHolderLabel')}</p>
            <h2 data-ticket-name>${displayName}</h2>
          </div>

          <footer class="ticket-footer">
            <div>
              <span>${t('ticketNumberLabel')}</span>
              <strong>${state.ticketNumber}</strong>
            </div>

            <div class="ticket-stat">
              <strong>32</strong>
              <span>${t('ticketQuestions')}</span>
            </div>

            <div class="ticket-stat">
              <strong>108</strong>
              <span>${t('ticketPublic')}</span>
            </div>

            <div class="ticket-stat">
              <strong>6</strong>
              <span>${t('ticketHidden')}</span>
            </div>
          </footer>
        </article>

        <div class="ticket-form">
          <label for="visitor-name">
            ${t('ticketNameLabel')}
          </label>

          <input
            id="visitor-name"
            data-visitor-name
            type="text"
            maxlength="30"
            autocomplete="name"
            value="${safeName}"
            placeholder="${t('ticketNamePlaceholder')}"
          />

          <p>${t('ticketNameHint')}</p>

          <button
            class="button button--primary button--large"
            data-action="enter-quiz"
            ${safeName ? '' : 'disabled'}
          >
            ${t('enterNow')}
            <i aria-hidden="true">→</i>
          </button>
        </div>
      </div>
    </section>
  `);

  bindGlobalActions();

  const input = app.querySelector('[data-visitor-name]');
  const ticketName = app.querySelector('[data-ticket-name]');
  const enterButton = app.querySelector('[data-action="enter-quiz"]');

  input?.addEventListener('input', () => {
    state.visitorName = sanitizeVisitorName(input.value);

    if (ticketName) {
      ticketName.textContent = state.visitorName || t('ticketUnnamed');
    }

    if (enterButton) {
      enterButton.disabled = !state.visitorName;
    }
  });

  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && state.visitorName && enterButton) {
      enterButton.click();
    }
  });

  requestAnimationFrame(() => input?.focus());
}

function renderQuiz() {
  state.view = 'quiz';
  const question = questions[state.questionIndex];
  const current = state.questionIndex + 1;
  const progress = Math.round((state.questionIndex / questions.length) * 100);
  const selectedValue = state.answers[question.id];

  app.innerHTML = shell(
    `
    <section class="quiz-page">
      <div class="quiz-progress" aria-label="${t('quizProgressAria')}">
        <div class="progress-meta">
          <span>ROOM ${String(current).padStart(2, '0')}</span>
          <span>${String(current).padStart(2, '0')} / ${questions.length}</span>
        </div>
        <div class="progress-track"><i style="width:${progress}%"></i></div>
      </div>

      <div class="question-card" data-question-card>
        <h1>${localizedQuestionPrompt(question)}</h1>
        <p class="question-note">${localizedQuestionNote(question)}</p>
        <div class="options" role="radiogroup" aria-label="${t('optionsAria')}">
          ${question.options
            .map(
              (option, index) => `
            <button
              class="option ${selectedValue === option.value ? 'is-selected' : ''}"
              data-action="answer"
              data-value="${option.value}"
              role="radio"
              aria-checked="${selectedValue === option.value}"
            >
              <span>${String.fromCharCode(65 + index)}</span>
              <strong>${localizedOptionLabel(option)}</strong>
              <i aria-hidden="true">↗</i>
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="quiz-controls">
        <button class="text-button" data-action="previous" ${state.questionIndex === 0 ? 'disabled' : ''}>${t('previous')}</button>
        <button class="text-button" data-action="exit-quiz">${t('exitQuiz')}</button>
      </div>
    </section>
  `,
    { minimal: true }
  );

  bindGlobalActions();
  requestAnimationFrame(() => {
    startQuestionClock(question.id);
  });
}

function answerQuestion(value) {
  const question = questions[state.questionIndex];
  const responseTime = finishQuestionClock(question.id);

  if (typeof responseTime === 'number') {
    state.responseTimes[question.id] = responseTime;
  }

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
  state.result = getResult(state.answers, questions, state.responseTimes);
  state.resultOrigin = 'own';
  state.resultOwnerName = state.visitorName;
  state.view = 'loading';

  const phrases = [t('phrase1'), t('phrase2'), t('phrase3'), t('phrase4')];

  app.innerHTML = `
    <main class="curation-page">
      <div class="curation-orbit" aria-hidden="true"><i></i><i></i><i></i></div>
      ${bilingualEyebrow(t('curatorWorkingEn'), t('curatorWorkingZh'))}
      <h1>${t('curationTitle')}</h1>
      <p class="curation-status" data-curation-status>${phrases[0]}</p>
      <div class="curation-line"><i></i></div>
      <small>${t('curationWait')}</small>
    </main>
  `;

  let index = 0;
  const interval = window.setInterval(() => {
    index += 1;
    const node = document.querySelector('[data-curation-status]');
    if (node && phrases[index]) {
      node.textContent = phrases[index];
    }
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
  const index = String(artworks.findIndex((item) => item.id === artwork.id) + 1).padStart(
    3,
    '0'
  );
  return `SG-${date.getFullYear()}${month}${day}-${index}-${match}`;
}

function profileBars(profile) {
  return spectrumDimensions()
    .map((dimension) => {
      const value = Math.round(profile[dimension.key] ?? 50);
      const low = localizedField(dimension, 'low');
      const high = localizedField(dimension, 'high');
      const label = localizedField(dimension, 'label');
      return `
      <div class="spectrum-row">
        <div class="spectrum-label"><span>${low}</span><strong>${label}</strong><span>${high}</span></div>
        <div class="spectrum-track"><i style="width:${value}%"></i><b style="left:${value}%"></b></div>
      </div>
    `;
    })
    .join('');
}

function resultPortraitKicker(artwork) {
  const isShared = state.resultOrigin === 'shared';
  const ownerName = state.resultOwnerName || t('anonymousFriend');

  if (artwork.hidden) {
    const en = t('hiddenUnlockedEn');
    const zh = t('hiddenUnlockedZh');
    if (state.language === 'zh' && zh) {
      return `${en} · ${zh}`;
    }
    return en;
  }

  if (isShared) {
    return state.language === 'en'
      ? t('sharedPortraitTitleEn', ownerName)
      : t('sharedPortraitTitle', ownerName);
  }

  return state.language === 'en'
    ? t('soulPortraitOfEn', ownerName || state.visitorName || t('anonymousFriend'))
    : t('soulPortraitOf', ownerName || state.visitorName || t('anonymousFriend'));
}

function renderResult(result) {
  state.view = 'result';
  state.result = result;
  state.frameClicks = 0;

  const isShared = state.resultOrigin === 'shared';
  const { artwork, match } = result.primary;
  const profile = result.profile;
  const strongest = strongestDimensions(profile, 3);
  const number = resultNumber(artwork, match);
  const ownerName = state.resultOwnerName || t('anonymousFriend');
  const safeOwnerName = escapeHtml(ownerName);
  const portraitKicker = escapeHtml(resultPortraitKicker(artwork));

  if (!isShared) {
    clearShareParamsFromUrl();
    saveResult(artwork.id);
  }

  app.innerHTML = shell(`
    <section class="result-hero">
      <div class="result-kicker">
        <span data-result-kicker>${portraitKicker}</span>
        <span>${t('collectionNumber')} ${number}</span>
      </div>
      <div class="result-layout">
        <div class="result-art-column">
          <div class="ornate-frame ${artwork.hidden ? 'ornate-frame--hidden' : ''}" data-result-frame>
            ${artworkImageMarkup(artwork, { className: 'result-art', width: 1900, eager: true })}
            <div class="frame-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          </div>
          <button class="source-link" data-action="open-source">${t('openSource')}</button>
        </div>
        <div class="result-copy">
          ${artwork.hidden ? `<div class="hidden-seal">${t('hiddenSeal')}</div>` : ''}
          <p class="eyebrow">${localizedField(artwork, 'movement')} · ${artwork.year}</p>
          <h1>${localizedArtworkTitle(artwork)}</h1>
          ${state.language === 'zh' ? `<h2>${artwork.titleEn}</h2>` : ''}
          <p class="artist">${localizedField(artwork, 'artist')}</p>
          <div class="match-score"><strong>${match}</strong><span>%<small>${t('matchLabel')}</small></span></div>
          <blockquote>“${localizedField(artwork, 'tagline')}”</blockquote>
          <p class="main-reading">${localizedField(artwork, 'reading')}</p>
          <div class="keyword-row">${localizedArtworkKeywords(artwork)
            .map((keyword) => `<span>${keyword}</span>`)
            .join('')}</div>
          <div class="result-actions">
            ${
              isShared
                ? ''
                : `
              <button class="button button--primary" data-action="share">${t('share')} <i>↗</i></button>
              <button class="button button--ghost" data-action="restart">${t('restart')}</button>
            `
            }
          </div>
        </div>
      </div>
    </section>

    <section class="interpretation section-frame">
      <div class="section-number">02</div>
      <div class="interpretation-title">
        ${bilingualEyebrow(t('readingBackEn'), t('readingBackZh'))}
        <h2>${t('readingBackTitle')}</h2>
      </div>
      <div class="interpretation-cards">
        <article>
          <span>${t('talent')}</span>
          <p>${strengthNarrative(strongest)}</p>
        </article>
        <article>
          <span>${t('shadowLabel')}</span>
          <p>${localizedField(artwork, 'shadow')}</p>
        </article>
        <article>
          <span>${t('growthLabel')}</span>
          <p>${localizedField(artwork, 'growth')}</p>
        </article>
      </div>
    </section>

    <section class="spectrum-section">
      <div class="spectrum-heading">
        ${bilingualEyebrow(t('spectrumEn'), t('spectrumZh'))}
        <h2>${t('spectrumTitle')}</h2>
        <p>${t('spectrumIntro')}</p>
        <p class="tempo-note">${t('tempoNote')}</p>
      </div>
      <div class="spectrum-panel">${profileBars(profile)}</div>
    </section>

    <section class="companions-section">
      <div class="companions-heading">
        ${bilingualEyebrow(t('neighboursEn'), t('neighboursZh'))}
        <h2>${t('neighboursTitle')}</h2>
      </div>
      <div class="companion-grid">
        ${result.companions
          .map(
            ({ artwork: companion, match: companionMatch }, index) => `
          <article class="companion-card">
            ${artworkImageMarkup(companion, { width: 900 })}
            <div>
              <span>0${index + 1}</span>
              <h3>${localizedArtworkTitle(companion)}</h3>
              <p>${localizedField(companion, 'tagline')}</p>
              <small>${companionMatch}% ${t('neighbourMatch')}</small>
            </div>
          </article>
        `
          )
          .join('')}
      </div>
    </section>

    <section class="museum-card">
      <div>
        ${bilingualEyebrow(t('museumEn'), t('museumZh'))}
        <h2>${t('museumTitle')}</h2>
      </div>
      <div class="museum-details">
        <strong>${localizedField(artwork, 'museum')}</strong>
        <span>${localizedField(artwork, 'city')}</span>
        <p>${t('museumBody')}</p>
      </div>
    </section>

    <section class="result-final">
      ${
        isShared
          ? `
        <p>${t(
          'sharedResultLead',
          safeOwnerName,
          state.language === 'en' ? artwork.titleEn : artwork.titleZh
        )}</p>
        <button class="button button--primary button--large" data-action="ticket">
          ${t('sharedStartCta')}
        </button>
      `
          : `
        <p>${t('ownResult')}</p>
        <button class="text-button text-button--large" data-action="restart">${t('walkAgain')}</button>
      `
      }
    </section>

    <dialog class="secret-dialog" data-secret-dialog>
      <button data-action="close-secret" aria-label="${t('close')}">×</button>
      ${bilingualEyebrow(t('noteBehindEn'), t('noteBehindZh'))}
      <h2>${t('secretTitle')}</h2>
      <p>${secretNote(artwork)}</p>
      <small>${t('secretHint')}</small>
    </dialog>
  `);

  bindGlobalActions();
  hydrateArtworkImages(app);
}

function strengthNarrative(strongest) {
  const joined = strongest
    .map((item) => {
      const direction =
        item.value >= 50
          ? localizedField(item, 'high')
          : localizedField(item, 'low');
      return direction;
    })
    .join(state.language === 'en' ? ', ' : '、');

  return `${joined}${state.language === 'en' ? ' ' : ''}${t('strengthSuffix')}`;
}

function secretNote(artwork) {
  const title = localizedArtworkTitle(artwork);
  const notes =
    state.language === 'en'
      ? [
          `You are not a painting that needs repair. What makes “${title}” moving was never the absence of cracks.`,
          `True collecting is not locking a work away, but returning to it with new eyes. Please look at yourself the same way.`,
          `The answers you chose today belong only to today's self. Come again later, and the rooms may change their light for you.`,
          `You do not need to become complete all at once. Paint also dries layer by layer before arriving at its present colour.`,
          `Not every light comes from far away. Sometimes it appears because you have finally stopped hiding yourself from it.`,
          `Do not doubt the direction simply because part of the road is slow. A rhythm that belongs to you owes no one an explanation.`,
          `Let today contain only one small brushstroke. Many expansive images begin with an almost unnoticeable mark.`,
          `You have already travelled farther than many moments you once feared. Sometimes looking back is how you notice that.`,
          `A part of you that is not immediately understood has not lost its value. A good work also asks the viewer to remain.`,
          `When a choice arrives, may you hear the world without missing your own voice.`,
        ]
      : [
          `你不是需要被修复的画。${title}之所以动人，也从来不是因为它毫无裂纹。`,
          `真正的收藏不是把一幅画锁起来，而是愿意一次次用新的目光看它。也请这样看待自己。`,
          `你今天选择的答案，只属于今天的你。以后再来，展厅也许会为你换一束光。`,
          `你不需要一次成为完整的人。画也是一层层干透，才有了今天的颜色。`,
          `不是每一道光都来自远方。有时只是你终于没有继续遮住自己。`,
          `别因为一段路走得慢，就怀疑方向。真正属于你的节奏，不需要向谁交代。`,
          `允许今天只完成一小笔。许多辽阔的画面，都从不起眼的落笔开始。`,
          `你已经比许多曾经害怕的时刻走得更远。偶尔回头，是为了看见这一点。`,
          `没有被立刻理解的部分，不等于没有价值。好作品也需要观者停留。`,
          `愿你在需要选择时，既听见世界的声音，也没有错过自己的。`,
        ];
  const index = artworks.findIndex((item) => item.id === artwork.id) % notes.length;
  return notes[index];
}

function renderCollection() {
  state.view = 'collection';
  clearShareParamsFromUrl();

  app.innerHTML = shell(`
    <section class="collection-hero">
      <button class="back-link" data-action="back-home">${t('backHome')}</button>
      ${bilingualEyebrow(t('publicCollectionEn'), t('publicCollectionZh'))}
      <h1>${t('collectionTitle')}</h1>
      <p>${t('collectionIntro')}</p>
    </section>

    <section class="collection-grid">
      ${visibleArtworks
        .map(
          (artwork, index) => `
        <article class="collection-card">
          <header class="collection-card-header">
            <span class="collection-index">${String(index + 1).padStart(3, '0')}</span>
            <span class="collection-status">${bilingualInline(t('onView'), t('onViewZh'))}</span>
          </header>
          ${artworkImageMarkup(artwork, { className: 'collection-art', width: 1100 })}
          <div class="collection-copy">
            <p class="collection-movement">
              ${localizedField(artwork, 'movement')}
              <span aria-hidden="true">·</span>
              ${artwork.year}
            </p>
            <h2>${localizedArtworkTitle(artwork)}</h2>
            ${
              state.language === 'zh'
                ? `<p class="collection-title-en">${artwork.titleEn}</p>`
                : ''
            }
            <dl class="collection-provenance">
              <div>
                <dt>${t('artistLabel')}</dt>
                <dd>${localizedField(artwork, 'artist')}</dd>
              </div>
              <div>
                <dt>${t('museumLabel')}</dt>
                <dd>
                  ${localizedField(artwork, 'museum')}
                  ·
                  ${localizedField(artwork, 'city')}
                </dd>
              </div>
            </dl>
            <div class="collection-keywords">
              ${localizedArtworkKeywords(artwork)
                .map((keyword) => `<span>${keyword}</span>`)
                .join('')}
            </div>
          </div>
        </article>
      `
        )
        .join('')}
    </section>

    <section class="hidden-corridor">
      <div>
        ${bilingualEyebrow(t('closedCorridorEn'), t('closedCorridorZh'))}
        <h2>${t('closedTitle')}</h2>
        <p>${t('closedBody')}</p>
      </div>
      <div class="hidden-doors">
        ${hiddenArtworks
          .map(
            (_, index) => `
          <div
            class="hidden-mini-frame"
            style="--hidden-frame-color: ${hiddenFrameColors[index]}; background: ${hiddenFrameColors[index]}; border-color: ${hiddenFrameColors[index]};"
            aria-label="${t('hiddenPaintingAria', index + 1)}"
          >
            <span aria-hidden="true">?</span>
          </div>
        `
          )
          .join('')}
      </div>
    </section>

    <section class="closing-cta">
      ${bilingualEyebrow(t('readyEnterEn'), t('readyEnterZh'))}
      <h2>${t('readyTitle')}</h2>
      <button class="button button--primary button--large" data-action="ticket">${t('startCta')} <i>→</i></button>
    </section>
  `);

  bindGlobalActions();
  hydrateArtworkImages(app);
}

function renderCuratorEasterEgg() {
  const existing = document.querySelector('[data-curator-modal]');
  if (existing) {
    return;
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'secret-dialog curator-dialog';
  dialog.dataset.curatorModal = 'true';
  dialog.innerHTML = `
    <button data-action="close-curator" aria-label="${t('close')}">×</button>
    ${bilingualEyebrow(t('fifthKnock'), t('fifthKnockZh'))}
    <h2>${t('curatorEggTitle')}</h2>
    <p>${t('curatorEggBody')}</p>
  `;
  document.body.appendChild(dialog);
  dialog.addEventListener('click', (event) => {
    if (event.target.dataset.action === 'close-curator') {
      dialog.close();
    }
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
        break;
      }
      if (state.view !== 'home') {
        renderHome();
      }
      break;
    case 'ticket':
      renderTicket();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'enter-quiz':
      if (!state.visitorName) {
        showToast(t('nameRequired'));
        break;
      }
      saveVisitorName(state.visitorName);
      state.questionIndex = 0;
      state.answers = {};
      state.result = null;
      state.responseTimes = {};
      state.questionClock = null;
      state.resultOrigin = 'own';
      state.resultOwnerName = state.visitorName;
      renderQuiz();
      break;
    case 'answer':
      answerQuestion(event.currentTarget.dataset.value);
      break;
    case 'previous':
      if (state.questionIndex > 0) {
        finishQuestionClock(questions[state.questionIndex].id);
        state.questionIndex -= 1;
        renderQuiz();
      }
      break;
    case 'exit-quiz':
      if (confirm(t('exitConfirm'))) {
        state.questionClock = null;
        renderHome();
      }
      break;
    case 'collection':
      renderCollection();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'about':
      scrollToAdmissionNotice();
      break;
    case 'back-home':
      renderHome();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'restart':
      renderTicket();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'share':
      shareResult();
      break;
    case 'open-source':
      openImageSource();
      break;
    case 'close-secret':
      event.currentTarget.closest('dialog')?.close();
      break;
    case 'toggle-language':
      setLanguage(state.language === 'zh' ? 'en' : 'zh');
      break;
    default:
      break;
  }
}

async function shareResult() {
  const artwork = state.result?.primary?.artwork;
  if (!artwork || !state.result) {
    return;
  }

  const shareUrl = new URL(location.origin + location.pathname);
  shareUrl.searchParams.set('result', artwork.id);
  shareUrl.searchParams.set('by', state.visitorName || t('anonymousFriend'));
  shareUrl.searchParams.set('m', String(state.result.primary.match));
  shareUrl.searchParams.set('p', serializeProfile(state.result.profile));
  shareUrl.searchParams.set('lang', state.language);

  const shareData = {
    title: t(
      'shareTitle',
      state.visitorName || t('anonymousFriend'),
      localizedArtworkTitle(artwork)
    ),
    text: t('shareText', localizedField(artwork, 'tagline')),
    url: shareUrl.toString(),
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(
      `${shareData.title}\n${shareData.text}\n${shareData.url}`
    );
    showToast(t('copied'));
  } catch (error) {
    if (error?.name !== 'AbortError') {
      showToast(t('shareFail'));
    }
  }
}

function openImageSource() {
  const imageNode = document.querySelector('.result-art[data-art-image]');
  const source = imageNode?.dataset.source;
  if (source) {
    window.open(source, '_blank', 'noopener,noreferrer');
  } else {
    showToast(t('sourceLoading'));
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

function resultFromSharedArtwork(artwork, profile, primaryMatch) {
  const ranked = rankArtworksForProfile(profile);
  const primaryEntry =
    ranked.find((item) => item.artwork.id === artwork.id) || {
      artwork,
      distance: 0,
      match: primaryMatch,
    };

  const others = ranked.filter((item) => item.artwork.id !== artwork.id);
  const reordered = [
    { artwork, distance: primaryEntry.distance },
    ...others.map(({ artwork: item, distance }) => ({ artwork: item, distance })),
  ];
  const withMatches = assignDisplayMatches(reordered);

  let previousMatch = primaryMatch;
  const companions = withMatches.slice(1, 4).map((item, index) => {
    const match = clamp(
      Math.min(item.match, previousMatch - 1, primaryMatch - (index + 1)),
      60,
      primaryMatch - 1
    );
    previousMatch = match;
    return {
      ...item,
      match,
    };
  });

  return {
    profile,
    primary: {
      artwork,
      distance: primaryEntry.distance,
      match: primaryMatch,
    },
    companions,
    unlockedHidden: artwork.hidden
      ? [{ artwork, match: primaryMatch, distance: primaryEntry.distance }]
      : [],
  };
}

function boot() {
  document.title = t('pageTitle');
  const params = new URLSearchParams(location.search);
  const resultId = params.get('result');
  const sharedArtwork = resultId ? artworkById[resultId] : null;

  if (sharedArtwork) {
    const ownerName = sanitizeVisitorName(params.get('by'));
    const sharedMatch = clamp(Number(params.get('m')) || 92, 60, 99);
    const sharedProfile =
      parseSharedProfile(params.get('p')) || profileForArtwork(sharedArtwork);

    state.resultOrigin = 'shared';
    state.resultOwnerName = ownerName || t('anonymousFriend');
    state.result = resultFromSharedArtwork(sharedArtwork, sharedProfile, sharedMatch);
    renderResult(state.result);
  } else {
    state.resultOrigin = 'own';
    renderHome();
  }
}

boot();
