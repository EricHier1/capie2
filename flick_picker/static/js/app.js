import { fetchRecommendations } from './api.js';
import { showSpinner, hideSpinner, displayRecommendations, showError } from './ui.js';
import { handleAutocomplete } from './autocomplete.js';
import { loadVisualizations } from './visualizations.js';

document.addEventListener('DOMContentLoaded', () => {
  const recommendBtn = document.getElementById('recommend-btn');
  const movieInput = document.getElementById('movie-input');

  if (recommendBtn) {
    recommendBtn.addEventListener('click', getRecommendations);
  }

  if (movieInput) {
    movieInput.addEventListener('keyup', event => {
      console.log("Key pressed:", event.key);
      if (event.key === 'Enter') {
        console.log("Enter pressed, fetching recommendations...");
        getRecommendations();
      } else {
        console.log("Triggering autocomplete for:", event.target.value);
        handleAutocomplete(event);
      }
    }); 
  }

  loadVisualizations();
});

async function getRecommendations() {
  const titleInput = document.getElementById('movie-input');
  const resultsDiv = document.getElementById('results');

  if (!titleInput || !resultsDiv) return;
  const title = titleInput.value.trim();
  if (!title) {
    showError(resultsDiv, 'Please enter a title.');
    return;
  }

  showSpinner(resultsDiv);
  try {
    const data = await fetchRecommendations(title);
    hideSpinner(resultsDiv);
    displayRecommendations(resultsDiv, data, title);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    hideSpinner(resultsDiv);
    showError(resultsDiv, 'Error fetching recommendations.');
  }
}

export { getRecommendations };
