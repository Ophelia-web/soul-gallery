import { artworks, visibleArtworks, hiddenArtworks } from '../data/artworks.js';
import { questions } from '../data/questions.js';
import {
  buildProfile,
  getResult,
  scoreArtworks,
  tempoForArtwork,
} from '../lib/scoring.js';

const failures = [];
const SIMULATIONS = 220000;

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

function randomTimes(scale = 1) {
  const times = {};
  for (const question of questions) {
    const base = 700 + Math.random() * 12000 * scale;
    times[question.id] = Math.min(45000, Math.max(450, base));
  }
  return times;
}

function distanceMatrixPairs(limit = 20) {
  const pairs = [];
  for (let i = 0; i < visibleArtworks.length; i += 1) {
    for (let j = i + 1; j < visibleArtworks.length; j += 1) {
      const a = visibleArtworks[i];
      const b = visibleArtworks[j];
      const dist = Math.sqrt(
        a.profile.reduce((sum, value, index) => sum + (value - b.profile[index]) ** 2, 0) /
          a.profile.length
      );
      pairs.push({ a: a.id, b: b.id, dist });
    }
  }
  return pairs.sort((x, y) => x.dist - y.dist).slice(0, limit);
}

console.log('Soul Gallery result reachability audit');

assert(visibleArtworks.length === 108, `visible count ${visibleArtworks.length}`);
assert(hiddenArtworks.length === 12, `hidden count ${hiddenArtworks.length}`);

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

console.log('Closest profile pairs:');
for (const pair of distanceMatrixPairs(20)) {
  console.log(`- ${pair.a} ↔ ${pair.b}: ${pair.dist.toFixed(3)}`);
}

const wins = Object.fromEntries(visibleArtworks.map((item) => [item.id, 0]));

for (let i = 0; i < SIMULATIONS; i += 1) {
  const result = getResult(randomAnswers(), questions, randomTimes());
  const id = result.primary?.artwork?.id;
  if (id && Object.prototype.hasOwnProperty.call(wins, id)) {
    wins[id] += 1;
  }
}

const unreachable = Object.entries(wins)
  .filter(([, count]) => count === 0)
  .map(([id]) => id);

console.log(`Simulations: ${SIMULATIONS}`);
console.log(`Unreachable public artworks: ${unreachable.length}`);
if (unreachable.length) {
  console.log(unreachable.join(', '));
}
assert(unreachable.length === 0, `Unreachable public artworks: ${unreachable.join(', ')}`);

for (const artwork of hiddenArtworks) {
  assert(artwork.unlock && Object.keys(artwork.unlock).length >= 3, `${artwork.id} unlock depth`);

  const profile = Object.fromEntries(
    [
      'inner',
      'structure',
      'intensity',
      'idealism',
      'connection',
      'novelty',
      'agency',
      'brightness',
      'tempo',
    ].map((key) => [key, 50])
  );

  for (const [key, [min, max]] of Object.entries(artwork.unlock)) {
    profile[key] = (min + max) / 2;
  }

  // Fill remaining dimensions toward artwork profile for competitiveness
  const dimKeys = [
    'inner',
    'structure',
    'intensity',
    'idealism',
    'connection',
    'novelty',
    'agency',
    'brightness',
  ];
  dimKeys.forEach((key, index) => {
    if (!(key in artwork.unlock)) {
      profile[key] = artwork.profile[index];
    }
  });
  if (!('tempo' in artwork.unlock)) {
    profile.tempo = tempoForArtwork(artwork);
  }

  const ranked = scoreArtworks(profile);
  const unlocked = ranked.some((item) => item.artwork.id === artwork.id);
  assert(unlocked, `Hidden artwork not unlockable: ${artwork.id}`);
  console.log(`Hidden unlock OK: ${artwork.id}`);
}

// Tempo influence check on near-tied answers
let tempoChanged = 0;
let identicalPrimaryAcrossOppositeAnswers = 0;

for (let i = 0; i < 400; i += 1) {
  const answersA = randomAnswers();
  const answersB = randomAnswers();
  const fast = getResult(answersA, questions, randomTimes(0.25));
  const slow = getResult(answersA, questions, randomTimes(2.2));
  if (fast.primary.artwork.id !== slow.primary.artwork.id || Math.abs(fast.primary.distance - slow.primary.distance) > 0.0001) {
    tempoChanged += 1;
  }

  const other = getResult(answersB, questions, randomTimes());
  if (
    JSON.stringify(answersA) !== JSON.stringify(answersB) &&
    other.primary.artwork.id === fast.primary.artwork.id &&
    Math.abs(buildProfile(answersA, questions).inner - buildProfile(answersB, questions).inner) > 25
  ) {
    // not a failure by itself; tracked for reporting
    identicalPrimaryAcrossOppositeAnswers += 1;
  }
}

console.log(`Tempo altered ranking/distance in ${tempoChanged}/400 paired runs`);
assert(tempoChanged > 0, 'Tempo factor never altered ranking/distance');

// Ensure opposite answer sets are not forced equal by tempo alone
let forcedSame = 0;
for (let i = 0; i < 100; i += 1) {
  const low = Object.fromEntries(questions.map((q) => [q.id, q.options[0].value]));
  const high = Object.fromEntries(questions.map((q) => [q.id, q.options[3].value]));
  const a = getResult(low, questions, randomTimes(0.2));
  const b = getResult(high, questions, randomTimes(3));
  if (a.primary.artwork.id === b.primary.artwork.id) forcedSame += 1;
}
console.log(`Extreme opposite answer same primary: ${forcedSame}/100`);
assert(forcedSame < 20, 'Tempo appears to collapse very different answers too often');

if (failures.length) {
  console.log('---');
  console.log(`FAIL: ${failures.length}`);
  failures.forEach((item) => console.log(`- ${item}`));
  process.exit(1);
}

console.log('PASS: result reachability and tempo influence checks');
