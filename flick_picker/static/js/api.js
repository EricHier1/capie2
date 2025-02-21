import { API_ENDPOINT, SEARCH_ENDPOINT, VISUALIZATION_ENDPOINT } from './config.js';

export async function fetchRecommendations(title) {
  const response = await fetch(`${API_ENDPOINT}?title=${encodeURIComponent(title)}`);
  return response.json();
}

export async function fetchAutocomplete(query) {
  const response = await fetch(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`);
  return response.json();
}

export async function fetchVisualizations() {
  const response = await fetch(VISUALIZATION_ENDPOINT);
  return response.json();
}
