import { DIMENSIONS, TEMPO_DIMENSION, artworks } from '../data/artworks.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const QUICK_REFERENCE_MS = 1200;
const SLOW_REFERENCE_MS = 15000;
const MAX_RESPONSE_MS = 45000;
const TEMPO_WEIGHT = 0.58;
const DIMENSION_WEIGHTS = [1.05, 0.92, 1.18, 1.14, 0.88, 1.02, 0.96, 1.08];

function median(values) {
  if (!values.length) {
    return 0;
  }

  const middle = Math.floor(values.length / 2);

  return values.length % 2
    ? values[middle]
    : (values[middle - 1] + values[middle]) / 2;
}

export function buildTempoScore(responseTimes = {}) {
  const values = Object.values(responseTimes)
    .filter((value) => Number.isFinite(value))
    .map((value) => clamp(value, 450, MAX_RESPONSE_MS))
    .sort((a, b) => a - b);

  if (!values.length) {
    return 50;
  }

  const trimCount = values.length >= 20 ? Math.floor(values.length * 0.1) : 0;
  const trimmed = trimCount > 0 ? values.slice(trimCount, -trimCount) : values;
  const typicalTime = median(trimmed);

  const numerator = Math.log(typicalTime) - Math.log(QUICK_REFERENCE_MS);
  const denominator = Math.log(SLOW_REFERENCE_MS) - Math.log(QUICK_REFERENCE_MS);

  return clamp(Math.round((numerator / denominator) * 100), 0, 100);
}

export function tempoForArtwork(artwork) {
  const [inner, structure, intensity, , , novelty, agency] = artwork.profile;

  return clamp(
    Math.round(
      inner * 0.28 +
        structure * 0.26 +
        intensity * 0.16 +
        (100 - novelty) * 0.12 +
        (100 - agency) * 0.18
    ),
    0,
    100
  );
}

export function buildProfile(answers, questions, responseTimes = {}) {
  const buckets = Object.fromEntries(DIMENSIONS.map(({ key }) => [key, []]));

  questions.forEach((question) => {
    const value = answers[question.id];
    if (typeof value === 'number') {
      buckets[question.dimension].push(value);
    }
  });

  const profile = {};

  DIMENSIONS.forEach(({ key }) => {
    const values = buckets[key];
    profile[key] = values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 50;
  });

  profile.tempo = buildTempoScore(responseTimes);
  return profile;
}

function hiddenUnlocked(artwork, profile) {
  if (!artwork.hidden) {
    return true;
  }

  if (!artwork.unlock) {
    return false;
  }

  return Object.entries(artwork.unlock).every(([key, [min, max]]) => {
    const value = profile[key];
    return value >= min && value <= max;
  });
}

function weightedDistance(artwork, profile) {
  const sum = DIMENSIONS.reduce((total, { key }, index) => {
    const diff = profile[key] - artwork.profile[index];
    return total + DIMENSION_WEIGHTS[index] * diff * diff;
  }, 0);

  const tempoTarget = tempoForArtwork(artwork);
  const tempoDiff = profile.tempo - tempoTarget;
  const tempoPart = TEMPO_WEIGHT * tempoDiff * tempoDiff;
  const weightTotal =
    DIMENSION_WEIGHTS.reduce((a, b) => a + b, 0) + TEMPO_WEIGHT;

  return Math.sqrt((sum + tempoPart) / weightTotal);
}

function rawMatchFromDistance(distance) {
  const closeness = clamp(1 - distance / 100, 0, 1);
  return Math.round(76 + closeness * 22);
}

function assignDisplayMatches(ranked) {
  if (!ranked.length) {
    return [];
  }

  const primaryDistance = ranked[0].distance;
  const primaryMatch = rawMatchFromDistance(primaryDistance);
  let previousMatch = primaryMatch;

  return ranked.map((item, index) => {
    const rawMatch = rawMatchFromDistance(item.distance);

    if (index === 0) {
      previousMatch = rawMatch;
      return {
        ...item,
        match: rawMatch,
      };
    }

    const distanceGap = Math.max(0, item.distance - primaryDistance);
    const penalty = Math.max(index * 2, Math.round(2 + distanceGap * 0.65));
    const candidate = Math.round(primaryMatch - penalty);
    const match = clamp(
      Math.min(rawMatch, candidate, previousMatch - 1),
      60,
      primaryMatch - 1
    );

    previousMatch = match;

    return {
      ...item,
      match,
    };
  });
}

export function scoreArtworks(profile) {
  const eligible = artworks.filter((artwork) => hiddenUnlocked(artwork, profile));

  const ranked = eligible
    .map((artwork) => ({
      artwork,
      distance: weightedDistance(artwork, profile),
    }))
    .sort((a, b) => a.distance - b.distance);

  return assignDisplayMatches(ranked);
}

export function rankArtworksForProfile(profile) {
  return scoreArtworks(profile);
}

export function getResult(answers, questions, responseTimes = {}) {
  const profile = buildProfile(answers, questions, responseTimes);
  const ranked = scoreArtworks(profile);

  return {
    profile,
    primary: ranked[0],
    companions: ranked.slice(1, 4),
    unlockedHidden: ranked.filter(({ artwork }) => artwork.hidden),
  };
}

export function profileForArtwork(artwork) {
  const profile = Object.fromEntries(
    DIMENSIONS.map(({ key }, index) => [key, artwork.profile[index]])
  );
  profile.tempo = tempoForArtwork(artwork);
  return profile;
}

export function strongestDimensions(profile, count = 3) {
  return DIMENSIONS.map((dimension) => ({
    ...dimension,
    value: Math.round(profile[dimension.key]),
    strength: Math.abs(profile[dimension.key] - 50),
  }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, count);
}

export function spectrumDimensions() {
  return [...DIMENSIONS, TEMPO_DIMENSION];
}

export { clamp, weightedDistance, assignDisplayMatches, rawMatchFromDistance };
