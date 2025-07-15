const apiKey = 'b4c3ad4bc5c3b5aa35fff185accf81d3';
const searchInput = document.getElementById('searchInput');
const movieGrid = document.getElementById('movieGrid');
const movieModal = document.getElementById('movieModal');
const modalTitle = document.getElementById('modalTitle');
const modalSynopsis = document.getElementById('modalSynopsis');
const modalTrailer = document.getElementById('modalTrailer');
const releaseDate = document.getElementById('releaseDate');
const runtime = document.getElementById('runtime');
const genres = document.getElementById('genres');
const country = document.getElementById('country');
const cast = document.getElementById('cast');
const imdbScore = document.getElementById('imdbScore');
const modalPoster = document.getElementById('modalPoster');

document.getElementById('homeBtn').onclick = () => {
  movieModal.style.display = 'none';
  searchInput.value = '';
  fetchMovies();
};

document.getElementById('backBtn').onclick = () => {
  closeModal();
};

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') fetchMovies(searchInput.value);
});

async function fetchMovies(query = 'Avengers') {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`
  );
  const { results } = await res.json();
  movieGrid.innerHTML = '';
  results.forEach((m) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w300${m.poster_path}" alt="${m.title}" />
      <h3>${m.title}</h3>
    `;
    card.onclick = () => showDetails(m.id);
    movieGrid.appendChild(card);
  });
}

async function showDetails(id) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=videos,credits`
  );
  const movie = await res.json();

  modalTitle.textContent = movie.title;
  modalSynopsis.textContent = movie.overview || 'No synopsis available.';
  releaseDate.textContent = movie.release_date || 'N/A';
  runtime.textContent = `${movie.runtime} min` || 'N/A';
  genres.textContent = movie.genres.map(g => g.name).join(', ');
  country.textContent = movie.production_countries.map(c => c.name).join(', ');
  cast.textContent = movie.credits.cast.slice(0, 5).map(c => c.name).join(', ');
  imdbScore.textContent = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  modalPoster.src = `https://image.tmdb.org/t/p/w300${movie.poster_path}`;

  const trailer = movie.videos.results.find(
    v => v.site === 'YouTube' && v.type === 'Trailer'
  );
  modalTrailer.src = trailer
    ? `https://www.youtube.com/embed/${trailer.key}`
    : '';

  movieModal.style.display = 'block';
}

function closeModal() {
  modalTrailer.src = '';
  movieModal.style.display = 'none';
}

fetchMovies();
