import { artworks, visibleArtworks, hiddenArtworks, DIMENSIONS } from '../data/artworks.js';
import { questions } from '../data/questions.js';
import {
  buildProfile,
  getResult,
  scoreArtworks,
  similarityFromDistance,
  RESPONSE_POINTS,
} from '../lib/scoring.js';

const failures = [];
const SIMULATIONS = 80000;

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function randomAnswers() {
  const answers = {};
  for (const question of questions) {
    const option = question.options[Math.floor(Math.random() * question.options.length)];
    answers[question.id] = option.value;
  }
  return answers;
}

function averageCombos() {
  const map = new Map();
  for (const a of RESPONSE_POINTS) {
    for (const b of RESPONSE_POINTS) {
      for (const c of RESPONSE_POINTS) {
        for (const d of RESPONSE_POINTS) {
          const combo = [a, b, c, d];
          const avg = combo.reduce((sum, value) => sum + value, 0) / 4;
          const key = avg.toFixed(10);
          if (!map.has(key)) map.set(key, combo);
        }
      }
    }
  }
  return map;
}

const AVG_COMBOS = averageCombos();

function answersForArtwork(artwork) {
  const answers = {};
  const byDimension = Object.fromEntries(DIMENSIONS.map(({ key }) => [key, []]));
  for (const question of questions) {
    byDimension[question.dimension].push(question);
  }

  DIMENSIONS.forEach(({ key }, index) => {
    const target = artwork.profile[index];
    let combo = AVG_COMBOS.get(Number(target).toFixed(10));
    if (!combo) {
      let bestKey = null;
      let bestDist = Infinity;
      for (const avgKey of AVG_COMBOS.keys()) {
        const dist = Math.abs(Number(avgKey) - target);
        if (dist < bestDist) {
          bestDist = dist;
          bestKey = avgKey;
        }
      }
      combo = AVG_COMBOS.get(bestKey);
    }

    byDimension[key].forEach((question, questionIndex) => {
      const point = combo[questionIndex];
      const optionIndex = RESPONSE_POINTS.findIndex((value) => Math.abs(value - point) < 1e-9);
      answers[question.id] = question.options[optionIndex].value;
    });
  });

  return answers;
}

console.log('Soul Gallery result reachability audit');

assert(visibleArtworks.length === 108, `visible count ${visibleArtworks.length}`);
assert(hiddenArtworks.length === 6, `hidden count ${hiddenArtworks.length}`);
assert(artworks.length === 114, `total count ${artworks.length}`);
assert(DIMENSIONS.length === 8, `dimension count ${DIMENSIONS.length}`);

const profileKeys = new Set();
for (const artwork of artworks) {
  assert(Array.isArray(artwork.profile) && artwork.profile.length === 8, `${artwork.id} profile length`);
  assert(
    artwork.profile.every((value) => Number.isFinite(value) && value >= 0 && value <= 100),
    `${artwork.id} profile bounds`
  );
  const key = artwork.profile.join(',');
  assert(!profileKeys.has(key), `duplicate profile ${artwork.id}`);
  profileKeys.add(key);
}

const constructiveMisses = [];
for (const artwork of visibleArtworks) {
  const result = getResult(answersForArtwork(artwork), questions);
  if (result.primary?.artwork?.id !== artwork.id) {
    constructiveMisses.push(`${artwork.id}->${result.primary?.artwork?.id}`);
  }
}
assert(
  constructiveMisses.length === 0,
  `Constructively unreachable public artworks: ${constructiveMisses.join(', ')}`
);
console.log('Constructive reachability: 108/108 public artworks can rank first');

const wins = Object.fromEntries(visibleArtworks.map((item) => [item.id, 0]));
let rankingErrors = 0;
let similarityErrors = 0;

for (let i = 0; i < SIMULATIONS; i += 1) {
  const result = getResult(randomAnswers(), questions);
  const id = result.primary?.artwork?.id;
  if (id && Object.prototype.hasOwnProperty.call(wins, id)) {
    wins[id] += 1;
  }

  const sequence = [result.primary, ...(result.companions || [])];
  for (let index = 1; index < sequence.length; index += 1) {
    if (sequence[index].distance + 1e-12 < sequence[index - 1].distance) {
      rankingErrors += 1;
    }
  }

  for (const item of sequence) {
    const expected = similarityFromDistance(item.distance);
    if (Math.abs(item.match - expected) > 1e-9) {
      similarityErrors += 1;
    }
  }
}

assert(rankingErrors === 0, `distance ranking errors: ${rankingErrors}`);
assert(similarityErrors === 0, `similarity mapping errors: ${similarityErrors}`);
console.log('Companion ranking follows true distance; similarity follows 100 - RMSE');
console.log(`Random simulations: ${SIMULATIONS}`);

for (const artwork of hiddenArtworks) {
  assert(artwork.unlock && Object.keys(artwork.unlock).length >= 3, `${artwork.id} unlock depth`);
  assert(!('tempo' in artwork.unlock), `${artwork.id} still unlocks on legacy ninth value`);

  const profile = Object.fromEntries(DIMENSIONS.map(({ key }) => [key, 50]));
  for (const [key, [min, max]] of Object.entries(artwork.unlock)) {
    profile[key] = (min + max) / 2;
  }
  DIMENSIONS.forEach(({ key }, index) => {
    if (!(key in artwork.unlock)) {
      profile[key] = artwork.profile[index];
    }
  });

  const ranked = scoreArtworks(profile);
  const unlocked = ranked.some((item) => item.artwork.id === artwork.id);
  assert(unlocked, `Hidden artwork not unlockable: ${artwork.id}`);
  console.log(`Hidden unlock OK: ${artwork.id}`);
}

const sameAnswers = randomAnswers();
const a = getResult(sameAnswers, questions);
const b = getResult(sameAnswers, questions);
assert(a.primary.artwork.id === b.primary.artwork.id, 'identical answers must match');
assert(Math.abs(a.primary.distance - b.primary.distance) < 1e-12, 'identical answers must keep distance');

let forcedSame = 0;
for (let i = 0; i < 100; i += 1) {
  const low = Object.fromEntries(questions.map((q) => [q.id, q.options[0].value]));
  const high = Object.fromEntries(questions.map((q) => [q.id, q.options[3].value]));
  if (getResult(low, questions).primary.artwork.id === getResult(high, questions).primary.artwork.id) {
    forcedSame += 1;
  }
}
console.log(`Extreme opposite answer same primary: ${forcedSame}/100`);
assert(forcedSame < 20, 'Opposite extremes collapse too often');

const sampleProfile = buildProfile(sameAnswers, questions);
assert(Object.keys(sampleProfile).length === 8, 'profile must contain 8 dimensions');
assert(!('tempo' in sampleProfile), 'profile must not contain tempo');

if (failures.length) {
  console.log('---');
  console.log(`FAIL: ${failures.length}`);
  failures.forEach((item) => console.log(`- ${item}`));
  process.exit(1);
}

console.log('PASS: result reachability and equal-weight scoring checks');
