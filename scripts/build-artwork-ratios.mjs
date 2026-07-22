import { writeFileSync } from 'node:fs';
import { artworks } from '../data/artworks.js';

const MAX_CONCURRENT = 4;
const BATCH_SIZE = 20;

function normalizeFileTitle(fileTitle) {
  const trimmed = String(fileTitle || '').trim();
  if (!trimmed) {
    throw new Error('Missing Wikimedia Commons file title');
  }
  return trimmed.startsWith('File:') ? trimmed : `File:${trimmed}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, attempt = 0) {
  const response = await fetch(url);
  const text = await response.text();

  if (response.status === 429 || text.startsWith('You are making too many requests')) {
    if (attempt >= 8) {
      throw new Error('Wikimedia request failed: 429');
    }
    await sleep(3000 * (attempt + 1));
    return fetchJson(url, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`Wikimedia request failed: ${response.status}`);
  }

  return JSON.parse(text);
}

async function fetchImageInfoBatch(fileTitles) {
  const titles = fileTitles.map(normalizeFileTitle).join('|');
  const params = new URLSearchParams({
    action: 'query',
    titles,
    redirects: '1',
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    format: 'json',
    formatversion: '2',
    origin: '*',
  });

  const data = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const pages = data?.query?.pages || [];
  const redirects = new Map((data?.query?.redirects || []).map((item) => [item.from, item.to]));
  const normalized = new Map((data?.query?.normalized || []).map((item) => [item.from, item.to]));
  const map = new Map();

  function resolve(requested) {
    let current = requested;
    if (normalized.has(current)) current = normalized.get(current);
    if (redirects.has(current)) current = redirects.get(current);
    return current;
  }

  for (const requested of fileTitles) {
    const requestedTitle = normalizeFileTitle(requested);
    const resolvedTitle = resolve(requestedTitle);
    const page =
      pages.find((item) => item.title === resolvedTitle) ||
      pages.find((item) => item.title === requestedTitle);

    if (!page || page.missing || !page.imageinfo?.[0]) {
      map.set(requested, {
        error: `Exact Wikimedia Commons file was not found: ${requestedTitle}`,
      });
      continue;
    }

    const info = page.imageinfo[0];
    map.set(requested, {
      width: Number(info.width || 0),
      height: Number(info.height || 0),
    });
  }

  return map;
}

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runner() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await worker(items[current], current);
    }
  }

  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runner()
  );
  await Promise.all(runners);
  return results;
}

console.log('Building artwork ratios from exact Wikimedia Commons files');
console.log(`Artworks: ${artworks.length}`);

if (artworks.length !== 114) {
  console.error(`Expected 114 artworks, found ${artworks.length}`);
  process.exitCode = 1;
}

const batches = [];
for (let index = 0; index < artworks.length; index += BATCH_SIZE) {
  batches.push(artworks.slice(index, index + BATCH_SIZE));
}

const ratioEntries = [];
let failed = 0;

await runPool(
  batches,
  async (batch, batchIndex) => {
    const batchMap = await fetchImageInfoBatch(batch.map((item) => item.commonsFile));

    for (const artwork of batch) {
      const payload = batchMap.get(artwork.commonsFile);

      if (!payload || payload.error || !payload.width || !payload.height) {
        failed += 1;
        console.error(
          `FAIL ${artwork.id}: ${payload?.error || 'missing dimensions'}`
        );
        continue;
      }

      const ratio = Number((payload.width / payload.height).toFixed(4));
      ratioEntries.push({
        id: artwork.id,
        width: payload.width,
        height: payload.height,
        ratio,
      });

      console.log(
        `${artwork.id} | ${payload.width}×${payload.height} | ${ratio}`
      );
    }

    if (batchIndex + 1 < batches.length) {
      await sleep(400);
    }
  },
  MAX_CONCURRENT
);

if (failed || ratioEntries.length !== artworks.length) {
  console.error(
    `Incomplete ratio build: ${ratioEntries.length}/${artworks.length}, failures=${failed}`
  );
  process.exitCode = 1;
  process.exit(1);
}

const byId = Object.fromEntries(
  artworks.map((artwork) => {
    const entry = ratioEntries.find((item) => item.id === artwork.id);
    return [artwork.id, entry.ratio];
  })
);

const lines = [
  'export const ARTWORK_RATIOS = Object.freeze({',
  ...artworks.map((artwork) => `  '${artwork.id}': ${byId[artwork.id]},`),
  '});',
  '',
];

writeFileSync(new URL('../data/artwork-ratios.js', import.meta.url), lines.join('\n'));
console.log('---');
console.log(`Wrote data/artwork-ratios.js with ${artworks.length} ratios`);
