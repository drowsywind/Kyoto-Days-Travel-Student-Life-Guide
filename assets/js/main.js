(() => {
  'use strict';

  const Motion = window.KyotoDaysMotion;
  if (!Motion) {
    throw new Error('motion.js must be loaded before main.js');
  }

  function initNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;

    toggle.type = 'button';

    const closeNavigation = (returnFocus = false) => {
      nav.classList.remove('open');
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      document.body.classList.toggle('nav-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeNavigation());
    });

    nav.querySelectorAll('a.active').forEach(link => {
      const target = new URL(link.href, window.location.href);
      const current = new URL(window.location.href);
      link.setAttribute('aria-current', target.pathname === current.pathname ? 'page' : 'location');
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeNavigation(true);
      }
    });

    if (typeof window.matchMedia === 'function') {
      const desktopQuery = window.matchMedia('(min-width: 981px)');
      const handleDesktopChange = event => {
        if (event.matches) closeNavigation();
      };
      if (typeof desktopQuery.addEventListener === 'function') {
        desktopQuery.addEventListener('change', handleDesktopChange);
      }
    }
  }

  function initBackToTop() {
    const toTop = document.querySelector('.to-top');
    if (!toTop) return;

    toTop.type = 'button';
    toTop.classList.remove('show');
    toTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: Motion.prefersReducedMotion() || !Motion.isEnabled() ? 'auto' : 'smooth'
      });
    });

    if (!('IntersectionObserver' in window)) {
      toTop.classList.add('show');
      return;
    }

    const sentinel = document.createElement('span');
    sentinel.className = 'to-top-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    Object.assign(sentinel.style, {
      position: 'absolute',
      top: '500px',
      left: '0',
      width: '1px',
      height: '1px',
      pointerEvents: 'none'
    });
    document.body.prepend(sentinel);

    const observer = new IntersectionObserver(([entry]) => {
      const hasPassedSentinel = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      toTop.classList.toggle('show', hasPassedSentinel);
    });
    observer.observe(sentinel);
  }

  function initFilters() {
    const buttons = [...document.querySelectorAll('.filter-btn')];
    const cards = [...document.querySelectorAll('[data-category]')];
    if (!buttons.length || !cards.length) return;

    const applyFilter = (activeButton, withMotion = false) => {
      if (withMotion && activeButton.classList.contains('active')) return;
      const filter = activeButton.dataset.filter;
      const willShow = card => filter === 'all' || card.dataset.category === filter;

      const update = () => {
        buttons.forEach(button => {
          const isActive = button === activeButton;
          button.classList.toggle('active', isActive);
          button.setAttribute('aria-pressed', String(isActive));
        });

        cards.forEach(card => {
          card.style.removeProperty('display');
          card.hidden = !willShow(card);
        });
      };

      if (!withMotion || !Motion.canAnimate()) {
        update();
        return;
      }

      const persistentCards = cards.filter(card => !card.hidden && willShow(card));
      const enteringCards = cards.filter(card => card.hidden && willShow(card));
      Motion.flip(persistentCards, update);

      enteringCards.forEach((card, index) => {
        Motion.animate(card, [
          { opacity: .72, transform: 'translate3d(0, 10px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' }
        ], {
          duration: 620,
          delay: Math.min(index * 85, 255),
          easing: 'cubic-bezier(.22, .62, .26, 1)'
        });
      });
    };

    buttons.forEach(button => {
      button.type = 'button';
      button.addEventListener('click', () => applyFilter(button, true));
    });

    applyFilter(buttons.find(button => button.classList.contains('active')) || buttons[0]);
  }

  function initAccordions() {
    const items = [...document.querySelectorAll('.accordion')];

    items.forEach((item, index) => {
      const button = item.querySelector('button');
      const content = item.querySelector('.accordion-content');
      if (!button || !content) return;

      button.type = 'button';
      if (!content.id) content.id = `accordion-panel-${index + 1}`;
      button.setAttribute('aria-controls', content.id);

      const indicator = button.querySelector('span');
      if (indicator) {
        indicator.setAttribute('aria-hidden', 'true');
        indicator.textContent = '＋';
      }

      let operation = 0;
      let contentAnimation = null;
      const followingItems = items.slice(index + 1);

      const syncState = isOpen => {
        item.classList.toggle('open', isOpen);
        button.setAttribute('aria-expanded', String(isOpen));
      };

      const setOpen = async (isOpen, withMotion = true) => {
        operation += 1;
        const currentOperation = operation;
        if (contentAnimation) {
          contentAnimation.cancel();
          contentAnimation = null;
        }

        syncState(isOpen);

        if (!withMotion || !Motion.canAnimate()) {
          content.hidden = !isOpen;
          return;
        }

        if (isOpen) {
          Motion.flip(followingItems, () => {
            content.hidden = false;
          });

          contentAnimation = Motion.animate(content, [
            { opacity: 0, clipPath: 'inset(0 0 100% 0)', transform: 'translate3d(0, -6px, 0)' },
            { opacity: 1, clipPath: 'inset(0)', transform: 'translate3d(0, 0, 0)' }
          ], {
            duration: 640,
            easing: 'cubic-bezier(.22, .62, .26, 1)'
          });
          return;
        }

        contentAnimation = Motion.animate(content, [
          { opacity: 1, clipPath: 'inset(0)', transform: 'translate3d(0, 0, 0)' },
          { opacity: 0, clipPath: 'inset(0 0 100% 0)', transform: 'translate3d(0, -6px, 0)' }
        ], {
          duration: 360,
          easing: 'cubic-bezier(.65, 0, .35, 1)'
        });

        if (contentAnimation) {
          await contentAnimation.finished.catch(() => undefined);
        }
        if (currentOperation !== operation) return;

        contentAnimation = null;
        Motion.flip(followingItems, () => {
          content.hidden = true;
        });
      };

      const initiallyOpen = item.classList.contains('open');
      syncState(initiallyOpen);
      content.hidden = !initiallyOpen;

      button.addEventListener('click', () => {
        setOpen(button.getAttribute('aria-expanded') !== 'true');
      });
    });
  }

  function initLightbox() {
    const lightbox = document.querySelector('.lightbox');
    if (!lightbox) return;

    const lightboxImage = lightbox.querySelector('img');
    const closeButton = lightbox.querySelector('button');
    const triggers = [...document.querySelectorAll('.gallery button')];
    if (!lightboxImage || !closeButton || !triggers.length) return;

    const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    let returnFocusTo = null;
    let phase = 'closed';
    let operation = 0;
    let modalAnimations = [];

    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-hidden', 'true');
    if (!lightbox.hasAttribute('aria-label') && !lightbox.hasAttribute('aria-labelledby')) {
      lightbox.setAttribute('aria-label', '画像プレビュー');
    }
    lightbox.tabIndex = -1;
    closeButton.type = 'button';

    const getFocusableElements = () => [...lightbox.querySelectorAll(focusableSelector)]
      .filter(element => element.getClientRects().length > 0);

    const cancelModalAnimations = () => {
      modalAnimations.forEach(animation => animation?.cancel());
      modalAnimations = [];
    };

    const sharedTransform = (sourceRect, targetRect) => {
      if (!sourceRect || !targetRect || !targetRect.width || !targetRect.height) return 'scale(.97)';
      const sourceX = sourceRect.left + sourceRect.width / 2;
      const sourceY = sourceRect.top + sourceRect.height / 2;
      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.top + targetRect.height / 2;
      const scaleX = Math.max(.01, sourceRect.width / targetRect.width);
      const scaleY = Math.max(.01, sourceRect.height / targetRect.height);
      return `translate3d(${sourceX - targetX}px, ${sourceY - targetY}px, 0) scale(${scaleX}, ${scaleY})`;
    };

    const finalizeClose = () => {
      cancelModalAnimations();
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      phase = 'closed';

      const focusTarget = returnFocusTo;
      returnFocusTo = null;
      if (focusTarget && focusTarget.isConnected) {
        window.requestAnimationFrame(() => focusTarget.focus());
      }
    };

    const closeLightbox = async () => {
      if (phase === 'closed' || phase === 'closing') return;

      phase = 'closing';
      operation += 1;
      const currentOperation = operation;
      cancelModalAnimations();

      if (!Motion.canAnimate()) {
        finalizeClose();
        return;
      }

      const sourceImage = returnFocusTo?.querySelector('img');
      const sourceRect = sourceImage?.getBoundingClientRect();
      const targetRect = lightboxImage.getBoundingClientRect();
      const returnTransform = sharedTransform(sourceRect, targetRect);

      modalAnimations = [
        Motion.animate(lightbox, [
          { opacity: 1 },
          { opacity: 0 }
        ], {
          duration: 380,
          easing: 'cubic-bezier(.65, 0, .35, 1)'
        }, true),
        Motion.animate(lightboxImage, [
          { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)', clipPath: 'inset(0)' },
          { opacity: .62, transform: returnTransform, clipPath: 'inset(1.5%)' }
        ], {
          duration: 620,
          easing: 'cubic-bezier(.65, 0, .35, 1)'
        }, true)
      ];

      await Motion.wait(modalAnimations);
      if (currentOperation !== operation) return;
      finalizeClose();
    };

    const openLightbox = trigger => {
      const sourceImage = trigger.querySelector('img');
      if (!sourceImage) return;

      operation += 1;
      const currentOperation = operation;
      cancelModalAnimations();
      phase = 'opening';
      returnFocusTo = trigger;
      lightboxImage.src = sourceImage.currentSrc || sourceImage.src;
      lightboxImage.alt = sourceImage.alt;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');

      const sourceRect = sourceImage.getBoundingClientRect();
      const targetRect = lightboxImage.getBoundingClientRect();
      const openingTransform = sharedTransform(sourceRect, targetRect);

      modalAnimations = [
        Motion.animate(lightbox, [
          { opacity: 0 },
          { opacity: 1 }
        ], {
          duration: 580,
          easing: 'cubic-bezier(.25, .8, .25, 1)'
        }),
        Motion.animate(lightboxImage, [
          { opacity: .68, transform: openingTransform, clipPath: 'inset(1.5%)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)', clipPath: 'inset(0)' }
        ], {
          duration: 820,
          delay: 30,
          easing: 'cubic-bezier(.16, 1, .3, 1)'
        }),
        Motion.animate(closeButton, [
          { opacity: 0, transform: 'translate3d(8px, 0, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' }
        ], {
          duration: 520,
          delay: 260,
          easing: 'cubic-bezier(.16, 1, .3, 1)'
        })
      ];

      window.requestAnimationFrame(() => closeButton.focus());
      Motion.wait(modalAnimations).then(() => {
        if (currentOperation === operation && phase === 'opening') phase = 'open';
      });
    };

    triggers.forEach(trigger => {
      trigger.type = 'button';
      trigger.addEventListener('click', () => openLightbox(trigger));
    });

    closeButton.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', event => {
      if (!lightbox.classList.contains('open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (!focusableElements.length) {
        event.preventDefault();
        lightbox.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !lightbox.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !lightbox.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function init() {
    document.documentElement.classList.add('js');
    Motion.initPreferences();
    initNavigation();
    initBackToTop();
    initFilters();
    initAccordions();
    initLightbox();
    Motion.start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
