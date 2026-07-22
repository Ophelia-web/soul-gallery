const memoryCache = new Map();
const CACHE_PREFIX = 'soul-gallery:image:';

function readCache(query) {
  if (memoryCache.has(query)) return memoryCache.get(query);
  try {
    const stored = sessionStorage.getItem(`${CACHE_PREFIX}${query}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      memoryCache.set(query, parsed);
      return parsed;
    }
  } catch {
    // Ignore unavailable storage.
  }
  return null;
}

function writeCache(query, value) {
  memoryCache.set(query, value);
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${query}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota or privacy-mode failures.
  }
}

export async function resolveCommonsImage(query, width = 1600) {
  const cached = readCache(query);
  if (cached) return cached;

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '8',
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    iiurlwidth: String(width),
    format: 'json',
    origin: '*',
  });

  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  if (!response.ok) throw new Error(`Wikimedia request failed: ${response.status}`);

  const data = await response.json();
  const pages = Object.values(data?.query?.pages || {})
    .filter((page) => page.imageinfo?.[0]?.mime?.startsWith('image/'))
    .sort((a, b) => {
      const relevance = (a.index ?? 999) - (b.index ?? 999);
      if (relevance !== 0) return relevance;
      const aInfo = a.imageinfo[0];
      const bInfo = b.imageinfo[0];
      const aScore = (aInfo.width || 0) * (aInfo.height || 0);
      const bScore = (bInfo.width || 0) * (bInfo.height || 0);
      return bScore - aScore;
    });

  const page = pages[0];
  if (!page) throw new Error('No Wikimedia Commons image found');

  const info = page.imageinfo[0];
  const result = {
    src: info.thumburl || info.url,
    original: info.url,
    source: info.descriptionurl,
    title: page.title.replace(/^File:/, ''),
  };
  writeCache(query, result);
  return result;
}

export function hydrateArtworkImages(root = document) {
  const nodes = [...root.querySelectorAll('[data-art-image]')];
  if (!nodes.length) return;

  const load = async (element) => {
    if (element.dataset.loaded === 'true') return;
    element.dataset.loaded = 'true';
    const query = element.dataset.query;
    const width = Number(element.dataset.width || 1200);

    try {
      const image = await resolveCommonsImage(query, width);
      const img = element.querySelector('img');
      if (!img) return;
      img.src = image.src;
      img.alt = element.dataset.alt || image.title;
      img.addEventListener('load', () => element.classList.add('is-loaded'), { once: true });
      element.dataset.source = image.source || '';
      element.dataset.original = image.original || '';
    } catch (error) {
      element.classList.add('image-failed');
      element.dataset.error = error.message;
    }
  };

  if (!('IntersectionObserver' in window)) {
    nodes.forEach(load);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      load(entry.target);
    });
  }, { rootMargin: '300px 0px' });

  nodes.forEach((node) => observer.observe(node));
}
