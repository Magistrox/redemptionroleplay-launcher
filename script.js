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

// ── Compteur de joueurs (API CFX publique) ─
const CFX_ID     = 'b78a3l';
const CFX_API    = `https://servers-frontend.fivem.net/api/servers/single/${CFX_ID}`;
const statusDot  = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');

async function fetchPlayerCount() {
  try {
    const res  = await fetch(CFX_API);
    const json = await res.json();

    const count = json.Data?.clients        ?? 0;
    const max   = json.Data?.sv_maxclients  ?? '?';

    statusDot.style.background = '#4ade80';
    statusText.textContent     = `${count} / ${max} joueurs en ligne`;
  } catch {
    statusDot.style.background = '#ef4444';
    statusText.textContent     = 'Serveur hors ligne';
  }
}

fetchPlayerCount();
setInterval(fetchPlayerCount, 5 * 60 * 1000);

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
