(() => {
  'use strict';

  const BACKEND_URL = window.FF_BACKEND_URL || 'https://script.google.com/macros/s/AKfycbyAShO3c_FLVqp-fisabNx_DMuLD0UYMPygU22_jQfpLjIs796fgsJPo3viZq5FGeYd1A/exec';
  const GAME_URL = 'assets/code/frenzy.html';
  const REFRESH_MS = 12000;
  const KEYS = {
    guestToken: 'ff:guest-token:v2',
    legacyToken: 'ff:guest-token:v1',
    guest: 'ff:guest-profile:v2',
    displayName: 'ff:lobby-display-name:v2',
    activeLobby: 'ff:active-lobby:v2',
    legacyLobby: 'ff:active-lobby:v1',
    music: 'ferretFrenzy.music'
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const el = {
    displayName: $('#displayName'),
    createPrivateButton: $('#createPrivateButton'),
    createPublicButton: $('#createPublicButton'),
    targetPlayers: $('#targetPlayers'),
    allowBots: $('#allowBots'),
    autoFillBots: $('#autoFillBots'),
    codeForm: $('#codeForm'),
    friendCode: $('#friendCode'),
    gamesList: $('#gamesList'),
    publicGameCount: $('#publicGameCount'),
    refreshButton: $('#refreshButton'),
    musicButton: $('#musicButton'),
    installButton: $('#installButton'),
    installText: $('#installText'),
    connectionChip: $('#connectionChip'),
    connectionText: $('#connectionText'),
    lastUpdated: $('#lastUpdated'),
    railStatus: $('#railStatus'),
    toast: $('#toast'),
    busyMask: $('#busyMask'),
    busyText: $('#busyText'),
    lobbyMusic: $('#lobbyMusic')
  };

  let publicGames = [];
  let refreshTimer = null;
  let toastTimer = null;
  let sessionGuest = null;
  let guestValidated = false;
  let deferredInstallPrompt = null;
  let musicWanted = localStorage.getItem(KEYS.music) !== 'off';
  let activeRoleReservation = null;

  async function reserveRoleOnEntry(view, source = 'create/join') {
    if (!view?.game?.code || !view?.me?.id) return null;
    const moduleUrl = new URL('js/assign-role.js', window.location.href).href;
    const roles = await import(moduleUrl);
    activeRoleReservation = roles.reserveLobbyView(view, { source });
    try { localStorage.setItem(`ff:my-role-reservation:${view.game.code}`, JSON.stringify(activeRoleReservation)); } catch {}
    return activeRoleReservation;
  }

  function safeJson(value, fallback = null) {
    try { return JSON.parse(value); } catch { return fallback; }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function setConnection(state, text) {
    el.connectionChip.dataset.state = state;
    el.connectionText.textContent = text;
  }

  function setBusy(on, text = 'Opening burrow…') {
    el.busyMask.hidden = !on;
    el.busyText.textContent = text;
  }

  function showToast(message, kind = 'info', duration = 3000) {
    clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.dataset.kind = kind;
    el.toast.hidden = false;
    toastTimer = setTimeout(() => { el.toast.hidden = true; }, duration);
  }

  async function apiCall(action, data = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action, data }),
        cache: 'no-store',
        redirect: 'follow',
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Lobby server returned HTTP ${response.status}.`);
      const payload = await response.json();
      if (payload && payload.ok === false) {
        const info = payload.error || {};
        const error = new Error(info.message || 'Ferret Frenzy lobby error.');
        error.code = info.code || 'API_ERROR';
        throw error;
      }
      return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
    } catch (error) {
      if (error && error.name === 'AbortError') throw new Error('Lobby server timed out. Try again.');
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function desiredName() {
    const cleaned = String(el.displayName.value || '')
      .replace(/[<>\r\n\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 24);
    return cleaned || 'Ferret';
  }

  function saveGuest(data) {
    sessionGuest = data.guest || null;
    guestValidated = true;
    if (data.guestToken) {
      localStorage.setItem(KEYS.guestToken, data.guestToken);
      localStorage.setItem(KEYS.legacyToken, data.guestToken);
    }
    if (sessionGuest) {
      localStorage.setItem(KEYS.guest, JSON.stringify(sessionGuest));
      localStorage.setItem(KEYS.displayName, sessionGuest.displayName || desiredName());
      el.displayName.value = sessionGuest.displayName || desiredName();
    }
    return data;
  }

  async function ensureGuest() {
    const name = desiredName();
    const token = localStorage.getItem(KEYS.guestToken) || localStorage.getItem(KEYS.legacyToken) || '';
    const cached = safeJson(localStorage.getItem(KEYS.guest), null);

    if (token && cached && cached.displayName === name) {
      sessionGuest = cached;
      if (guestValidated) return { guestToken: token, guest: cached };
      try {
        return saveGuest(await apiCall('guest.resume', { guestToken: token }));
      } catch {
        guestValidated = false;
      }
    }

    return saveGuest(await apiCall('guest.create', { displayName: name, avatarKey: `ferret-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 16)}` }));
  }

  function saveActiveLobby(view, guestToken) {
    const record = {
      savedAt: new Date().toISOString(),
      game: view?.game || null,
      me: view?.me || null,
      participants: view?.participants || [],
      share: view?.share || null,
      guest: sessionGuest,
      guestToken,
      roleReservation: activeRoleReservation
    };
    localStorage.setItem(KEYS.activeLobby, JSON.stringify(record));
    localStorage.setItem(KEYS.legacyLobby, JSON.stringify(record));
    if (view?.game?.code && view?.game?.id) {
      localStorage.setItem(`ff:game-id:${view.game.code}`, view.game.id);
    }
  }

  function launchFrenzy(view, guestToken) {
    saveActiveLobby(view, guestToken);
    const game = view?.game || {};
    const me = view?.me || {};
    const url = new URL(GAME_URL, window.location.href);
    if (game.code) {
      url.searchParams.set('room', String(game.code));
      url.searchParams.set('code', String(game.code));
    }
    if (game.id) url.searchParams.set('gameId', String(game.id));
    if (me.id) url.searchParams.set('device', String(me.id));
    url.searchParams.set('from', 'lobby');
    window.location.assign(url.href);
  }

  function normalizeCode(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 6);
  }

  function renderGames() {
    el.publicGameCount.textContent = String(publicGames.length);
    if (!publicGames.length) {
      el.gamesList.innerHTML = '<div class="empty-state"><div class="empty-ferret">🐾</div><strong>No public burrows are open right now.</strong><span>Create a public game, or enter a friend code on the left.</span></div>';
      return;
    }

    el.gamesList.innerHTML = publicGames.map(game => {
      const count = Number(game.playerCount || 0);
      const max = Number(game.maxPlayers || 10);
      const joinable = game.joinable !== false && count < max;
      const humans = Number(game.humanCount ?? count);
      const bots = Number(game.botCount || 0);
      const difficulty = String(game.botDifficulty || 'NORMAL').toUpperCase();
      return `<article class="game-card ${joinable ? '' : 'is-full'}" data-game-id="${escapeHtml(game.id || '')}" data-game-code="${escapeHtml(game.code || '')}">
        <button class="game-join-hit" type="button" ${joinable ? '' : 'disabled'} aria-label="${joinable ? 'Join' : 'Full'} ${escapeHtml(game.name || 'Ferret Frenzy')}"></button>
        <div class="room-avatar" aria-hidden="true">🐾</div>
        <div class="room-copy">
          <div class="room-title-line"><strong>${escapeHtml(game.name || 'Ferret Frenzy')}</strong><span class="room-code">#${escapeHtml(game.code || '------')}</span></div>
          <div class="room-meta"><span>${humans} HUMAN${humans === 1 ? '' : 'S'}</span><span>${bots} BOT${bots === 1 ? '' : 'S'}</span><span>${escapeHtml(difficulty)}</span></div>
        </div>
        <div class="room-meter"><strong>${count}/${max}</strong><span>${joinable ? 'JOIN' : 'FULL'}</span></div>
      </article>`;
    }).join('');
  }

  async function refreshGames(silent = false) {
    el.gamesList.setAttribute('aria-busy', 'true');
    if (!silent) el.refreshButton.classList.add('spinning');
    try {
      const data = await apiCall('lobby.public', { limit: 60 });
      publicGames = Array.isArray(data?.games) ? data.games : [];
      renderGames();
      const now = new Date();
      el.lastUpdated.textContent = `UPDATED ${now.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}).toUpperCase()}`;
      setConnection('online', 'SERVER ONLINE');
      el.railStatus.textContent = `${publicGames.length} PUBLIC BURROW${publicGames.length === 1 ? '' : 'S'} OPEN`;
    } catch (error) {
      setConnection('offline', 'SERVER UNAVAILABLE');
      el.railStatus.textContent = 'LOBBY SERVER UNAVAILABLE';
      if (!publicGames.length) {
        el.gamesList.innerHTML = `<div class="empty-state error"><div class="empty-ferret">⚠</div><strong>Could not load public games.</strong><span>${escapeHtml(error.message || 'Use Refresh to try again.')}</span></div>`;
      }
      if (!silent) showToast(error.message || 'Could not refresh games.', 'error');
    } finally {
      el.gamesList.setAttribute('aria-busy', 'false');
      el.refreshButton.classList.remove('spinning');
    }
  }

  async function createLobby(visibility) {
    setBusy(true, visibility === 'PUBLIC' ? 'Creating public burrow…' : 'Creating private burrow…');
    try {
      const guestData = await ensureGuest();
      const targetPlayers = Number(el.targetPlayers.value || 6);
      const view = await apiCall('lobby.create', {
        guestToken: guestData.guestToken,
        name: `${guestData.guest.displayName}'s Burrow`,
        visibility,
        maxPlayers: 10,
        targetPlayers,
        allowBots: el.allowBots.checked,
        autoFillBots: el.autoFillBots.checked,
        botDifficulty: 'NORMAL'
      });
      await reserveRoleOnEntry(view, 'create');
      showToast(`Burrow ${view?.game?.code || ''} created. Role slot reserved. Opening Ferret Frenzy…`, 'success', 1400);
      setTimeout(() => launchFrenzy(view, guestData.guestToken), 180);
    } catch (error) {
      showToast(error.message || 'Could not create a game.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function joinLobby(data, busyText = 'Joining burrow…') {
    setBusy(true, busyText);
    try {
      const guestData = await ensureGuest();
      const view = await apiCall('lobby.join', { guestToken: guestData.guestToken, ...data });
      await reserveRoleOnEntry(view, 'join');
      showToast(`Joined ${view?.game?.name || 'Ferret Frenzy'}. Role slot reserved. Opening game…`, 'success', 1400);
      setTimeout(() => launchFrenzy(view, guestData.guestToken), 180);
    } catch (error) {
      showToast(error.message || 'Could not join that game.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function setupMusic() {
    el.lobbyMusic.volume = 0.46;
    el.musicButton.setAttribute('aria-pressed', String(musicWanted));
    const tryPlay = () => {
      if (!musicWanted) return;
      const play = el.lobbyMusic.play();
      if (play && typeof play.catch === 'function') play.catch(() => {});
    };
    tryPlay();
    document.addEventListener('pointerdown', tryPlay, { once: true, passive: true });
    document.addEventListener('keydown', tryPlay, { once: true });
  }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function updateInstallButton() {
    if (isStandalone()) {
      el.installButton.classList.add('is-installed');
      el.installButton.classList.remove('is-unavailable');
      el.installText.textContent = 'APP INSTALLED';
      el.installButton.title = 'Ferret Frenzy is installed';
      return;
    }
    el.installButton.classList.remove('is-installed');
    el.installText.textContent = 'DOWNLOAD APP';
    el.installButton.classList.toggle('is-unavailable', !deferredInstallPrompt);
  }

  async function installApp() {
    if (isStandalone()) {
      showToast('Ferret Frenzy is already running as an installed app.', 'success');
      return;
    }

    if (deferredInstallPrompt) {
      const promptEvent = deferredInstallPrompt;
      deferredInstallPrompt = null;
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice.catch(() => null);
      if (choice?.outcome === 'accepted') showToast('Ferret Frenzy app install accepted.', 'success');
      else showToast('App install was not completed.', 'info');
      updateInstallButton();
      return;
    }

    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) {
      showToast('On iPhone/iPad: open Safari Share, then choose “Add to Home Screen.”', 'info', 5500);
    } else {
      showToast('Use your browser’s Install App / Add to Home Screen option. The install button activates automatically when the browser exposes it.', 'info', 5500);
    }
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js', {scope:'./'})
        .catch(error => console.warn('Ferret Frenzy service worker:', error));
    });
  }

  el.refreshButton.addEventListener('click', () => refreshGames(false));
  el.createPrivateButton.addEventListener('click', () => createLobby('PRIVATE'));
  el.createPublicButton.addEventListener('click', () => createLobby('PUBLIC'));

  el.codeForm.addEventListener('submit', event => {
    event.preventDefault();
    const code = normalizeCode(el.friendCode.value);
    el.friendCode.value = code;
    if (code.length !== 6) {
      showToast('Friend code must be six digits.', 'error');
      el.friendCode.focus();
      return;
    }
    joinLobby({ code }, 'Joining friend burrow…');
  });

  el.friendCode.addEventListener('input', () => { el.friendCode.value = normalizeCode(el.friendCode.value); });
  el.displayName.addEventListener('change', () => {
    const name = desiredName();
    el.displayName.value = name;
    localStorage.setItem(KEYS.displayName, name);
    guestValidated = false;
  });

  el.gamesList.addEventListener('click', event => {
    const card = event.target.closest('.game-card');
    if (!card || card.classList.contains('is-full')) return;
    const game = publicGames.find(item => String(item.id || '') === card.dataset.gameId) || publicGames.find(item => String(item.code || '') === card.dataset.gameCode);
    if (!game) return;
    const joinData = game.id ? { gameId: game.id } : { code: game.code };
    joinLobby(joinData, `Joining ${game.name || 'public burrow'}…`);
  });

  el.musicButton.addEventListener('click', () => {
    musicWanted = !musicWanted;
    localStorage.setItem(KEYS.music, musicWanted ? 'on' : 'off');
    el.musicButton.setAttribute('aria-pressed', String(musicWanted));
    if (musicWanted) el.lobbyMusic.play().catch(() => showToast('Tap once more if your browser blocks autoplay.', 'info'));
    else el.lobbyMusic.pause();
  });

  el.installButton.addEventListener('click', installApp);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButton();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    updateInstallButton();
    showToast('Ferret Frenzy was installed.', 'success');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshGames(true);
  });

  const savedName = localStorage.getItem(KEYS.displayName);
  const savedGuest = safeJson(localStorage.getItem(KEYS.guest), null);
  el.displayName.value = savedName || savedGuest?.displayName || 'Ferret';

  const params = new URLSearchParams(location.search);
  const joinCode = normalizeCode(params.get('join') || params.get('code'));
  if (joinCode) el.friendCode.value = joinCode;

  setupMusic();
  updateInstallButton();
  registerServiceWorker();
  refreshGames(true);
  refreshTimer = setInterval(() => {
    if (document.visibilityState === 'visible') refreshGames(true);
  }, REFRESH_MS);
  window.addEventListener('beforeunload', () => clearInterval(refreshTimer));
})();
