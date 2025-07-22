const apiKey = 'b4c3ad4bc5c3b5aa35fff185accf81d3';
const scrollAmt = 300;
let scrollInterval;

const trays = document.getElementById('traysContainer');
const homeBtn = document.getElementById('homeBtn');
const searchIn = document.getElementById('searchInput');
const modal = document.getElementById('movieModal');
const titleEl = document.getElementById('modalTitle');
const synopsisEl = document.getElementById('modalSynopsis');
const trailerEl = document.getElementById('modalTrailer');
const detailsEl = document.getElementById('modalDetails');

const genreDropdown = document.querySelector('.genre-dropdown');
const genreBtn = document.querySelector('.genre-btn');
const genreList = document.querySelector('.genre-list');

genreBtn.onclick = (e) => {
  e.stopPropagation();
  genreDropdown.classList.toggle('open');
};

document.addEventListener('click', (e) => {
  if (!genreDropdown.contains(e.target)) {
    genreDropdown.classList.remove('open');
  }
});

genreList.querySelectorAll('div').forEach(item => {
  item.onclick = async () => {
    genreDropdown.classList.remove('open');
    const genreId = item.getAttribute('data-genre');
    const genreName = item.textContent;
    trays.innerHTML = '';

    const res = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genreId}`
    );
    const {
      results
    } = await res.json();
    renderTray(`Genre: ${genreName}`, '', results);
  };
});

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

function startScroll(direction, tray) {
  stopScroll();
  scrollInterval = setInterval(() => {
    tray.scrollLeft += direction * 10;
  }, 16);
}

function stopScroll() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
}

function updateArrowVisibility(tray, leftArrow, rightArrow) {
  const scrollContainer = tray.parentElement;
  const navArrowsWrapper = scrollContainer.querySelector('.nav-arrows');

  const scrollLeft = tray.scrollLeft;
  const scrollWidth = tray.scrollWidth;
  const clientWidth = tray.clientWidth;

  const threshold = 10;

  const isOverflowing = scrollWidth > clientWidth;

  if (isOverflowing) {
    navArrowsWrapper.classList.add('visible');

    if (scrollLeft < threshold) {
      leftArrow.style.opacity = '0';
      leftArrow.style.pointerEvents = 'none';
    } else {
      leftArrow.style.opacity = '0.7';
      leftArrow.style.pointerEvents = 'auto';
    }

    if (scrollLeft + clientWidth >= scrollWidth - threshold - 1) {
      rightArrow.style.opacity = '0';
      rightArrow.style.pointerEvents = 'none';
    } else {
      rightArrow.style.opacity = '0.7';
      rightArrow.style.pointerEvents = 'auto';
    }
  } else {
    navArrowsWrapper.classList.remove('visible');
    leftArrow.style.opacity = '0';
    leftArrow.style.pointerEvents = 'none';
    rightArrow.style.opacity = '0';
    rightArrow.style.pointerEvents = 'none';
  }
}

async function renderTray(label, q, resultsOverride) {
  const sec = document.createElement('div');
  sec.className = 'movie-section';
  sec.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">${label}</h2>
    </div>
    <div class="scroll-area-container">
      <div class="nav-arrows">
        <button class="left">‹</button>
        <button class="right">›</button>
      </div>
      <div class="scroll-tray"></div>
    </div>`;
  trays.appendChild(sec);

  const tray = sec.querySelector('.scroll-tray');
  const leftBtn = sec.querySelector('.left');
  const rightBtn = sec.querySelector('.right');

  requestAnimationFrame(() => {
    updateArrowVisibility(tray, leftBtn, rightBtn);
  });


  tray.addEventListener('scroll', () => {
    updateArrowVisibility(tray, leftBtn, rightBtn);
  });

  window.addEventListener('resize', () => {
    updateArrowVisibility(tray, leftBtn, rightBtn);
  });


  leftBtn.onclick = () => tray.scrollBy({
    left: -scrollAmt,
    behavior: 'smooth'
  });
  rightBtn.onclick = () => tray.scrollBy({
    left: scrollAmt,
    behavior: 'smooth'
  });

  ['mousedown', 'touchstart'].forEach(evt =>
    leftBtn.addEventListener(evt, () => startScroll(-1, tray))
  );
  ['mouseup', 'mouseleave', 'touchend'].forEach(evt =>
    leftBtn.addEventListener(evt, stopScroll)
  );

  ['mousedown', 'touchstart'].forEach(evt =>
    rightBtn.addEventListener(evt, () => startScroll(1, tray))
  );
  ['mouseup', 'mouseleave', 'touchend'].forEach(evt =>
    rightBtn.addEventListener(evt, stopScroll)
  );

  let results = resultsOverride;
  if (!results) {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(q)}`
    );
    const data = await res.json();
    results = data.results;
  }

  results.forEach(m => {
    if (!m.poster_path) return;

    let mediaType = 'Movie';
    if (m.media_type === 'tv' || m.first_air_date) {
      mediaType = 'TV Series';
    }

    const c = document.createElement('div');
    c.className = 'card-item-wrapper';

    c.innerHTML = `
      <div class="card"> <img src="https://image.tmdb.org/t/p/w300${m.poster_path}" alt="${m.title || m.name}" />
      </div>
      <div class="card-details-below"> <div class="card-meta">${mediaType}</div>
        <h3>${m.title || m.name}</h3> </div>
    `;
    c.onclick = () => showDetails(m.id);
    tray.appendChild(c);
  });

  const images = tray.querySelectorAll('img');
  let loadedImagesCount = 0;

  if (images.length > 0) {
    images.forEach(img => {
      if (img.complete) {
        loadedImagesCount++;
      } else {
        img.addEventListener('load', () => {
          loadedImagesCount++;
          if (loadedImagesCount === images.length) {
            updateArrowVisibility(tray, leftBtn, rightBtn);
          }
        });
      }
    });
    if (loadedImagesCount === images.length) {
      updateArrowVisibility(tray, leftBtn, rightBtn);
    }
  } else {
    updateArrowVisibility(tray, leftBtn, rightBtn);
  }
}

async function showDetails(id) {
  modal.style.display = 'block';
  titleEl.textContent = 'Loading...';
  synopsisEl.textContent = '';
  trailerEl.src = '';
  detailsEl.innerHTML = '<p class="loading-message">Loading details...</p>';

  const movieDetailsPromise = fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=videos,credits`
  ).then(res => res.json());

  const movie = await movieDetailsPromise;

  titleEl.textContent = movie.title || movie.name || 'N/A';
  synopsisEl.textContent = movie.overview || 'No synopsis available.';

  let tmdbDetailsHtml = '<div class="movie-details-box">';

  if (movie.vote_average) {
    tmdbDetailsHtml += `<p><strong>Rating:</strong> ${movie.vote_average.toFixed(1)}/10 (${movie.vote_count} votes)</p>`;
  }
  if (movie.release_date) {
    tmdbDetailsHtml += `<p><strong>Release Date:</strong> ${new Date(movie.release_date).toLocaleDateString()}</p>`;
  } else if (movie.first_air_date) {
    tmdbDetailsHtml += `<p><strong>First Air Date:</strong> ${new Date(movie.first_air_date).toLocaleDateString()}</p>`;
  }
  if (movie.runtime) {
    const hours = Math.floor(movie.runtime / 60);
    const minutes = movie.runtime % 60;
    tmdbDetailsHtml += `<p><strong>Runtime:</strong> ${hours}h ${minutes}m</p>`;
  }
  if (movie.genres && movie.genres.length > 0) {
    tmdbDetailsHtml += `<p><strong>Genres:</strong> ${movie.genres.map(g => g.name).join(', ')}</p>`;
  }
  if (movie.spoken_languages && movie.spoken_languages.length > 0) {
    tmdbDetailsHtml += `<p><strong>Languages:</strong> ${movie.spoken_languages.map(lang => lang.english_name).join(', ')}</p>`;
  }
  if (movie.production_companies && movie.production_companies.length > 0) {
    tmdbDetailsHtml += `<p><strong>Production:</strong> ${movie.production_companies.map(pc => pc.name).join(', ')}</p>`;
  }
  if (movie.credits && movie.credits.cast && movie.credits.cast.length > 0) {
    const topCast = movie.credits.cast.slice(0, 5).map(c => c.name).join(', ');
    tmdbDetailsHtml += `<p><strong>Starring:</strong> ${topCast}${movie.credits.cast.length > 5 ? '...' : ''}</p>`;
  }
  if (movie.credits && movie.credits.crew && movie.credits.crew.length > 0) {
    const director = movie.credits.crew.find(crew => crew.job === 'Director');
    if (director) {
      tmdbDetailsHtml += `<p><strong>Director:</strong> ${director.name}</p>`;
    }
  }
  tmdbDetailsHtml += '</div>';

  const initialLoadingMessage = detailsEl.querySelector('.loading-message');
  if (initialLoadingMessage) {
    initialLoadingMessage.remove();
  }

  detailsEl.innerHTML = tmdbDetailsHtml;

  loadWikipedia(movie.title || movie.name);

  const tr = movie.videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
  trailerEl.src = tr ? `https://www.youtube.com/embed/${tr.key}` : '';

}

