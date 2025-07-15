const apiKey = 'b4c3ad4bc5c3b5aa35fff185accf81d3';
const scrollAmt = 300;

const trays = document.getElementById('traysContainer');
const homeBtn = document.getElementById('homeBtn');
const searchIn = document.getElementById('searchInput');
const modal = document.getElementById('movieModal');
const titleEl = document.getElementById('modalTitle');
const synopsisEl = document.getElementById('modalSynopsis');
const trailerEl = document.getElementById('modalTrailer');
const detailsEl = document.getElementById('modalDetails');

homeBtn.onclick = () => {
  searchIn.value = '';
  trays.innerHTML = '';
  initTrays();
};

searchIn.onkeypress = e => {
  if (e.key === 'Enter') {
    const q = searchIn.value.trim();
    if (!q) return;
    trays.innerHTML = '';
    renderTray(`Search: ${q}`, q);
  }
};

async function renderTray(label, q) {
  const sec = document.createElement('div');
  sec.className = 'movie-section';
  sec.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">${label}</h2>
      <div class="nav-arrows">
        <button class="left">‹</button>
        <button class="right">›</button>
      </div>
    </div>
    <div class="scroll-tray"></div>`;
  trays.appendChild(sec);

  const tray = sec.querySelector('.scroll-tray');
  sec.querySelector('.left').onclick = () =>
    tray.scrollBy({ left: -scrollAmt, behavior: 'smooth' });
  sec.querySelector('.right').onclick = () =>
    tray.scrollBy({ left: scrollAmt, behavior: 'smooth' });

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(q)}`
  );
  const { results } = await res.json();

  results.forEach(m => {
    if (!m.poster_path) return;
    const c = document.createElement('div');
    c.className = 'card';
    c.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w300${m.poster_path}" alt="${m.title}" />
      <h3>${m.title}</h3>`;
    c.onclick = () => showDetails(m.id);
    tray.appendChild(c);
  });
}

async function fetchWikiInfobox(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/mobile-sections-lead/${encodeURIComponent(title)}`;
  const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const r = await fetch(proxy);
  if (!r.ok) throw new Error('Wiki fetch failed');
  return r.json();
}

async function showDetails(id) {
  const movRes = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=videos`
  );
  const movie = await movRes.json();

  titleEl.textContent = movie.title;
  synopsisEl.textContent = movie.overview || '';

  const tr = movie.videos.results.find(
    v => v.site === 'YouTube' && v.type === 'Trailer'
  );
  trailerEl.src = tr ? `https://www.youtube.com/embed/${tr.key}` : '';

  let wikiTitle = movie.title + ' film';
  try {
    const s = await fetch(
      `https://en.wikipedia.org/w/api.php?origin=*&action=query&list=search&srsearch=${encodeURIComponent(wikiTitle)}&format=json`
    );
    const j = await s.json();
    if (j.query.search.length) wikiTitle = j.query.search[0].title;
  } catch {}

  detailsEl.innerHTML = '<p>Loading Wikipedia data…</p>';
  try {
    const wiki = await fetchWikiInfobox(wikiTitle);
    const info = wiki.lead.infobox || [];
    if (!info.length) throw new Error('No infobox');
    detailsEl.innerHTML = info.map(row => {
      const val = typeof row.value === 'object'
        ? (row.value.plaintext || row.value.text || '')
        : row.value;
      return `<p><strong>${row.label}:</strong> ${val}</p>`;
    }).join('');
  } catch {
    try {
      const sumR = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`
      );
      const sumJ = await sumR.json();
      detailsEl.innerHTML = `
        <p>${sumJ.extract}</p>
        <p><a href="${sumJ.content_urls.desktop.page}" target="_blank" style="color:var(--accent)">
          Read full article on Wikipedia
        </a></p>`;
    } catch {
      detailsEl.innerHTML = '<p>Could not fetch Wikipedia data.</p>';
    }
  }

  modal.style.display = 'block';
}

function closeModal() {
  trailerEl.src = '';
  modal.style.display = 'none';
}

function initTrays() {
  renderTray('Trending Now','Avengers');
  renderTray('Sci-Fi Spotlight','Guardians');
  renderTray('Action Picks','John Wick');
  renderTray('Laughs & Comedies','Minions');
  renderTray('Family Fun','How to Train Your Dragon');
}

initTrays();
