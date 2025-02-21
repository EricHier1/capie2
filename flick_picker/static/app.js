// Endpoints
const API_ENDPOINT = "http://127.0.0.1:5020/recommend";
const SEARCH_ENDPOINT = "http://127.0.0.1:5020/search";
const VISUALIZATION_ENDPOINT = "http://127.0.0.1:5020/visualizations";

let autocompleteTimer = null;

function normalizeTitle(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
    .replace(/&/g, 'and'); // Normalize '&' to 'and'
}

async function getRecommendations() {
  const titleInput = document.getElementById('movie-input');
  const resultsDiv = document.getElementById('results');
  const spinner = resultsDiv?.querySelector('.spinner-border');

  if (!titleInput || !resultsDiv) {
    console.error("DOM elements not found for title input or results container.");
    return;
  }

  const title = normalizeTitle(titleInput.value.trim());

  if (!title) {
    resultsDiv.innerHTML = '<p class="text-danger">Please enter a title.</p>';
    return;
  }

  // Ensure spinner is present in DOM before showing
  if (!spinner) {
    resultsDiv.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
  } else {
    spinner.style.display = 'block';
  }

  resultsDiv.innerHTML = ''; // Clear previous results

  const url = `${API_ENDPOINT}?title=${encodeURIComponent(title)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Hide spinner after response
    if (spinner) spinner.style.display = 'none';

    if (response.ok) {
      if (data.recommendations && data.recommendations.length > 0) {
        let html = `<h5>${data.message}</h5><ul class="list-group mt-2">`;

        data.recommendations.forEach(item => {
          html += '<li class="list-group-item">';
          if (item.title) html += `<strong>${item.title}</strong>`;
          if (item.similarity) {
            const similarityPercent = (item.similarity * 100).toFixed(2);
            html += `<span class="badge bg-primary float-end">Similarity: ${similarityPercent}%</span>`;
          }
          html += '</li>';
        });

        html += '</ul>';
        resultsDiv.innerHTML = html;
      } else {
        resultsDiv.innerHTML = `<p>No recommendations found for '${title}'.</p>`;
      }
    } else {
      resultsDiv.innerHTML = `<p class="text-danger">${data.message}</p>`;
    }
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    if (spinner) spinner.style.display = 'none';
    resultsDiv.innerHTML = '<p class="text-danger">Error fetching recommendations.</p>';
  }
}

function handleAutocomplete(event) {
  const query = event.target?.value.trim() || '';
  const suggestionBox = document.getElementById('autocomplete-list');

  if (!suggestionBox) {
    console.error('Autocomplete list not found');
    return;
  }

  suggestionBox.innerHTML = '';

  if (query.length < 2) return;

  clearTimeout(autocompleteTimer);
  autocompleteTimer = setTimeout(async () => {
    try {
      const res = await fetch(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`);
      const suggestions = await res.json();
      showSuggestions(suggestions);
    } catch (err) {
      console.error('Autocomplete error:', err);
    }
  }, 300);
}

function showSuggestions(suggestions) {
  const suggestionBox = document.getElementById('autocomplete-list');
  if (!suggestionBox) {
    console.error('Autocomplete list not found');
    return;
  }

  suggestionBox.innerHTML = '';

  if (!suggestions.length) return;

  suggestions.forEach(title => {
    const item = document.createElement('div');
    item.classList.add('list-group-item', 'list-group-item-action');
    item.textContent = title;
    item.addEventListener('click', () => {
      document.getElementById('movie-input').value = title;
      suggestionBox.innerHTML = '';
      getRecommendations();
    });
    suggestionBox.appendChild(item);
  });
}

async function loadVisualizations() {
  const visDiv = document.getElementById('visualizations');
  if (!visDiv) {
    console.error('Visualizations div not found');
    return;
  }

  const spinner = document.createElement('div');
  spinner.className = 'spinner-border text-primary';
  spinner.innerHTML = '<span class="visually-hidden">Loading...</span>';
  visDiv.innerHTML = '';
  visDiv.appendChild(spinner);

  try {
    const response = await fetch(VISUALIZATION_ENDPOINT);
    const data = await response.json();
    visDiv.removeChild(spinner);

    if (response.ok) {
      renderVisualizations(data);
    } else {
      visDiv.innerHTML = `<p class="text-danger">${data.message}</p>`;
    }
  } catch (error) {
    console.error('Error fetching visualizations:', error);
    visDiv.removeChild(spinner);
    visDiv.innerHTML = '<p class="text-danger">Error loading visualizations.</p>';
  }
}

function renderVisualizations(data) {
  const visDiv = document.getElementById('visualizations');
  if (!visDiv) {
    console.error('Visualizations div not found');
    return;
  }

  visDiv.innerHTML = `
    <h5>Data Insights</h5>
    <div class="row">
      <div class="col-md-4"><canvas id="genreChart"></canvas></div>
      <div class="col-md-4"><canvas id="typeChart"></canvas></div>
      <div class="col-md-4"><canvas id="countryChart"></canvas></div>
    </div>
  `;

  const genreCtx = document.getElementById('genreChart').getContext('2d');
  new Chart(genreCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(data.genre_distribution),
      datasets: [{ label: 'Number of Titles', data: Object.values(data.genre_distribution), backgroundColor: 'rgba(75, 192, 192, 0.6)' }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });

  const typeCtx = document.getElementById('typeChart').getContext('2d');
  new Chart(typeCtx, {
    type: 'pie',
    data: {
      labels: Object.keys(data.type_distribution),
      datasets: [{ data: Object.values(data.type_distribution), backgroundColor: ['#FF6384', '#36A2EB'] }]
    }
  });

  const countryCtx = document.getElementById('countryChart').getContext('2d');
  new Chart(countryCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(data.top_countries),
      datasets: [{ label: 'Number of Titles', data: Object.values(data.top_countries), backgroundColor: 'rgba(255, 159, 64, 0.6)' }]
    },
    options: { indexAxis: 'y', scales: { x: { beginAtZero: true } } }
  });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const recommendBtn = document.getElementById('recommend-btn');
  const movieInput = document.getElementById('movie-input');

  if (recommendBtn) {
    recommendBtn.addEventListener('click', getRecommendations);
  } else {
    console.error('Recommend button not found');
  }

  if (movieInput) {
    movieInput.addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        getRecommendations();
      } else {
        handleAutocomplete(event);
      }
    });
  } else {
    console.error('Movie input not found');
  }

  loadVisualizations();
});
