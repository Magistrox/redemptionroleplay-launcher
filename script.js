// ── Version ───────────────────────────────
window.launcher.version().then(v => {
  document.querySelector('.footer span').textContent = `v${v}`;
});

// ── Contrôles de fenêtre ──────────────────
document.getElementById('btn-minimize').addEventListener('click', () => window.launcher.minimize());
document.getElementById('btn-close').addEventListener('click',    () => window.launcher.close());

// ── Bouton JOUER ──────────────────────────
const btnPlay   = document.getElementById('btn-play');
const playLabel = document.getElementById('play-label');

btnPlay.addEventListener('click', () => {
  btnPlay.disabled      = true;
  playLabel.textContent = 'CONNEXION…';
  window.launcher.play();
  setTimeout(() => {
    btnPlay.disabled      = false;
    playLabel.textContent = 'JOUER';
  }, 5000);
});

// ── Countdown ─────────────────────────────
const LAUNCH_DATE  = new Date('2026-04-11T19:00:00-04:00'); // 19h00 heure de l'Est (EDT)
const cdEl         = document.getElementById('countdown');
const cdDays       = document.getElementById('cd-days');
const cdHours      = document.getElementById('cd-hours');
const cdMinutes    = document.getElementById('cd-minutes');
const cdSeconds    = document.getElementById('cd-seconds');
const statusEl     = document.getElementById('status');

function updateCountdown() {
  const diff = LAUNCH_DATE - Date.now();

  if (diff <= 0) {
    cdEl.hidden             = true;
    btnPlay.style.display   = '';
    statusEl.style.display  = '';
    return;
  }

  btnPlay.style.display   = 'none';
  statusEl.style.display  = 'none';
  cdEl.hidden             = false;

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000)  / 60000);
  const s = Math.floor((diff % 60000)    / 1000);

  cdDays.textContent    = String(d).padStart(2, '0');
  cdHours.textContent   = String(h).padStart(2, '0');
  cdMinutes.textContent = String(m).padStart(2, '0');
  cdSeconds.textContent = String(s).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ── Compteur de joueurs (API CFX publique) ─
const CFX_ID     = 'b78a3l';
const CFX_API    = `https://servers-frontend.fivem.net/api/servers/single/${CFX_ID}`;
const statusDot  = document.querySelector('#status .status-dot');
const statusText = document.querySelector('#status .status-text');

async function fetchPlayerCount() {
  try {
    const res  = await fetch(CFX_API);
    const json = await res.json();

    if (json.error || !json.Data) {
      statusDot.style.background = '#f59e0b';
      statusText.textContent     = 'En maintenance';
      return;
    }

    const count = json.Data.clients       ?? 0;
    const max   = json.Data.sv_maxclients ?? '?';

    statusDot.style.background = '#4ade80';
    statusText.textContent     = `${count} / ${max} joueurs en ligne`;
  } catch {
    statusDot.style.background = '#f59e0b';
    statusText.textContent     = 'En maintenance';
  }
}

fetchPlayerCount();
setInterval(fetchPlayerCount, 5 * 60 * 1000);

// ── News ──────────────────────────────────
const NEWS_URL  = 'https://redemptionrp.xyz/launchernews.php';
const newsBody  = document.getElementById('news-body');

const newsPanel = document.querySelector('.news-panel');

async function fetchNews() {
  try {
    const res  = await fetch(NEWS_URL + '?t=' + Date.now());
    const html = await res.text();

    if (html.trim().toLowerCase().includes('aucune')) {
      newsPanel.style.display = 'none';
      return;
    }

    newsPanel.style.display = 'flex';
    newsBody.innerHTML      = html;
  } catch (e) {
    newsPanel.style.display = 'flex';
    newsBody.innerHTML      = '<p class="news-loading">Impossible de charger les actualités.</p>';
    console.error('News fetch error:', e);
  }
}

fetchNews();
setInterval(fetchNews, 10 * 60 * 1000);

// ── Auto-update ───────────────────────────
const updateScreen      = document.getElementById('update-screen');
const updateScreenLabel = document.getElementById('update-screen-label');
const updateScreenTrack = document.getElementById('update-screen-track');
const updateScreenFill  = document.getElementById('update-screen-fill');
const updateScreenPct   = document.getElementById('update-screen-pct');

function showLauncher() {
  updateScreen.classList.add('hidden');
}

// Countdown de vérification (5s)
let checkDone = false;
let checkCount = 5;
updateScreenLabel.textContent = `Vérification des mises à jour… ${checkCount}s`;
const checkInterval = setInterval(() => {
  checkCount--;
  if (checkCount > 0) {
    updateScreenLabel.textContent = `Vérification des mises à jour… ${checkCount}s`;
  } else {
    clearInterval(checkInterval);
  }
}, 1000);

// Aucune mise à jour → afficher le launcher
window.launcher.onUpdateNotAvailable(() => {
  clearInterval(checkInterval);
  showLauncher();
});

// Mise à jour disponible → téléchargement
window.launcher.onUpdateDownloading(() => {
  clearInterval(checkInterval);
  updateScreenLabel.textContent = 'Téléchargement de la mise à jour…';
  updateScreenTrack.hidden      = false;
});

// Progression
window.launcher.onUpdateProgress(({ percent, bytesPerSecond }) => {
  const pct   = Math.round(percent);
  const speed = (bytesPerSecond / 1024 / 1024).toFixed(1);
  updateScreenFill.style.width = `${pct}%`;
  updateScreenPct.textContent  = `${pct}% — ${speed} Mo/s`;
});

// Téléchargement terminé → installation automatique
window.launcher.onUpdateReady(() => {
  updateScreenFill.style.width = '100%';
  updateScreenPct.textContent  = '';
  let count = 3;
  updateScreenLabel.textContent = `Installation dans ${count}…`;
  const t = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(t);
      updateScreenLabel.textContent = 'Installation…';
      window.launcher.installUpdate();
    } else {
      updateScreenLabel.textContent = `Installation dans ${count}…`;
    }
  }, 1000);
});
