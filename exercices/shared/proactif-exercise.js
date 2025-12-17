(function () {
  var STORAGE_KEY = 'proactif_progress_v1';
  var LEGACY_KEY = 'progression';
  var SCORE_REQUIRED = {
    'exercices/quiz/100quiz_html.html': true,
    'exercices/quiz/comprehension-1.html': true,
    'exercices/quiz/comprehension-2.html': true,
    'exercices/quiz/communication-3.html': true,
    'exercices/quiz/phrases-pro.html': true,
    'exercices/quiz/phrases-pro-2.html': true,
    'exercices/apparier/apparier-metiers-outils.html': true,
    'exercices/apparier/apparier100.html': true,
    'exercices/jeux/jeu-directions.html': true,
    'exercices/jeux/jeu-clics.html': true,
    'exercices/jeux/mot-image-metiers.html': true,
    'exercices/recherche_emploi/qualites-personnelles.html': true,
    'exercices/recherche_emploi/annonces.html': true,
    'exercices/reponses_ouvertes/ecrire-en-francais-situations-professionnelle.html': true,
    'exercices/reponses_ouvertes/ecrire-en-français-situations-professionnelle.html': true,
    'exercices/reponses_ouvertes/simulation-de-situations-professionnelles.html': true,
    'exercices/bureautique/editeur-a4.html': true,
    'exercices/bureautique/lettre-motivation.html': true
  };

  function normalizeKey(key) {
    if (!key) return null;
    var out = String(key);
    out = out.split('#')[0].split('?')[0];
    out = out.replace(/^\/+/, '');
    out = out.replace(/^\.\//, '');
    try { out = decodeURIComponent(out); } catch (e) { }
    return out || null;
  }

  function getExerciseKey() {
    try {
      var path = window.location.pathname || '';
      var marker = '/exercices/';
      var idx = path.indexOf(marker);
      if (idx !== -1) return normalizeKey(path.slice(idx + 1));
      path = path.replace(/^\/+/, '');
      var inner = path.indexOf('exercices/');
      if (inner !== -1) return normalizeKey(path.slice(inner));
    } catch (e) { }
    return null;
  }

  var exerciseKey = getExerciseKey();
  var requiresScore = !!(exerciseKey && SCORE_REQUIRED[exerciseKey]);

  function getIndexHref() {
    try {
      var href = String(window.location.href || '');
      var marker = '/exercices/';
      var idx = href.indexOf(marker);
      if (idx !== -1) return href.slice(0, idx) + '/index.html';
      return href.replace(/[^/]*$/, 'index.html');
    } catch (e) { }
    return '/index.html';
  }

  function saveAllStates(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next || {}));
    } catch (e) { }
  }

  function loadAllStates() {
    var progression = {};
    var migrated = false;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var legacy = localStorage.getItem(LEGACY_KEY);
      var saved = raw || legacy;
      progression = JSON.parse(saved || '{}');
      if (!raw && legacy) migrated = true;
    } catch (e) {
      progression = {};
    }

    if (!progression || typeof progression !== 'object') progression = {};

    var normalized = {};
    try {
      Object.keys(progression).forEach(function (key) {
        var normalizedKey = normalizeKey(key);
        var value = progression[key];

        if (value === true) {
          value = 'done';
          migrated = true;
        }

        if (value !== 'done' && value !== 'in_progress') {
          migrated = true;
          return;
        }

        if (!normalizedKey) {
          migrated = true;
          return;
        }

        var current = normalized[normalizedKey];
        if (current === 'done') return;
        if (value === 'done' || !current) normalized[normalizedKey] = value;
        else if (current !== 'in_progress' && value === 'in_progress') normalized[normalizedKey] = value;
        if (normalizedKey !== key) migrated = true;
      });
    } catch (e) { }

    if (migrated) saveAllStates(normalized);
    return normalized;
  }

  function setStateForKey(key, state) {
    var normalizedKey = normalizeKey(key);
    if (!normalizedKey) return;
    var nextState = state === 'done' ? 'done' : state === 'in_progress' ? 'in_progress' : 'todo';
    try {
      var data = loadAllStates();
      if (nextState === 'todo') delete data[normalizedKey];
      else data[normalizedKey] = nextState;
      saveAllStates(data);
    } catch (e) { }
    try {
      if (typeof CustomEvent === 'function') {
        document.dispatchEvent(new CustomEvent('proactif:progress-changed', { detail: { key: normalizedKey, state: nextState } }));
      }
    } catch (e) { }
  }

  function getStateForKey(key) {
    var normalizedKey = normalizeKey(key);
    if (!normalizedKey) return null;
    try {
      var data = loadAllStates();
      return data[normalizedKey] || null;
    } catch (e) { return null; }
  }

  function markInProgress() {
    if (!exerciseKey) return;
    if (getStateForKey(exerciseKey) === 'done') return;
    setStateForKey(exerciseKey, 'in_progress');
  }

  function markDone() {
    if (!exerciseKey) return;
    if (getStateForKey(exerciseKey) === 'done') return;
    setStateForKey(exerciseKey, 'done');
    showCompletionToast();
  }

  function markTodo() {
    if (!exerciseKey) return;
    setStateForKey(exerciseKey, 'todo');
  }

  function syncBackLink() {
    var link = document.querySelector('.back-home__link');
    if (!link) return;

    try {
      link.textContent = '← Retour au menu';
    } catch (e) { }

    try {
      link.href = getIndexHref();
    } catch (e) { }
  }

  function ensureFloatingMenuButton() {
    var container = document.querySelector('.proactif-menu-container');
    if (!container) {
      try {
        container = document.createElement('div');
        container.className = 'proactif-menu-container';
        document.body.appendChild(container);
      } catch (e) {
        return;
      }
    }

    var hero = null;
    try { hero = document.querySelector('.exercise-hero'); } catch (e) { hero = null; }

    var existingLink = null;
    try { existingLink = document.querySelector('.back-home__link'); } catch (e) { existingLink = null; }

    var linkInHero = false;
    try { linkInHero = !!(existingLink && hero && hero.contains(existingLink)); } catch (e) { linkInHero = false; }

    var button = null;
    if (existingLink && !linkInHero) {
      button = existingLink;
      try { button.classList.add('proactif-menu-button'); } catch (e) { }
      try { container.appendChild(button); } catch (e) { }
    } else {
      button = container.querySelector('.proactif-menu-button');
      if (!button) {
        try {
          button = document.createElement('a');
          button.className = 'proactif-menu-button';
          container.appendChild(button);
        } catch (e) {
          return;
        }
      }
    }

    try { button.removeAttribute('style'); } catch (e) { }
    try { button.href = getIndexHref(); } catch (e) { }
    try { button.textContent = '← Menu'; } catch (e) { }
    try { button.setAttribute('aria-label', 'Retour au menu'); } catch (e) { }

    // If we have an exercise hero header, show the floating menu after scrolling
    // so the header stays clean while still providing quick access.
    try {
      if (!container.getAttribute('data-proactif-visibility')) {
        container.setAttribute('data-proactif-visibility', '1');
        if (hero) container.classList.add('proactif-menu-container--hidden');

        var ticking = false;
        function getScrollY() {
          return window.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || 0;
        }
        function computeThreshold() {
          try { return (hero ? (hero.offsetTop + hero.offsetHeight + 12) : 0); } catch (e) { return 0; }
        }
        function update() {
          ticking = false;
          if (!hero) {
            container.classList.remove('proactif-menu-container--hidden');
            return;
          }
          var threshold = computeThreshold();
          if (getScrollY() > threshold) container.classList.remove('proactif-menu-container--hidden');
          else container.classList.add('proactif-menu-container--hidden');
        }
        function requestUpdate() {
          if (ticking) return;
          ticking = true;
          if (window.requestAnimationFrame) window.requestAnimationFrame(update);
          else setTimeout(update, 16);
        }
        update();
        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', requestUpdate);
      }
    } catch (e) { }

    try {
      var containers = document.querySelectorAll('.back-home');
      for (var i = 0; i < containers.length; i++) {
        var candidate = containers[i];
        if (!candidate) continue;
        if (candidate.querySelector('.back-home__link')) continue;
        if (candidate.children && candidate.children.length) continue;
        if ((candidate.textContent || '').trim().length) continue;
        try { candidate.remove(); } catch (e) {
          try { candidate.parentNode && candidate.parentNode.removeChild(candidate); } catch (e2) { }
        }
      }
    } catch (e) { }
  }

  var toastReady = false;
  var toastVisible = false;
  var toastHideTimer = null;

  function ensureToast() {
    if (toastReady) return;
    toastReady = true;

    try {
      var style = document.createElement('style');
      style.setAttribute('data-proactif-toast-style', '1');
      style.textContent =
        '.proactif-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%) translateY(16px);' +
        'max-width:min(560px,calc(100vw - 28px));padding:12px 14px;border-radius:14px;' +
        'background:rgba(15,23,42,.92);color:#fff;box-shadow:0 14px 38px rgba(0,0,0,.25);' +
        'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
        'display:flex;align-items:center;gap:10px;opacity:0;pointer-events:none;' +
        'transition:opacity .2s ease, transform .2s ease;z-index:2147483646}' +
        '.proactif-toast__badge{flex:0 0 auto;width:30px;height:30px;border-radius:10px;' +
        'background:linear-gradient(135deg,#22c55e,#16a34a);display:grid;place-items:center;' +
        'box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}' +
        '.proactif-toast__badge svg{width:18px;height:18px;fill:#fff}' +
        '.proactif-toast__content{min-width:0;display:flex;flex-direction:column;gap:2px}' +
        '.proactif-toast__title{font-weight:800;letter-spacing:.2px;line-height:1.1}' +
        '.proactif-toast__desc{opacity:.9;font-weight:600;font-size:13px;line-height:1.2}' +
        '.proactif-toast--show{opacity:1;transform:translateX(-50%) translateY(0)}' +
        '@media (prefers-reduced-motion:reduce){.proactif-toast{transition:none}}';
      document.head.appendChild(style);
    } catch (e) { }

    try {
      var toast = document.createElement('div');
      toast.className = 'proactif-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.innerHTML =
        '<div class="proactif-toast__badge" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>' +
        '</div>' +
        '<div class="proactif-toast__content">' +
        '<div class="proactif-toast__title">Exercice terminé</div>' +
        '<div class="proactif-toast__desc">Bravo, c’est enregistré dans votre progression.</div>' +
        '</div>';
      toast.addEventListener('click', function () {
        hideToast();
      });
      document.body.appendChild(toast);
    } catch (e) { }
  }

  function getToastEl() {
    try { return document.querySelector('.proactif-toast'); } catch (e) { return null; }
  }

  function showCompletionToast() {
    if (toastVisible) return;
    ensureToast();
    var el = getToastEl();
    if (!el) return;
    toastVisible = true;
    try { el.classList.add('proactif-toast--show'); } catch (e) { }
    try {
      if (toastHideTimer) clearTimeout(toastHideTimer);
      toastHideTimer = setTimeout(hideToast, 3200);
    } catch (e) { }
  }

  function hideToast() {
    ensureToast();
    var el = getToastEl();
    if (!el) return;
    toastVisible = false;
    try { el.classList.remove('proactif-toast--show'); } catch (e) { }
  }

  window.ProactifProgress = {
    STORAGE_KEY: STORAGE_KEY,
    LEGACY_KEY: LEGACY_KEY,
    normalizeKey: normalizeKey,
    loadAllStates: loadAllStates,
    saveAllStates: saveAllStates,
    getStateForKey: getStateForKey,
    setStateForKey: setStateForKey,
    getExerciseKey: getExerciseKey,
    getCurrentKey: function () { return exerciseKey; },
    getCurrentState: function () { return exerciseKey ? (getStateForKey(exerciseKey) || 'todo') : 'todo'; },
    setCurrentState: function (state) { setStateForKey(exerciseKey, state); },
    markInProgress: markInProgress,
    markDone: markDone,
    markTodo: markTodo,
    requiresScoreForKey: function (key) { var k = normalizeKey(key); return !!(k && SCORE_REQUIRED[k]); },
    currentRequiresScore: function () { return requiresScore; }
  };

  markInProgress();
  window.proactifMarkExerciseDone = markDone;
  window.proactifSetExerciseState = function (state) {
    if (!exerciseKey) return;
    if (state === 'done') markDone();
    else if (state === 'todo') markTodo();
    else markInProgress();
  };

  window.addEventListener('message', function (event) {
    try {
      var data = event.data;
      if (typeof data === 'string' && data === 'proactif:score-final') {
        markDone();
      } else if (data && data.type === 'proactif:score-final') {
        markDone();
      }
    } catch (e) { }
  });

  document.addEventListener('proactif:exercise-finished', markDone);

  function onReady() {
    if (!exerciseKey) return;
    syncBackLink();
    ensureToast();
    // Ensure this runs after other DOMContentLoaded handlers (e.g. exercise-layout.js).
    try { setTimeout(ensureFloatingMenuButton, 0); } catch (e) { ensureFloatingMenuButton(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
