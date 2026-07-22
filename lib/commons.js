const memoryCache = new Map();
const CACHE_PREFIX = 'soul-gallery:image:v2:';

const MIN_ASPECT_RATIO = 0.55;
const MAX_ASPECT_RATIO = 1.95;
const MIN_LONG_EDGE = 1200;
const MIN_SHORT_EDGE = 700;
const MAX_CONCURRENT = 4;

const requestQueue = [];
let activeRequests = 0;

function normalizeFileTitle(fileTitle) {
  const trimmed = String(fileTitle || '').trim();

  if (!trimmed) {
    throw new Error('Missing Wikimedia Commons file title');
  }

  return trimmed.startsWith('File:') ? trimmed : `File:${trimmed}`;
}

function cacheKey(fileTitle, width) {
  return `${normalizeFileTitle(fileTitle)}:${width}`;
}

function readCache(fileTitle, width) {
  const key = cacheKey(fileTitle, width);

  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  try {
    const stored = sessionStorage.getItem(`${CACHE_PREFIX}${key}`);

    if (stored) {
      const parsed = JSON.parse(stored);
      memoryCache.set(key, parsed);
      return parsed;
    }
  } catch {
    // Storage may be unavailable in privacy mode.
  }

  return null;
}

function writeCache(fileTitle, width, value) {
  const key = cacheKey(fileTitle, width);
  memoryCache.set(key, value);

  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
}

function validateImageInfo(fileTitle, info) {
  if (!info?.mime?.startsWith('image/')) {
    throw new Error(`Commons file is not an image: ${fileTitle}`);
  }

  const originalWidth = Number(info.width || 0);
  const originalHeight = Number(info.height || 0);

  if (!originalWidth || !originalHeight) {
    throw new Error(`Commons file has no valid dimensions: ${fileTitle}`);
  }

  const longEdge = Math.max(originalWidth, originalHeight);
  const shortEdge = Math.min(originalWidth, originalHeight);
  const aspectRatio = originalWidth / originalHeight;

  if (longEdge < MIN_LONG_EDGE || shortEdge < MIN_SHORT_EDGE) {
    throw new Error(
      `Commons image is too small: ${fileTitle} (${originalWidth}×${originalHeight})`
    );
  }

  if (aspectRatio < MIN_ASPECT_RATIO || aspectRatio > MAX_ASPECT_RATIO) {
    throw new Error(
      `Commons image aspect ratio is outside the accepted range: ${fileTitle} (${aspectRatio.toFixed(2)})`
    );
  }

  return {
    originalWidth,
    originalHeight,
    aspectRatio,
  };
}

function enqueueRequest(task) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ task, resolve, reject });
    pumpQueue();
  });
}

function pumpQueue() {
  while (activeRequests < MAX_CONCURRENT && requestQueue.length) {
    const { task, resolve, reject } = requestQueue.shift();
    activeRequests += 1;

    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        activeRequests -= 1;
        pumpQueue();
      });
  }
}

export function applyArtworkGeometry(element, image) {
  const width = Number(image.width);
  const height = Number(image.height);

  if (!width || !height) {
    return;
  }

  const ratio = width / height;

  element.style.setProperty('--image-ratio', `${width} / ${height}`);
  element.dataset.imageWidth = String(width);
  element.dataset.imageHeight = String(height);
  element.dataset.imageRatio = ratio.toFixed(4);

  let orientation = 'square';

  if (ratio >= 1.18) {
    orientation = 'landscape';
  } else if (ratio <= 0.84) {
    orientation = 'portrait';
  }

  element.dataset.orientation = orientation;
  element.classList.add(`art-image--${orientation}`);

  const frame = element.closest('.ornate-frame');

  if (frame) {
    frame.classList.remove(
      'ornate-frame--landscape',
      'ornate-frame--portrait',
      'ornate-frame--square'
    );

    frame.classList.add(`ornate-frame--${orientation}`);
  }
}

async function fetchCommonsImage(fileTitle, width = 1600) {
  const normalizedTitle = normalizeFileTitle(fileTitle);

  const params = new URLSearchParams({
    action: 'query',
    titles: normalizedTitle,
    redirects: '1',
    prop: 'imageinfo',
    iiprop: 'url|mime|size|extmetadata',
    iiurlwidth: String(width),
    format: 'json',
    formatversion: '2',
    origin: '*',
  });

  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Wikimedia request failed: ${response.status}`);
  }

  const data = await response.json();
  const page = data?.query?.pages?.[0];

  if (!page || page.missing || !page.imageinfo?.[0]) {
    throw new Error(`Exact Wikimedia Commons file was not found: ${normalizedTitle}`);
  }

  const info = page.imageinfo[0];
  const dimensions = validateImageInfo(normalizedTitle, info);

  return {
    src: info.thumburl || info.url,
    original: info.url,
    source: info.descriptionurl,
    title: page.title.replace(/^File:/, ''),
    width: dimensions.originalWidth,
    height: dimensions.originalHeight,
    aspectRatio: dimensions.aspectRatio,
  };
}

export async function resolveCommonsImage(fileTitle, width = 1600) {
  const cached = readCache(fileTitle, width);

  if (cached) {
    return cached;
  }

  const result = await enqueueRequest(() => fetchCommonsImage(fileTitle, width));
  writeCache(fileTitle, width, result);
  return result;
}

export function hydrateArtworkImages(root = document) {
  const nodes = [...root.querySelectorAll('[data-art-image]')].filter(
    (node) => node.dataset.imageObserved !== 'true' && node.dataset.loaded !== 'true'
  );

  if (!nodes.length) {
    return;
  }

  nodes.forEach((node) => {
    node.dataset.imageObserved = 'true';
  });

  const load = async (element) => {
    if (element.dataset.loaded === 'true') {
      return;
    }

    element.dataset.loaded = 'true';

    const fileTitle = element.dataset.file;
    const width = Number(element.dataset.width || 1200);
    const img = element.querySelector('img');

    if (!img) {
      return;
    }

    try {
      const image = await resolveCommonsImage(fileTitle, width);

      applyArtworkGeometry(element, image);

      img.src = image.src;
      img.alt = element.dataset.alt || image.title;

      img.addEventListener(
        'load',
        () => {
          element.classList.add('is-loaded');
        },
        { once: true }
      );

      img.addEventListener(
        'error',
        () => {
          element.classList.remove('is-loaded');
          element.classList.add('image-failed');
          element.dataset.error = 'The verified image URL could not be loaded';
        },
        { once: true }
      );

      element.dataset.source = image.source || '';
      element.dataset.original = image.original || '';
      element.dataset.aspectRatio = String(image.aspectRatio);
    } catch (error) {
      element.classList.add('image-failed');
      element.dataset.error =
        error instanceof Error ? error.message : 'Unknown image error';

      console.error('[Soul Gallery image error]', {
        fileTitle,
        error,
      });
    }
  };

  if (!('IntersectionObserver' in window)) {
    nodes.forEach(load);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        observer.unobserve(entry.target);
        load(entry.target);
      });
    },
    {
      rootMargin: '300px 0px',
    }
  );

  nodes.forEach((node) => observer.observe(node));
}
