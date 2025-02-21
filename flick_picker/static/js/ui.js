export function showSpinner(container) {
    container.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
  }
  
  export function hideSpinner(container) {
    const spinner = container.querySelector('.spinner-border');
    if (spinner) spinner.style.display = 'none';
  }
  
  export function displayRecommendations(resultsDiv, data, title) {
    if (data.recommendations && data.recommendations.length > 0) {
      let html = `<h5>${data.message}</h5><ul class="list-group mt-2">`;
  
      data.recommendations.forEach(item => {
        html += `<li class="list-group-item"><strong>${item.title}</strong>`;
        if (item.similarity) {
          html += `<span class="badge bg-primary float-end">Similarity: ${(item.similarity * 100).toFixed(2)}%</span>`;
        }
        html += `</li>`;
      });
  
      html += '</ul>';
      resultsDiv.innerHTML = html;
    } else {
      resultsDiv.innerHTML = `<p>No recommendations found for '${title}'.</p>`;
    }
  }
  
  export function showError(container, message) {
    container.innerHTML = `<p class="text-danger">${message}</p>`;
  }
  