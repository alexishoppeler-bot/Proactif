(function () {
  function getIndexHref() {
    try {
      const href = String(window.location.href || '');
      const marker = '/exercices/';
      const idx = href.indexOf(marker);
      if (idx !== -1) return href.slice(0, idx) + '/index.html';
      return href.replace(/[^/]*$/, 'index.html');
    } catch (e) {
      return 'index.html';
    }
  }

  function duplicateHeadingAsH2(target) {
    if (!target) return;
    const replacement = document.createElement('h2');
    replacement.innerHTML = target.innerHTML;
    replacement.className = ['exercise-section-title', target.className].filter(Boolean).join(' ');
    Array.from(target.attributes || []).forEach(attr => {
      if (attr.name.toLowerCase() === 'class') return;
      replacement.setAttribute(attr.name, attr.value);
    });
    target.replaceWith(replacement);
  }

  function moveBackLink(actions) {
    const existingLink = document.querySelector('.back-home__link');
    if (existingLink) {
      existingLink.classList.add('exercise-hero__back');
      existingLink.textContent = '← Retour au menu';
      existingLink.href = getIndexHref();
      // Many exercises ship a heavily styled inline link; remove inline styles so the shared
      // layout can keep a consistent look across exercises.
      try { existingLink.removeAttribute('style'); } catch (e) {}
      const container = existingLink.closest('.back-home');
      actions.appendChild(existingLink);
      if (container && container.parentElement) {
        container.remove();
      }
      return true;
    }
    return false;
  }

  function computeExerciseKey() {
    try {
      if (window.ProactifProgress && typeof window.ProactifProgress.getCurrentKey === 'function') {
        return window.ProactifProgress.getCurrentKey();
      }
    } catch (e) {}
    return null;
  }

  function computeExerciseState() {
    try {
      if (window.ProactifProgress && typeof window.ProactifProgress.getCurrentState === 'function') {
        return window.ProactifProgress.getCurrentState();
      }
    } catch (e) {}
    return 'todo';
  }

  function setExerciseState(nextState) {
    try {
      if (window.ProactifProgress && typeof window.ProactifProgress.setCurrentState === 'function') {
        window.ProactifProgress.setCurrentState(nextState);
      } else if (typeof window.proactifSetExerciseState === 'function') {
        window.proactifSetExerciseState(nextState);
      }
    } catch (e) {}
  }

  function createStatusIndicator() {
    const el = document.createElement('div');
    el.className = 'exercise-hero__status';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    return el;
  }

  function syncStatusIndicator(el) {
    if (!el) return;
    const state = computeExerciseState();
    el.dataset.state = state;
    if (state === 'done') {
      el.textContent = '✔ Terminé';
      el.setAttribute('title', 'Exercice terminé');
    } else if (state === 'in_progress') {
      el.textContent = 'En cours';
      el.setAttribute('title', 'Exercice en cours');
    } else {
      el.textContent = 'À faire';
      el.setAttribute('title', 'Exercice à faire');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const card = document.querySelector('.exercise-card');
    if (!card || card.querySelector('.exercise-hero')) return;

    const firstHeading = card.querySelector('h1');
    let headingText = '';
    if (firstHeading && firstHeading.textContent.trim().length) {
      headingText = firstHeading.textContent.trim();
    } else {
      headingText = (document.title || 'Exercice interactif').trim();
    }

    const looksNested = (() => {
      try {
        return !!card.querySelector(':scope > .container, :scope > #container, :scope > .app, :scope > .mail-box');
      } catch (e) {
        return false;
      }
    })();
    if (looksNested) {
      card.classList.add('exercise-card--nested');
    }

    const hero = document.createElement('header');
    hero.className = 'exercise-hero';

    const textWrap = document.createElement('div');
    textWrap.className = 'exercise-hero__text';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'exercise-hero__eyebrow';
    eyebrow.textContent = 'Plateforme autonomie';

    const heroTitle = document.createElement('h1');
    heroTitle.className = 'exercise-hero__title';
    heroTitle.textContent = headingText;

    const subtitle = document.createElement('p');
    subtitle.className = 'exercise-hero__subtitle';
    subtitle.textContent = document.body.getAttribute('data-exercise-subtitle') || 'Complétez l’exercice puis revenez à l’index pour suivre votre progression.';

    textWrap.appendChild(eyebrow);
    textWrap.appendChild(heroTitle);
    textWrap.appendChild(subtitle);

    const actions = document.createElement('div');
    actions.className = 'exercise-hero__actions';

    const statusIndicator = createStatusIndicator();
    syncStatusIndicator(statusIndicator);

    const indicator = document.createElement('div');
    indicator.className = 'exercise-hero__indicator';
    indicator.innerHTML = '🗂️ Sauvegarde locale active';

    if (!moveBackLink(actions)) {
      const backLink = document.createElement('a');
      backLink.href = getIndexHref();
      backLink.textContent = '← Retour au menu';
      backLink.className = 'exercise-hero__back';
      actions.appendChild(backLink);
    }

    actions.appendChild(statusIndicator);
    actions.appendChild(indicator);

    hero.appendChild(textWrap);
    hero.appendChild(actions);

    card.insertBefore(hero, card.firstChild);

    if (firstHeading && firstHeading.isConnected) {
      duplicateHeadingAsH2(firstHeading);
    }

    try {
      document.addEventListener('proactif:progress-changed', function () {
        syncStatusIndicator(statusIndicator);
      });
    } catch (e) {}
  });
})();
