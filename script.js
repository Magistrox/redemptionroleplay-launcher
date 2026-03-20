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
const updateBar    = document.getElementById('update-bar');
const updateLabel  = document.getElementById('update-label');
const updatePct    = document.getElementById('update-percent');
const updateTrack  = document.getElementById('update-track');
const updateFill   = document.getElementById('update-fill');
const btnUpdate    = document.getElementById('btn-update');

// 1. Téléchargement démarre
window.launcher.onUpdateDownloading(() => {
  updateBar.hidden   = false;
  updateTrack.hidden = false;
});

// 2. Progression en temps réel
window.launcher.onUpdateProgress(({ percent, bytesPerSecond }) => {
  const pct    = Math.round(percent);
  const speed  = (bytesPerSecond / 1024 / 1024).toFixed(1);
  updateFill.style.width    = `${pct}%`;
  updateLabel.textContent   = `⬇ Téléchargement en cours… ${speed} Mo/s`;
  updatePct.textContent     = `${pct}%`;
});

// 3. Prêt à installer
window.launcher.onUpdateReady(() => {
  updateFill.style.width  = '100%';
  updateLabel.textContent = '✦ Mise à jour prête';
  updatePct.textContent   = '';
  btnUpdate.hidden        = false;
});

btnUpdate.addEventListener('click', () => window.launcher.installUpdate());
