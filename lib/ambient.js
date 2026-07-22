const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isCompactViewport = () => window.matchMedia('(max-width: 760px)').matches;

const canHoverFine = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let ambientState = null;

function clearActiveArtwork(gallery, artworks) {
  artworks.forEach((artwork) => {
    artwork.classList.remove('is-active', 'is-frame-sweeping');
  });

  gallery?.classList.remove('has-active-art');
}

function clearAmbientState() {
  if (!ambientState) {
    return;
  }

  const {
    rafId,
    gallery,
    onPointerMove,
    onPointerLeave,
    onScroll,
    onVisibility,
    onResize,
    arts,
    hoverCleanups,
  } = ambientState;

  if (rafId) {
    cancelAnimationFrame(rafId);
  }

  if (gallery && onPointerMove) {
    gallery.removeEventListener('pointermove', onPointerMove);
  }

  if (gallery && onPointerLeave) {
    gallery.removeEventListener('pointerleave', onPointerLeave);
  }

  if (onScroll) {
    window.removeEventListener('scroll', onScroll);
  }

  if (onVisibility) {
    document.removeEventListener('visibilitychange', onVisibility);
  }

  if (onResize) {
    window.removeEventListener('resize', onResize);
  }

  hoverCleanups?.forEach((cleanup) => cleanup());
  clearActiveArtwork(gallery, arts || []);

  arts?.forEach((art) => {
    art.style.removeProperty('--parallax-x');
    art.style.removeProperty('--parallax-y');
    art.style.removeProperty('--parallax-r');
    art.style.removeProperty('--shadow-x');
    art.style.removeProperty('--shadow-y');
  });

  ambientState = null;
}

export function destroyHomeAmbient() {
  clearAmbientState();
}

function createDust(container, count) {
  container.replaceChildren();

  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement('span');
    const size = 1 + Math.random() * 2;
    particle.style.setProperty('--dust-x', `${8 + Math.random() * 36}%`);
    particle.style.setProperty('--dust-y', `${10 + Math.random() * 48}%`);
    particle.style.setProperty('--dust-size', `${size}px`);
    particle.style.setProperty('--dust-opacity', `${0.04 + Math.random() * 0.11}`);
    particle.style.setProperty('--dust-duration', `${14 + Math.random() * 14}s`);
    particle.style.setProperty('--dust-delay', `${-Math.random() * 18}s`);
    particle.style.setProperty('--dust-drift-x', `${-18 + Math.random() * 36}px`);
    particle.style.setProperty('--dust-drift-y', `${-28 + Math.random() * 40}px`);
    container.appendChild(particle);
  }
}

function parallaxMaxShift(depth) {
  if (depth >= 0.9) {
    return 5;
  }

  if (depth >= 0.65) {
    return 3;
  }

  return 2;
}

