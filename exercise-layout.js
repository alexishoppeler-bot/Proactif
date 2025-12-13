(function () {
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
      existingLink.textContent = '← Retour à l’index';
      const container = existingLink.closest('.back-home');
      actions.appendChild(existingLink);
      if (container && container.parentElement) {
        container.remove();
      }
      return true;
    }
    return false;
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

    const indicator = document.createElement('div');
    indicator.className = 'exercise-hero__indicator';
    indicator.innerHTML = '🗂️ Sauvegarde locale active';

    if (!moveBackLink(actions)) {
      const backLink = document.createElement('a');
      backLink.href = '/index.html';
      backLink.textContent = '← Retour à l’index';
      backLink.className = 'exercise-hero__back';
      actions.appendChild(backLink);
    }

    actions.appendChild(indicator);

    hero.appendChild(textWrap);
    hero.appendChild(actions);

    card.insertBefore(hero, card.firstChild);

    if (firstHeading && firstHeading.isConnected) {
      duplicateHeadingAsH2(firstHeading);
    }
  });
})();
