import { fetchVisualizations } from './api.js';

export async function loadVisualizations() {
  const visDiv = document.getElementById('visualizations');
  if (!visDiv) return;

  visDiv.innerHTML = '<div class="spinner-border text-primary"></div>';

  try {
    const data = await fetchVisualizations();
    visDiv.innerHTML = '';
    renderVisualizations(data);
  } catch (error) {
    console.error('Error loading visualizations:', error);
    visDiv.innerHTML = '<p class="text-danger">Error loading visualizations.</p>';
  }
}

function renderVisualizations(data) {
  const visDiv = document.getElementById('visualizations');
  visDiv.innerHTML = `
    <h5>Data Insights</h5>
    <div class="row">
      <div class="col-md-4"><canvas id="genreChart"></canvas></div>
      <div class="col-md-4"><canvas id="typeChart"></canvas></div>
      <div class="col-md-4"><canvas id="countryChart"></canvas></div>
    </div>
  `;

  new Chart(document.getElementById('genreChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: Object.keys(data.genre_distribution),
      datasets: [{ label: 'Number of Titles', data: Object.values(data.genre_distribution), backgroundColor: 'rgba(75, 192, 192, 0.6)' }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });

  new Chart(document.getElementById('typeChart').getContext('2d'), {
    type: 'pie',
    data: {
      labels: Object.keys(data.type_distribution),
      datasets: [{ data: Object.values(data.type_distribution), backgroundColor: ['#FF6384', '#36A2EB'] }]
    }
  });

  new Chart(document.getElementById('countryChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: Object.keys(data.top_countries),
      datasets: [{ label: 'Number of Titles', data: Object.values(data.top_countries), backgroundColor: 'rgba(255, 159, 64, 0.6)' }]
    },
    options: { indexAxis: 'y', scales: { x: { beginAtZero: true } } }
  });
}
