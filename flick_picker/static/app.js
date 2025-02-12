// Endpoints
const API_ENDPOINT = "http://127.0.0.1:5020/recommend";    // for getting recommendations
const SEARCH_ENDPOINT = "http://127.0.0.1:5020/search";    // for autocomplete suggestions

// "Debounce" timer to avoid sending a request on every key press instantly
let autocompleteTimer = null;

// Main recommendation function
async function getRecommendations() {
  const title = document.getElementById('movie-input').value.trim();
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = ''; // Clear old results

  if (!title) {
    resultsDiv.innerHTML = '<p class="text-danger">Please enter a title.</p>';
    return;
  }

  try {
    const response = await fetch(`${API_ENDPOINT}?title=${encodeURIComponent(title)}`);
    const data = await response.json();

    if (response.ok) {
      if (data.recommendations && data.recommendations.length > 0) {
        let html = `<h5>${data.message}</h5><ul class="list-group mt-2">`;
        
        data.recommendations.forEach((item) => {
          // Convert similarity to a percentage (2 decimals)
          const similarityPercent = (item.similarity * 100).toFixed(2);

          html += `
            <li class="list-group-item">
              <strong>${item.title}</strong>
              <span class="badge bg-primary float-end">
                Similarity: ${similarityPercent}%
              </span>
              <div class="text-muted mt-1">
                ${item.description}
              </div>
              <div class="mt-2">
                <small><strong>Genre:</strong> ${item.genre}</small>
              </div>
              <div>
                <small><strong>Director:</strong> ${item.director}</small>
              </div>
            </li>
          `;
        });

        html += '</ul>';
        resultsDiv.innerHTML = html;
      } else {
        resultsDiv.innerHTML = `<p>No recommendations found for '${title}'.</p>`;
      }
    } else {
      // If response is not OK (e.g. 404, 400)
      resultsDiv.innerHTML = `<p class="text-danger">${data.message}</p>`;
    }
  } catch (error) {
    console.error(error);
    resultsDiv.innerHTML = '<p class="text-danger">Error fetching recommendations.</p>';
  }
}

// Autocomplete function - Called whenever user types in #movie-input
function handleAutocomplete(event) {
  const query = event.target.value.trim();
  const suggestionBox = document.getElementById('autocomplete-list');
  
  // Clear existing suggestions on each key press
  suggestionBox.innerHTML = '';

  // Only search if user typed at least 2 characters
  if (query.length < 2) return;

  // Debounce: clear any existing timer
  clearTimeout(autocompleteTimer);

  // Wait 300ms before actually sending the request
  autocompleteTimer = setTimeout(async () => {
    try {
      const res = await fetch(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`);
      const suggestions = await res.json();
      showSuggestions(suggestions);
    } catch (err) {
      console.error(err);
    }
  }, 300);
}

// Display suggestion results in a dropdown-like list
function showSuggestions(suggestions) {
  const suggestionBox = document.getElementById('autocomplete-list');
  suggestionBox.innerHTML = ''; // clear old suggestions

  if (!suggestions.length) return;

  suggestions.forEach(title => {
    // Create a list-group item (Bootstrap style)
    const item = document.createElement('div');
    item.classList.add('list-group-item');
    item.textContent = title;

    // On click, set the input field to this title & clear suggestions
    item.addEventListener('click', () => {
      document.getElementById('movie-input').value = title;
      suggestionBox.innerHTML = '';
    });

    suggestionBox.appendChild(item);
  });
}

// Event listeners
// 1. Click "Get Recommendations"
document.getElementById('recommend-btn').addEventListener('click', getRecommendations);

// 2. Press "Enter" to submit
document.getElementById('movie-input').addEventListener('keyup', function(event) {
  if (event.key === 'Enter') {
    getRecommendations();
  } else {
    // If it's not Enter, call autocomplete
    handleAutocomplete(event);
  }
});