function closeModal() {
  trailerEl.src = '';
  modal.style.display = 'none';
}

async function loadWikipedia(title) {
  const loadingMessageP = document.createElement('p');
  loadingMessageP.textContent = 'Loading Wikipedia summary...';
  loadingMessageP.classList.add('wiki-loading-message');
  detailsEl.appendChild(loadingMessageP);

  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    const data = await res.json();

    if (loadingMessageP && loadingMessageP.parentNode) {
      loadingMessageP.parentNode.removeChild(loadingMessageP);
    }

    if (data.extract) {
      detailsEl.innerHTML += `
        <div class="wiki-summary-box">
          <h4>Wikipedia Summary</h4>
          <p>${data.extract}</p>
          <a href="${data.content_urls.desktop.page}" target="_blank">Read more on Wikipedia</a>
        </div>
      `;
    } else {
      detailsEl.innerHTML += `
        <div class="wiki-summary-box">
          <h4>Wikipedia Summary</h4>
          <p>No Wikipedia summary found for "${title}".</p>
        </div>
      `;
    }
  } catch (err) {
    if (loadingMessageP && loadingMessageP.parentNode) {
      loadingMessageP.parentNode.removeChild(loadingMessageP);
    }
    detailsEl.innerHTML += `
      <div class="wiki-summary-box">
        <h4>Wikipedia Summary</h4>
        <p>Failed to load Wikipedia info for "${title}".</p>
      </div>
    `;
    console.error("Failed to load Wikipedia:", err);
  }
}

function initTrays() {
  renderTray('Trending Now', 'Avengers');
  renderTray('Sci-Fi Spotlight', 'Guardians');
  renderTray('Action Picks', 'John Wick');
  renderTray('Laughs & Comedies', 'Minions');
  renderTray('Family Fun', 'How to Train Your Dragon');
}

initTrays();

const nav = document.querySelector("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("shrink", window.scrollY > 10);
});
