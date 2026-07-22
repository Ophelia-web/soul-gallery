import { DIMENSIONS, artworks } from '../data/artworks.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function buildProfile(answers, questions) {
  const buckets = Object.fromEntries(DIMENSIONS.map(({ key }) => [key, []]));

  questions.forEach((question) => {
    const value = answers[question.id];
    if (typeof value === 'number') buckets[question.dimension].push(value);
  });

  const profile = {};
  DIMENSIONS.forEach(({ key }) => {
    const values = buckets[key];
    profile[key] = values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 50;
  });

  return profile;
}

function hiddenUnlocked(artwork, profile) {
  if (!artwork.hidden) return true;
  if (!artwork.unlock) return false;

  return Object.entries(artwork.unlock).every(([key, [min, max]]) => {
    const value = profile[key];
    return value >= min && value <= max;
  });
}

function weightedDistance(artwork, profile) {
  const weights = [1.05, 0.92, 1.18, 1.14, 0.88, 1.02, 0.96, 1.08];
  const sum = DIMENSIONS.reduce((total, { key }, index) => {
    const diff = profile[key] - artwork.profile[index];
    return total + weights[index] * diff * diff;
  }, 0);

  return Math.sqrt(sum / weights.reduce((a, b) => a + b, 0));
}

export function scoreArtworks(profile) {
  const eligible = artworks.filter((artwork) => hiddenUnlocked(artwork, profile));

  const ranked = eligible
    .map((artwork) => {
      const distance = weightedDistance(artwork, profile);
      const closeness = clamp(1 - distance / 100, 0, 1);
      const match = Math.round(76 + closeness * 22);
      return { artwork, distance, match };
    })
    .sort((a, b) => a.distance - b.distance);

  return ranked;
}

export function getResult(answers, questions) {
  const profile = buildProfile(answers, questions);
  const ranked = scoreArtworks(profile);
  return {
    profile,
    primary: ranked[0],
    companions: ranked.slice(1, 4),
    unlockedHidden: ranked.filter(({ artwork }) => artwork.hidden),
  };
}

export function profileForArtwork(artwork) {
  return Object.fromEntries(
    DIMENSIONS.map(({ key }, index) => [key, artwork.profile[index]])
  );
}

export function strongestDimensions(profile, count = 3) {
  return DIMENSIONS
    .map((dimension) => ({
      ...dimension,
      value: Math.round(profile[dimension.key]),
      strength: Math.abs(profile[dimension.key] - 50),
    }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, count);
}
