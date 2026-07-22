import { artworks } from '../data/artworks.js';
import { questions } from '../data/questions.js';
import { UI, uiKeysMatch } from '../data/i18n.js';

const failures = [];

function hasChinese(text) {
  return /[\u3400-\u9fff]/.test(String(text || ''));
}

function requireNonEmpty(label, value) {
  if (value == null || String(value).trim() === '') {
    failures.push(`${label} is empty`);
  }
}

if (questions.length !== 32) {
  failures.push(`Expected 32 questions, found ${questions.length}`);
}

let optionCount = 0;
for (const question of questions) {
  requireNonEmpty(`${question.id}.prompt`, question.prompt);
  requireNonEmpty(`${question.id}.promptEn`, question.promptEn);
  requireNonEmpty(`${question.id}.note`, question.note);
  requireNonEmpty(`${question.id}.noteEn`, question.noteEn);

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    failures.push(`${question.id} must have 4 options`);
    continue;
  }

  for (const [index, option] of question.options.entries()) {
    optionCount += 1;
    requireNonEmpty(`${question.id}.options[${index}].label`, option.label);
    requireNonEmpty(`${question.id}.options[${index}].labelEn`, option.labelEn);
    if (hasChinese(option.labelEn)) {
      failures.push(`${question.id}.options[${index}].labelEn contains Chinese`);
    }
  }

  if (hasChinese(question.promptEn) || hasChinese(question.noteEn)) {
    failures.push(`${question.id} English fields contain Chinese`);
  }
}

if (optionCount !== 128) {
  failures.push(`Expected 128 options, found ${optionCount}`);
}

const requiredArtworkEn = [
  'artistEn',
  'museumEn',
  'cityEn',
  'movementEn',
  'keywordsEn',
  'taglineEn',
  'readingEn',
  'shadowEn',
  'growthEn',
];

const requiredArtworkZh = [
  'titleZh',
  'artist',
  'museum',
  'city',
  'movement',
  'keywords',
  'tagline',
  'reading',
  'shadow',
  'growth',
];

if (artworks.length !== 114) {
  failures.push(`Expected 114 artworks, found ${artworks.length}`);
}

const requiredUiKeys = [
  'ticketTitle',
  'ticketIntro',
  'ticketNameLabel',
  'enterNow',
  'nameRequired',
  'sharedStartCta',
  'sharedResultLead',
  'anonymousFriend',
  'backHome',
  'admissionNoticeTitle',
  'step4Title',
  'closedCorridorEn',
  'fifthKnock',
  'beforeEnterEn',
  'beforeEnterZh',
  'expandCollection',
  'collectionPreviewNote',
  'curatorNoteP1',
  'curatorNoteP2',
  'curatorNoteP3Before',
  'curatorNoteP3Strong',
  'backToTop',
  'backToTopAria',
  'sharedOwnerEyebrow',
  'sharedResultKicker',
];

for (const key of requiredUiKeys) {
  if (!(key in UI.zh) || !(key in UI.en)) {
    failures.push(`Missing UI key: ${key}`);
  }
}

const removedUiKeys = [
  'fifthKnockZh',
  'manifestoP1',
  'manifestoP2Before',
  'manifestoP2Strong',
  'howWorksEn',
  'howWorksZh',
  'howWorksTitle',
  'howWorksBody',
  'aboutStart',
];

for (const key of removedUiKeys) {
  if (key in UI.zh || key in UI.en) {
    failures.push(`Removed UI key still present: ${key}`);
  }
}

const intentionalEmptyZh = new Set([
  'beforeEnterZh',
  'spectrumZh',
  'neighboursZh',
  'museumZh',
  'readyEnterZh',
]);

for (const [key, value] of Object.entries(UI.zh)) {
  if (typeof value === 'string' && value.trim() === '' && !intentionalEmptyZh.has(key)) {
    failures.push(`Unexpected empty UI.zh.${key}`);
  }
}

if (typeof UI.en.beforeEnterZh !== 'string') {
  failures.push('UI.en.beforeEnterZh must exist as string');
}

if (UI.zh.beforeEnterZh !== '' || UI.en.beforeEnterZh !== '') {
  failures.push('beforeEnterZh must be an empty string in both languages');
}

for (const artwork of artworks) {
  for (const field of requiredArtworkZh) {
    const value = artwork[field];
    if (Array.isArray(value)) {
      if (!value.length) failures.push(`${artwork.id}.${field} empty`);
    } else {
      requireNonEmpty(`${artwork.id}.${field}`, value);
    }
  }

  for (const field of requiredArtworkEn) {
    const value = artwork[field];
    if (Array.isArray(value)) {
      if (!value.length) failures.push(`${artwork.id}.${field} empty`);
      value.forEach((item, index) => {
        if (hasChinese(item)) {
          failures.push(`${artwork.id}.${field}[${index}] contains Chinese`);
        }
      });
    } else {
      requireNonEmpty(`${artwork.id}.${field}`, value);
      if (hasChinese(value)) {
        failures.push(`${artwork.id}.${field} contains Chinese`);
      }
    }
  }

  if (!Array.isArray(artwork.keywords) || !Array.isArray(artwork.keywordsEn)) {
    failures.push(`${artwork.id} keywords arrays missing`);
  } else if (artwork.keywords.length !== artwork.keywordsEn.length) {
    failures.push(
      `${artwork.id} keywords/keywordsEn length mismatch (${artwork.keywords.length} vs ${artwork.keywordsEn.length})`
    );
  }
}

if (!uiKeysMatch()) {
  failures.push('UI zh/en key sets do not match');
}

const zhKeys = Object.keys(UI.zh);
const enKeys = Object.keys(UI.en);
for (const key of zhKeys) {
  if (!(key in UI.en)) failures.push(`Missing UI.en.${key}`);
}
for (const key of enKeys) {
  if (!(key in UI.zh)) failures.push(`Missing UI.zh.${key}`);
}

console.log('Soul Gallery i18n audit');
console.log(`Questions: ${questions.length} | Options: ${optionCount} | Artworks: ${artworks.length}`);
console.log(`UI keys: zh=${zhKeys.length} en=${enKeys.length}`);

if (failures.length) {
  console.log('---');
  console.log(`FAIL: ${failures.length}`);
  failures.slice(0, 80).forEach((item) => console.log(`- ${item}`));
  if (failures.length > 80) console.log(`... and ${failures.length - 80} more`);
  process.exit(1);
}

console.log('PASS: bilingual integrity checks');
