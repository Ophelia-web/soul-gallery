import { DIMENSIONS, artworks, hiddenArtworks, visibleArtworks } from '../data/artworks.js';
import { questions } from '../data/questions.js';
import { UI } from '../data/i18n.js';
import {
  buildProfile,
  getResult,
  profileDistance,
  similarityFromDistance,
  spectrumDimensions,
  RESPONSE_POINTS,
  scoreQuestionAnswer,
} from '../lib/scoring.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const failures = [];
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function assert(condition, message) {
  if (!condition) failures.push(message);
}

console.log('Soul Gallery scoring audit');

assert(questions.length === 32, `questions.length ${questions.length}`);
assert(DIMENSIONS.length === 8, `DIMENSIONS.length ${DIMENSIONS.length}`);
assert(spectrumDimensions().length === 8, 'spectrumDimensions must be 8');
assert(visibleArtworks.length === 108, `visible ${visibleArtworks.length}`);
assert(hiddenArtworks.length === 6, `hidden ${hiddenArtworks.length}`);
assert(artworks.length === 114, `total ${artworks.length}`);

const dimCounts = Object.fromEntries(DIMENSIONS.map(({ key }) => [key, 0]));
for (const question of questions) {
  assert(Array.isArray(question.options) && question.options.length === 4, `${question.id} option count`);
  const values = question.options.map((option) => Number(option.value));
  assert(
    values.every((value, index) => index === 0 || value > values[index - 1]),
    `${question.id} option values must increase`
  );
  dimCounts[question.dimension] = (dimCounts[question.dimension] || 0) + 1;
}

for (const { key } of DIMENSIONS) {
  assert(dimCounts[key] === 4, `${key} must have 4 questions, found ${dimCounts[key]}`);
}

assert(
  RESPONSE_POINTS.map((value) => Number(value.toFixed(2))).join(',') === '0,33.33,66.67,100',
  `RESPONSE_POINTS unexpected: ${RESPONSE_POINTS}`
);

for (const artwork of artworks) {
  assert(artwork.profile.length === 8, `${artwork.id} profile length`);
  assert(
    artwork.profile.every((value) => Number.isFinite(value) && value >= 0 && value <= 100),
    `${artwork.id} profile bounds`
  );
}

const lowAnswers = Object.fromEntries(questions.map((question) => [question.id, question.options[0].value]));
const highAnswers = Object.fromEntries(questions.map((question) => [question.id, question.options[3].value]));

const first = getResult(lowAnswers, questions);
for (let i = 0; i < 100; i += 1) {
  const again = getResult(lowAnswers, questions);
  assert(again.primary.artwork.id === first.primary.artwork.id, 'determinism primary id');
  assert(Math.abs(again.primary.distance - first.primary.distance) < 1e-12, 'determinism distance');
  assert(JSON.stringify(again.profile) === JSON.stringify(first.profile), 'determinism profile');
}

assert(!('tempo' in first.profile), 'profile must not include tempo');
assert(!('responseTimes' in first), 'result must not include responseTimes');

const baseProfile = buildProfile(lowAnswers, questions);
const sampleQuestion = questions.find((question) => question.dimension === 'inner');
const bumped = { ...lowAnswers, [sampleQuestion.id]: sampleQuestion.options[1].value };
const bumpedProfile = buildProfile(bumped, questions);

for (const { key } of DIMENSIONS) {
  if (key === 'inner') {
    const delta = Math.abs(bumpedProfile[key] - baseProfile[key]);
    assert(delta > 0, 'adjacent option must change dimension');
    assert(delta <= 8.34 + 0.01, `single-question max impact ${delta}`);
    assert(Math.abs(delta - 100 / 12) < 0.01, `expected ~8.333 impact, got ${delta}`);
  } else {
    assert(bumpedProfile[key] === baseProfile[key], `${key} must stay unchanged`);
  }
}

const score = scoreQuestionAnswer(sampleQuestion, sampleQuestion.options[2].value);
assert(Math.abs(score - 200 / 3) < 1e-9, 'scoreQuestionAnswer mid option');

const ranked = getResult(highAnswers, questions);
for (let i = 1; i < ranked.companions.length; i += 1) {
  const previous = i === 1 ? ranked.primary : ranked.companions[i - 2];
  const current = ranked.companions[i - 1];
  assert(previous.distance <= current.distance + 1e-12, 'ranking must follow distance');
  assert(
    Math.abs(current.match - similarityFromDistance(current.distance)) < 1e-9,
    'match must follow distance'
  );
}

assert(
  Math.abs(similarityFromDistance(12.34) - (Math.round((100 - 12.34) * 10) / 10)) < 1e-9,
  'similarityFromDistance formula'
);

const sourceFiles = [
  'app.js',
  'lib/scoring.js',
  'lib/ambient.js',
  'data/artworks.js',
  'data/i18n.js',
  'README.md',
];

for (const relative of sourceFiles) {
  const text = fs.readFileSync(path.join(root, relative), 'utf8');
  assert(!/\bTEMPO_DIMENSION\b/.test(text), `${relative} still mentions TEMPO_DIMENSION`);
  assert(!/\bresponseTimes\b/.test(text), `${relative} still mentions responseTimes`);
  assert(!/\bquestionClock\b/.test(text), `${relative} still mentions questionClock`);
  assert(!/\bbuildTempoScore\b/.test(text), `${relative} still mentions buildTempoScore`);
}

const bannedCopy = [
  '思考节奏',
  'Decision Tempo',
  '九条光谱',
  'nine spectrums',
  'nine spectra',
  '答题时间',
  'response time',
  '科学认证',
  '临床准确',
];

for (const lang of ['zh', 'en']) {
  for (const [key, value] of Object.entries(UI[lang])) {
    const text = String(typeof value === 'function' ? value('Ada', 'Night') : value);
    for (const banned of bannedCopy) {
      assert(!text.toLowerCase().includes(banned.toLowerCase()), `UI.${lang}.${key} contains "${banned}"`);
    }
  }
}

const ambient = fs.readFileSync(path.join(root, 'lib/ambient.js'), 'utf8');
assert(ambient.includes('prefers-reduced-motion'), 'ambient must respect reduced motion');
assert(ambient.includes('destroyHomeAmbient'), 'ambient must export destroy');
assert(ambient.includes('runGalleryTransition'), 'ambient must export transition');

for (const artwork of hiddenArtworks) {
  assert(artwork.unlock && Object.keys(artwork.unlock).length >= 3, `${artwork.id} unlock depth`);
  assert(!('tempo' in artwork.unlock), `${artwork.id} unlock still uses legacy ninth value`);
}

if (failures.length) {
  console.log('---');
  console.log(`FAIL: ${failures.length}`);
  failures.forEach((item) => console.log(`- ${item}`));
  process.exit(1);
}

console.log('PASS: deterministic eight-dimensional scoring checks');