function bindArtworkHover(gallery, artworks) {
  const cleanups = [];

  artworks.forEach((artwork) => {
    let hovering = false;

    const handleEnter = () => {
      artworks.forEach((item) => {
        if (item !== artwork) {
          item.classList.remove('is-active', 'is-frame-sweeping');
        }
      });

      artwork.classList.add('is-active');
      gallery.classList.add('has-active-art');

      if (!hovering) {
        hovering = true;
        artwork.classList.remove('is-frame-sweeping');
        void artwork.offsetWidth;
        artwork.classList.add('is-frame-sweeping');
      }
    };

    const handleLeave = () => {
      hovering = false;
      artwork.classList.remove('is-active');

      if (!gallery.querySelector('.hero-art.is-active')) {
        gallery.classList.remove('has-active-art');
      }
    };

    const handleSweepEnd = (event) => {
      if (event.animationName === 'frame-sweep') {
        artwork.classList.remove('is-frame-sweeping');
      }
    };

    artwork.addEventListener('pointerenter', handleEnter);
    artwork.addEventListener('pointerleave', handleLeave);
    artwork.addEventListener('animationend', handleSweepEnd);

    cleanups.push(() => {
      artwork.removeEventListener('pointerenter', handleEnter);
      artwork.removeEventListener('pointerleave', handleLeave);
      artwork.removeEventListener('animationend', handleSweepEnd);
    });
  });

  const handleGalleryLeave = () => {
    clearActiveArtwork(gallery, artworks);
  };

  gallery.addEventListener('pointerleave', handleGalleryLeave);
  cleanups.push(() => {
    gallery.removeEventListener('pointerleave', handleGalleryLeave);
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    clearActiveArtwork(gallery, artworks);
  };
}

export function initHomeAmbient(root) {
  destroyHomeAmbient();

  if (!root) {
    return;
  }

  const reduced = prefersReducedMotion();
  const compact = isCompactViewport();
  const finePointer = canHoverFine();

  const dustHost = root.querySelector('.ambient-dust');
  const glow = root.querySelector('.gallery-cursor-glow');
  const gallery = root.querySelector('[data-hero-gallery]');
  const arts = [...root.querySelectorAll('.hero-art')];

  if (!reduced && dustHost) {
    createDust(dustHost, compact ? 5 : 12);
  }

  if (!reduced) {
    root.classList.add('is-entering');
    window.setTimeout(() => {
      root.classList.remove('is-entering');
      root.classList.add('is-entered');
    }, 1800);
  } else {
    root.classList.add('is-entered');
  }

  const state = {
    root,
    gallery,
    arts,
    rafId: 0,
    running: false,
    pointerInside: false,
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    glowOpacity: 0,
    targetGlowOpacity: 0,
    parallaxNX: 0,
    parallaxNY: 0,
    targetNX: 0,
    targetNY: 0,
    onPointerMove: null,
    onPointerLeave: null,
    onScroll: null,
    onVisibility: null,
    onResize: null,
    hoverCleanups: [],
  };

  ambientState = state;

  const applyParallax = () => {
    arts.forEach((art) => {
      const depth = Number(art.style.getPropertyValue('--depth') || art.dataset.depth || 0.5);
      const maxShift = parallaxMaxShift(depth);
      const x = state.parallaxNX * maxShift;
      const y = state.parallaxNY * maxShift;
      const r = state.parallaxNX * 0.8 * Math.min(depth, 1);
      art.style.setProperty('--parallax-x', `${x.toFixed(2)}px`);
      art.style.setProperty('--parallax-y', `${y.toFixed(2)}px`);
      art.style.setProperty('--parallax-r', `${r.toFixed(3)}deg`);
      art.style.setProperty('--shadow-x', `${(x * 1.7).toFixed(2)}px`);
      art.style.setProperty('--shadow-y', `${(24 + y * 1.8).toFixed(2)}px`);
    });
  };

  const tick = () => {
    if (!ambientState || ambientState !== state) {
      return;
    }

    if (document.hidden) {
      state.running = false;
      state.rafId = 0;
      return;
    }

    state.currentX += (state.targetX - state.currentX) * 0.08;
    state.currentY += (state.targetY - state.currentY) * 0.08;
    state.glowOpacity += (state.targetGlowOpacity - state.glowOpacity) * 0.08;
    state.parallaxNX += (state.targetNX - state.parallaxNX) * 0.08;
    state.parallaxNY += (state.targetNY - state.parallaxNY) * 0.08;

    if (glow && !compact && finePointer) {
      glow.style.transform = `translate3d(${state.currentX}px, ${state.currentY}px, 0) translate(-50%, -50%)`;
      glow.style.opacity = String(state.glowOpacity);
    }

    if (!compact && finePointer && !reduced) {
      applyParallax();
    }

    const stillMoving =
      Math.abs(state.targetX - state.currentX) > 0.15 ||
      Math.abs(state.targetY - state.currentY) > 0.15 ||
      Math.abs(state.targetGlowOpacity - state.glowOpacity) > 0.002 ||
      Math.abs(state.targetNX - state.parallaxNX) > 0.002 ||
      Math.abs(state.targetNY - state.parallaxNY) > 0.002;

    if (stillMoving || state.pointerInside) {
      state.rafId = requestAnimationFrame(tick);
    } else {
      state.running = false;
      state.rafId = 0;
    }
  };

  const ensureRaf = () => {
    if (state.running || document.hidden || reduced) {
      return;
    }

    state.running = true;
    state.rafId = requestAnimationFrame(tick);
  };

  if (!reduced && !compact && finePointer && gallery) {
    state.onPointerMove = (event) => {
      const rect = gallery.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      state.pointerInside = true;
      state.targetX = x;
      state.targetY = y;
      state.targetGlowOpacity = 0.12;
      state.targetNX = x / Math.max(rect.width, 1) * 2 - 1;
      state.targetNY = y / Math.max(rect.height, 1) * 2 - 1;
      ensureRaf();
    };

    state.onPointerLeave = () => {
      state.pointerInside = false;
      state.targetGlowOpacity = 0;
      state.targetNX = 0;
      state.targetNY = 0;
      ensureRaf();
    };

    gallery.addEventListener('pointermove', state.onPointerMove, { passive: true });
    gallery.addEventListener('pointerleave', state.onPointerLeave);

    state.hoverCleanups.push(bindArtworkHover(gallery, arts));
  } else {
    clearActiveArtwork(gallery, arts);
  }

  state.onScroll = () => {
    const scroll = window.scrollY * 0.25;
    root.style.setProperty('--ambient-scroll', `${scroll.toFixed(1)}px`);
  };

  window.addEventListener('scroll', state.onScroll, { passive: true });
  state.onScroll();

  state.onVisibility = () => {
    if (document.hidden) {
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = 0;
        state.running = false;
      }
      return;
    }

    ensureRaf();
  };

  document.addEventListener('visibilitychange', state.onVisibility);

  state.onResize = () => {
    if (isCompactViewport()) {
      if (glow) {
        glow.style.opacity = '0';
      }

      clearActiveArtwork(gallery, arts);
    }
  };

  window.addEventListener('resize', state.onResize, { passive: true });
}

export function runGalleryTransition(callback) {
  if (prefersReducedMotion()) {
    callback?.();
    return;
  }

  const existing = document.querySelector('.gallery-transition');
  existing?.remove();

  const layer = document.createElement('div');
  layer.className = 'gallery-transition';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<i></i>';
  document.body.appendChild(layer);

  let called = false;
  const runCallback = () => {
    if (called) {
      return;
    }

    called = true;
    callback?.();
  };

  requestAnimationFrame(() => {
    layer.classList.add('is-active');
  });

  window.setTimeout(runCallback, 480);
  window.setTimeout(() => {
    layer.classList.remove('is-active');
    window.setTimeout(() => layer.remove(), 280);
  }, 760);
}
