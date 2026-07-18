(() => {
  'use strict';

  const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
  const COMPACT_MOTION_QUERY = '(max-width: 760px), (pointer: coarse)';
  const EASE_CINEMA = 'cubic-bezier(.16, 1, .3, 1)';
  const EASE_UI = 'cubic-bezier(.25, .8, .25, 1)';
  const runningAnimations = new Set();
  const elementAnimations = new WeakMap();
  const motionScriptUrl = document.currentScript?.src || window.location.href;
  let gsap = window.gsap;
  let ScrollTrigger = window.ScrollTrigger;
  let motionEnabled = true;
  let motionStarted = false;
  let performanceMode = 'full';
  let motionContext = null;

  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find(script => script.src === src);
      if (existing) {
        if (existing.dataset.loaded === 'true') resolve();
        else {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', reject, { once: true });
        }
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        resolve();
      }, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.append(script);
    });
  }

  async function ensureGsap() {
    if (!window.gsap) {
      await loadScript(new URL('../vendor/gsap.min.js', motionScriptUrl).href);
    }
    if (!window.ScrollTrigger) {
      await loadScript(new URL('../vendor/ScrollTrigger.min.js', motionScriptUrl).href);
    }
    gsap = window.gsap;
    ScrollTrigger = window.ScrollTrigger;
    if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    return Boolean(gsap && ScrollTrigger);
  }

  function prefersReducedMotion() {
    return typeof window.matchMedia === 'function'
      && window.matchMedia(REDUCED_MOTION_QUERY).matches;
  }

  function canAnimate() {
    return motionEnabled
      && !prefersReducedMotion()
      && typeof Element !== 'undefined'
      && typeof Element.prototype.animate === 'function';
  }

  function animateElement(element, keyframes, options = {}, persist = false) {
    if (!element || !canAnimate()) return null;
    elementAnimations.get(element)?.cancel();

    let animation = null;
    try {
      animation = element.animate(keyframes, {
        fill: persist ? 'both' : 'backwards',
        ...options
      });
    } catch (_error) {
      return null;
    }

    runningAnimations.add(animation);
    elementAnimations.set(element, animation);
    animation.finished
      .catch(() => undefined)
      .finally(() => {
        runningAnimations.delete(animation);
        if (elementAnimations.get(element) === animation) elementAnimations.delete(element);
        if (!persist && animation.playState !== 'idle') animation.cancel();
      });
    return animation;
  }

  function waitForAnimations(animations) {
    return Promise.all(
      animations.filter(Boolean).map(animation => animation.finished.catch(() => undefined))
    );
  }

  function cancelRunningAnimations() {
    [...runningAnimations].forEach(animation => animation.cancel());
    runningAnimations.clear();
    motionContext?.revert();
    motionContext = null;
  }

  function detectPerformanceMode() {
    const compact = typeof window.matchMedia === 'function'
      && window.matchMedia(COMPACT_MOTION_QUERY).matches;
    const saveData = navigator.connection?.saveData === true;
    const constrainedDevice = typeof navigator.deviceMemory === 'number'
      && navigator.deviceMemory <= 4
      && typeof navigator.hardwareConcurrency === 'number'
      && navigator.hardwareConcurrency <= 4;

    performanceMode = saveData || constrainedDevice ? 'low' : (compact ? 'compact' : 'full');
    document.documentElement.classList.toggle('motion-compact', performanceMode === 'compact');
    document.documentElement.classList.toggle('motion-low', performanceMode === 'low');
  }

  function initMotionPreferences() {
    const mediaQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia(REDUCED_MOTION_QUERY)
      : null;

    const syncPreference = () => {
      motionEnabled = !Boolean(mediaQuery?.matches);
      document.documentElement.classList.toggle('reduced-motion', !motionEnabled);
      if (!motionEnabled) cancelRunningAnimations();
    };

    if (mediaQuery) {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', syncPreference);
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(syncPreference);
      }
    }

    detectPerformanceMode();
    syncPreference();
  }

  function addGuideSweeps() {
    document.querySelectorAll('.guide-row').forEach(row => {
      if (row.querySelector('.guide-sweep')) return;
      const sweep = document.createElement('span');
      sweep.className = 'guide-sweep';
      sweep.setAttribute('aria-hidden', 'true');
      row.append(sweep);
    });
  }

  function entryTimeline(trigger, start = 'top 82%') {
    return gsap.timeline({
      scrollTrigger: {
        trigger,
        start,
        once: true
      }
    });
  }

  function initHomeIntro() {
    const hero = document.querySelector('.home-intro');
    if (!hero) return;

    const art = hero.querySelector('.home-cinema-backdrop img');
    const frame = hero.querySelector('.home-photo-frame');
    const photo = hero.querySelector('.home-photo img');
    const lines = [...hero.querySelectorAll('h1 span')];
    const summary = hero.querySelector('.home-intro-copy > p:last-child');
    const caption = hero.querySelector('.home-photo figcaption');
    const compact = performanceMode !== 'full';

    const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
    intro
      .fromTo(art, { scale: compact ? 1.025 : 1.065 }, { scale: 1, duration: compact ? 1.45 : 2.35 }, 0)
      .fromTo(frame,
        { clipPath: compact ? 'inset(4% 7% 4% 7%)' : 'inset(3% 10% 3% 10%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: compact ? 1.15 : 1.75, ease: 'power3.inOut' },
        compact ? .05 : .14)
      .fromTo(photo,
        { scale: compact ? 1.05 : 1.13, xPercent: compact ? 0 : 2.4 },
        { scale: 1, xPercent: 0, duration: compact ? 1.3 : 2.05 },
        .08)
      .fromTo(lines,
        { clipPath: 'inset(0 8% 10% 0)', yPercent: 16, autoAlpha: .72 },
        { clipPath: 'inset(0 0 0% 0)', yPercent: 0, autoAlpha: 1, duration: compact ? .78 : 1.05, stagger: compact ? .11 : .18 },
        compact ? .22 : .32)
      .fromTo(summary,
        { autoAlpha: .7, y: compact ? 6 : 12 },
        { autoAlpha: 1, y: 0, duration: compact ? .7 : 1 },
        compact ? .52 : .82)
      .fromTo(caption,
        { autoAlpha: .58, x: -8 },
        { autoAlpha: 1, x: 0, duration: .72 },
        compact ? .72 : 1.18);

    if (performanceMode !== 'full') return;

    gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.15
      }
    })
      .to(art, { yPercent: 4.5, scale: 1.035, ease: 'none' }, 0)
      .to('.home-photo', { yPercent: -5.5, ease: 'none' }, 0)
      .to('.home-intro-copy', { yPercent: -7, autoAlpha: .58, ease: 'none' }, 0)
      .to('.home-cinema-vignette', { opacity: .82, ease: 'none' }, 0);

    const indexSection = document.querySelector('.home-index');
    if (indexSection) {
      gsap.fromTo(indexSection,
        { clipPath: 'inset(9% 0 0 0)', y: 34 },
        {
          clipPath: 'inset(0% 0 0 0)',
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: indexSection,
            start: 'top 96%',
            end: 'top 58%',
            scrub: 1.1
          }
        });
    }
  }

  function initPageHero() {
    const hero = document.querySelector('.page-hero');
    if (!hero) return;

    const container = hero.querySelector('.container');
    const crumbs = hero.querySelector('.breadcrumbs');
    const title = hero.querySelector('h1');
    const copy = hero.querySelector('p');
    const compact = performanceMode !== 'full';

    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .fromTo(crumbs, { autoAlpha: .58, x: -10 }, { autoAlpha: 1, x: 0, duration: .62 }, 0)
      .fromTo(title,
        { clipPath: 'inset(0 8% 0 0)', y: compact ? 6 : 10 },
        { clipPath: 'inset(0 0% 0 0)', y: 0, duration: compact ? .85 : 1.12 },
        .12)
      .fromTo(copy,
        { autoAlpha: .65, y: 8 },
        { autoAlpha: 1, y: 0, duration: compact ? .7 : .92 },
        .42);

    if (performanceMode === 'full') {
      gsap.to(container, {
        yPercent: -5,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      });
    }
  }

  function initSectionHeadings() {
    document.querySelectorAll('.section-heading').forEach(heading => {
      const title = heading.querySelector('h2');
      const copy = heading.querySelector('p');
      entryTimeline(heading)
        .fromTo(title,
          { clipPath: 'inset(0 8% 0 0)', y: 9 },
          { clipPath: 'inset(0 0% 0 0)', y: 0, duration: 1, ease: 'power4.out' })
        .fromTo(copy,
          { autoAlpha: .68, y: 6 },
          { autoAlpha: 1, y: 0, duration: .78, ease: 'power3.out' },
          '-=.52');
    });

    document.querySelectorAll('.section-title').forEach(title => {
      if (title.closest('.section-heading') || title.closest('.grid')) return;
      gsap.fromTo(title,
        { clipPath: 'inset(0 8% 0 0)', y: 8 },
        {
          clipPath: 'inset(0 0% 0 0)',
          y: 0,
          duration: .95,
          ease: 'power4.out',
          scrollTrigger: { trigger: title, start: 'top 84%', once: true }
        });
    });
  }

  function initGuideIndex() {
    document.querySelectorAll('.guide-row').forEach((row, index) => {
      const sweep = row.querySelector('.guide-sweep');
      const content = [...row.children].filter(child => child !== sweep);
      entryTimeline(row, 'top 88%')
        .fromTo(sweep, { scaleX: 0, opacity: .28 }, { scaleX: 1, opacity: 1, duration: .92, ease: 'power3.inOut' })
        .fromTo(content,
          { autoAlpha: .68, x: index % 2 ? 10 : -10 },
          { autoAlpha: 1, x: 0, duration: .82, stagger: .08, ease: 'power4.out' },
          '-=.48');
    });
  }

  function initFeaturedPlaces() {
    document.querySelectorAll('.featured-places').forEach(group => {
      const stories = [group.querySelector('.place-lead'), ...group.querySelectorAll('.place-story')]
        .filter(Boolean);

      stories.forEach((story, index) => {
        const media = story.querySelector(':scope > a');
        const image = media?.querySelector('img');
        const copy = story.querySelector(':scope > div');
        const fromClip = index === 0
          ? 'inset(2% 9% 2% 9%)'
          : (index % 2 ? 'inset(0 10% 0 0)' : 'inset(0 0 0 10%)');

        entryTimeline(story, 'top 84%')
          .fromTo(media,
            { clipPath: fromClip },
            { clipPath: 'inset(0 0% 0 0%)', duration: index === 0 ? 1.35 : 1.05, ease: 'power3.inOut' })
          .fromTo(image,
            { scale: index === 0 ? 1.11 : 1.075, xPercent: index % 2 ? 2 : -2 },
            { scale: 1, xPercent: 0, duration: 1.35, ease: 'power4.out' },
            0)
          .fromTo(copy,
            { clipPath: 'inset(0 0 10% 0)', autoAlpha: .68, y: 10 },
            { clipPath: 'inset(0 0 0% 0)', autoAlpha: 1, y: 0, duration: .88, ease: 'power4.out' },
            index === 0 ? .72 : .56);
      });
    });
  }

  function initSweetsTriptych() {
    document.querySelectorAll('.sweets-triptych').forEach(grid => {
      const cards = [...grid.querySelectorAll('.card')];
      const clips = ['inset(0 10% 0 0)', 'inset(10% 0 0 0)', 'inset(0 0 0 10%)'];
      const timeline = entryTimeline(grid, 'top 80%');

      cards.forEach((card, index) => {
        const media = card.querySelector('.card-media');
        const image = media?.querySelector('img');
        const title = card.querySelector('h3');
        const copy = card.querySelector('p');
        const at = index * .14;

        timeline
          .fromTo(media,
            { clipPath: clips[index] || clips[0] },
            { clipPath: 'inset(0 0% 0 0%)', duration: 1.18, ease: 'power3.inOut' },
            at)
          .fromTo(image,
            { scale: 1.09, xPercent: index === 0 ? 3 : (index === 2 ? -3 : 0), yPercent: index === 1 ? -2 : 0 },
            { scale: 1, xPercent: 0, yPercent: 0, duration: 1.35, ease: 'power4.out' },
            at)
          .fromTo(title,
            { clipPath: 'inset(0 8% 0 0)', y: 7 },
            { clipPath: 'inset(0 0% 0 0)', y: 0, duration: .74, ease: 'power4.out' },
            at + .66)
          .fromTo(copy,
            { autoAlpha: .66, y: 6 },
            { autoAlpha: 1, y: 0, duration: .66, ease: 'power3.out' },
            at + .78);
      });
    });
  }

  function initEditorialGrids() {
    document.querySelectorAll('.grid:not(.sweets-triptych)').forEach(grid => {
      const children = [...grid.children];
      const timeline = entryTimeline(grid, 'top 83%');

      children.forEach((child, index) => {
        const image = child.matches('img') ? child : child.querySelector(':scope > img');
        const copy = child.querySelector('.card-body') || (!image ? child : null);
        const at = Math.min(index * .09, .36);

        if (image) {
          timeline.fromTo(image,
            { clipPath: index % 2 ? 'inset(0 0 0 9%)' : 'inset(0 9% 0 0)', scale: 1.05 },
            { clipPath: 'inset(0 0% 0 0%)', scale: 1, duration: .95, ease: 'power3.inOut' },
            at);
        }
        if (copy) {
          timeline.fromTo(copy,
            { clipPath: 'inset(0 0 9% 0)', autoAlpha: .68, y: 8 },
            { clipPath: 'inset(0 0 0% 0)', autoAlpha: 1, y: 0, duration: .72, ease: 'power4.out' },
            at + (image ? .48 : 0));
        }
      });
    });
  }

  function initGallery() {
    document.querySelectorAll('.gallery').forEach(gallery => {
      const items = [...gallery.querySelectorAll(':scope > button')];
      const timeline = entryTimeline(gallery, 'top 82%');
      const clips = [
        'inset(0 9% 0 0)',
        'inset(9% 0 0 0)',
        'inset(0 0 0 9%)',
        'inset(0 0 9% 0)'
      ];

      items.forEach((item, index) => {
        const image = item.querySelector('img');
        const at = Math.min(index * .085, .62);
        timeline
          .fromTo(item,
            { clipPath: clips[index % clips.length] },
            { clipPath: 'inset(0 0% 0 0%)', duration: .92, ease: 'power3.inOut' },
            at)
          .fromTo(image,
            { scale: 1.075, xPercent: index % 2 ? 2 : -2 },
            { scale: 1, xPercent: 0, duration: 1.05, ease: 'power4.out' },
            at);
      });
    });
  }

  function initSupportingScenes() {
    document.querySelectorAll('.timeline, .transport-visual').forEach(group => {
      const items = [...group.children];
      gsap.fromTo(items,
        { clipPath: 'inset(0 0 9% 0)', autoAlpha: .68, y: 9 },
        {
          clipPath: 'inset(0 0 0% 0)',
          autoAlpha: 1,
          y: 0,
          duration: .82,
          stagger: .11,
          ease: 'power4.out',
          scrollTrigger: { trigger: group, start: 'top 84%', once: true }
        });
    });

    document.querySelectorAll('.notice, .home-quiz').forEach(element => {
      gsap.fromTo(element,
        { clipPath: 'inset(0 8% 0 0)', autoAlpha: .7 },
        {
          clipPath: 'inset(0 0% 0 0)',
          autoAlpha: 1,
          duration: .9,
          ease: 'power4.out',
          scrollTrigger: { trigger: element, start: 'top 88%', once: true }
        });
    });
  }

  function initGsapMotion() {
    addGuideSweeps();
    document.documentElement.classList.add('motion-ready');
    motionContext = gsap.context(() => {
      initHomeIntro();
      initPageHero();
      initSectionHeadings();
      initGuideIndex();
      initFeaturedPlaces();
      initSweetsTriptych();
      initEditorialGrids();
      initGallery();
      initSupportingScenes();
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh, { once: true });
    document.fonts?.ready.then(refresh).catch(() => undefined);
  }

  function initFallbackMotion() {
    const hero = document.querySelector('.home-intro, .page-hero');
    if (!hero) return;
    animateElement(hero, [
      { opacity: .82 },
      { opacity: 1 }
    ], { duration: 780, easing: EASE_CINEMA });
  }

  function startMotionSystem() {
    if (motionStarted) return;
    motionStarted = true;
    if (!canAnimate() || performanceMode === 'low') return;
    ensureGsap()
      .then(available => {
        if (!canAnimate()) return;
        if (available) initGsapMotion();
        else initFallbackMotion();
      })
      .catch(initFallbackMotion);
  }

  function animateFlip(elements, mutate) {
    const firstRects = new Map(elements.map(element => [element, element.getBoundingClientRect()]));
    mutate();
    if (!canAnimate()) return;

    elements.forEach(element => {
      const first = firstRects.get(element);
      const last = element.getBoundingClientRect();
      const deltaX = first.left - last.left;
      const deltaY = first.top - last.top;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

      animateElement(element, [
        { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
        { transform: 'translate3d(0, 0, 0)' }
      ], {
        duration: 560,
        easing: EASE_UI
      });
    });
  }

  window.KyotoDaysMotion = Object.freeze({
    animate: animateElement,
    canAnimate,
    flip: animateFlip,
    initPreferences: initMotionPreferences,
    isEnabled: () => motionEnabled,
    prefersReducedMotion,
    start: startMotionSystem,
    wait: waitForAnimations
  });
})();
