(function () {
  var STORAGE_KEY = 'proactif_game_ui_v1';
  var AUDIO_IDLE_CLOSE_MS = 12000;
  var MAX_TOASTS = 3;

  var audioState = {
    ctx: null,
    closeTimer: null
  };

  function getPrefs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function setPrefs(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {}
  }

  function prefersReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {
      return false;
    }
  }

  function nowMs() {
    try {
      return (performance && typeof performance.now === 'function') ? performance.now() : Date.now();
    } catch (e) {
      return Date.now();
    }
  }

  function ensureHost(container) {
    if (!container) return null;
    var host = container.querySelector('.toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'toast-host';
      container.appendChild(host);
    }
    return host;
  }

  function toast(container, message, type, timeoutMs) {
    try {
      var host = ensureHost(container);
      if (!host) return;
      try {
        while (host.children && host.children.length >= MAX_TOASTS) {
          host.removeChild(host.firstChild);
        }
      } catch (e) {}

      var el = document.createElement('div');
      el.className = 'toast toast--' + (type || 'info');
      el.textContent = String(message || '');
      host.appendChild(el);
      var timeout = typeof timeoutMs === 'number' ? timeoutMs : 1500;
      setTimeout(function () {
        try { el.remove(); } catch (e) { try { el.parentNode && el.parentNode.removeChild(el); } catch (e2) {} }
      }, timeout);
    } catch (e) {}
  }

  function confettiBurst(container, anchorEl) {
    if (!container || prefersReducedMotion()) return;
    try {
      var layer = container.querySelector('.confetti');
      if (!layer) {
        layer = document.createElement('div');
        layer.className = 'confetti';
        container.appendChild(layer);
      }

      var containerRect = null;
      var anchorRect = null;
      try { containerRect = container.getBoundingClientRect(); } catch (e) { containerRect = null; }
      try { anchorRect = (anchorEl || container).getBoundingClientRect(); } catch (e) { anchorRect = null; }
      var originX = 120;
      var originY = 70;
      if (containerRect && anchorRect) {
        originX = (anchorRect.left - containerRect.left) + (anchorRect.width / 2);
        originY = (anchorRect.top - containerRect.top) + Math.min(anchorRect.height * 0.25, 120);
        originX = Math.max(20, Math.min(containerRect.width - 20, originX));
        originY = Math.max(12, Math.min(containerRect.height - 60, originY));
      } else if (containerRect) {
        originX = containerRect.width / 2;
        originY = Math.min(containerRect.height * 0.2, 120);
      }

      var colors = ['#0b6bff', '#16a34a', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];
      var pieces = 14;
      for (var i = 0; i < pieces; i++) {
        var piece = document.createElement('div');
        piece.className = 'confetti__piece';
        piece.style.left = (originX + (Math.random() * 24 - 12)) + 'px';
        piece.style.top = (originY + (Math.random() * 14 - 7)) + 'px';
        piece.style.background = colors[i % colors.length];
        piece.style.setProperty('--dx', (Math.random() * 180 - 90).toFixed(0) + 'px');
        piece.style.setProperty('--rot', (Math.random() * 420 - 210).toFixed(0) + 'deg');
        layer.appendChild(piece);
        piece.addEventListener('animationend', function (ev) {
          try { ev.target && ev.target.remove(); } catch (e) {}
        });
      }

      setTimeout(function () {
        try {
          // Remove empty layer lazily (avoid DOM growth).
          if (layer && layer.children && layer.children.length === 0) layer.remove();
        } catch (e) {}
      }, 900);
    } catch (e) {}
  }

  function vibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  }

  function getAudioContext() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;

      if (audioState.ctx && audioState.ctx.state === 'closed') audioState.ctx = null;
      if (!audioState.ctx) audioState.ctx = new AudioCtx();

      if (audioState.closeTimer) {
        clearTimeout(audioState.closeTimer);
        audioState.closeTimer = null;
      }
      audioState.closeTimer = setTimeout(function () {
        try {
          if (audioState.ctx && audioState.ctx.state !== 'closed') {
            audioState.ctx.close && audioState.ctx.close();
          }
        } catch (e) {}
        audioState.ctx = null;
        audioState.closeTimer = null;
      }, AUDIO_IDLE_CLOSE_MS);

      try {
        if (audioState.ctx.state === 'suspended') {
          // Might require a user gesture; ignore errors.
          audioState.ctx.resume && audioState.ctx.resume();
        }
      } catch (e) {}

      return audioState.ctx;
    } catch (e) {
      return null;
    }
  }

  function playTone(kind) {
    var prefs = getPrefs();
    if (prefs.sound === false) return;
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      var type = 'sine';
      var freq = 440;
      var dur = 0.09;
      if (kind === 'ok') { type = 'triangle'; freq = 660; dur = 0.075; }
      if (kind === 'bad') { type = 'sawtooth'; freq = 190; dur = 0.12; }
      if (kind === 'level') { type = 'square'; freq = 520; dur = 0.11; }

      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = 0.0001;

      osc.connect(gain);
      gain.connect(ctx.destination);

      var t0 = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      osc.start(t0);
      osc.stop(t0 + dur + 0.01);
      osc.onended = function () {
        try { osc.disconnect(); } catch (e) {}
        try { gain.disconnect(); } catch (e) {}
      };
    } catch (e) {}
  }

  function bindToggle(buttonEl) {
    if (!buttonEl) return;
    try {
      var prefs = getPrefs();
      var pressed = prefs.sound !== false;
      buttonEl.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      buttonEl.textContent = pressed ? '🔊 Son' : '🔇 Son';
      buttonEl.addEventListener('click', function () {
        var next = getPrefs();
        next.sound = !(next.sound !== false);
        setPrefs(next);
        var on = next.sound !== false;
        buttonEl.setAttribute('aria-pressed', on ? 'true' : 'false');
        buttonEl.textContent = on ? '🔊 Son' : '🔇 Son';
        if (on) playTone('level');
        else vibrate(12);
      });
    } catch (e) {}
  }

  window.ProactifGameUI = {
    getPrefs: getPrefs,
    setPrefs: setPrefs,
    toast: toast,
    confettiBurst: confettiBurst,
    vibrate: vibrate,
    playTone: playTone,
    bindSoundToggle: bindToggle
  };
})();
