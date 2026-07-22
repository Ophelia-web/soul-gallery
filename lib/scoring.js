import { DIMENSIONS, artworks } from '../data/artworks.js';

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const RESPONSE_POINTS = [0, 100 / 3, 200 / 3, 100];

function scoreQuestionAnswer(question, answer) {
  const optionIndex = question.options.findIndex(
    (option) => Number(option.value) === Number(answer)
  );

  if (optionIndex < 0) {
    return null;
  }

  return RESPONSE_POINTS[optionIndex];
}

export function buildProfile(answers, questions) {
  const buckets = Object.fromEntries(DIMENSIONS.map(({ key }) => [key, []]));

  for (const question of questions) {
    const score = scoreQuestionAnswer(question, answers[question.id]);

    if (Number.isFinite(score) && buckets[question.dimension]) {
      buckets[question.dimension].push(score);
    }
  }

  return Object.fromEntries(
    DIMENSIONS.map(({ key }) => {
      const values = buckets[key];
      const average = values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 50;

      return [key, clamp(average, 0, 100)];
    })
  );
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

export function profileDistance(artwork, profile) {
  const meanSquaredDifference =
    DIMENSIONS.reduce((total, { key }, index) => {
      const difference = profile[key] - artwork.profile[index];
      return total + difference * difference;
    }, 0) / DIMENSIONS.length;

  return Math.sqrt(meanSquaredDifference);
}

export function similarityFromDistance(distance) {
  return Math.round(clamp(100 - distance, 0, 100) * 10) / 10;
}

export function assignDisplayMatches(ranked) {
  return ranked.map((item) => ({
    ...item,
    match: similarityFromDistance(item.distance),
  }));
}

export function scoreArtworks(profile) {
  const eligible = artworks.filter((artwork) => hiddenUnlocked(artwork, profile));

  const ranked = eligible
    .map((artwork) => ({
      artwork,
      distance: profileDistance(artwork, profile),
    }))
    .sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }

      return a.artwork.id.localeCompare(b.artwork.id);
    });

  return assignDisplayMatches(ranked);
}

export function rankArtworksForProfile(profile) {
  return scoreArtworks(profile);
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
  return DIMENSIONS.map((dimension) => ({
    ...dimension,
    value: Math.round(profile[dimension.key]),
    strength: Math.abs(profile[dimension.key] - 50),
  }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, count);
}

export function spectrumDimensions() {
  return [...DIMENSIONS];
}

export { profileDistance as weightedDistance, scoreQuestionAnswer, RESPONSE_POINTS };
