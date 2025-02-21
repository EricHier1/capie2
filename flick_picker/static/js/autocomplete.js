import { fetchAutocomplete } from './api.js';
import { getRecommendations } from "./app.js";

let autocompleteTimer = null;

export function handleAutocomplete(event) {
  console.log("Autocomplete triggered with:", event.target.value);

  const query = event.target.value.trim();
  const suggestionBox = document.getElementById('autocomplete-list');

  if (!suggestionBox) {
    console.error("Autocomplete list element not found in DOM");
    return;
  }

  suggestionBox.innerHTML = '';
  if (query.length < 2) return;

  clearTimeout(autocompleteTimer);
  autocompleteTimer = setTimeout(async () => {
    try {
      console.log("Fetching autocomplete results for:", query);
      const suggestions = await fetchAutocomplete(query);
      console.log("Received autocomplete suggestions:", suggestions);
      showSuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error);
    }
  }, 300);
}


export function showSuggestions(suggestions) {
  const suggestionBox = document.getElementById("autocomplete-list");
  if (!suggestionBox) {
    console.error("Autocomplete list not found in the DOM");
    return;
  }

  console.log("Updating UI with suggestions:", suggestions);

  suggestionBox.innerHTML = ""; // Clear previous suggestions

  if (!suggestions.length) {
    console.log("No autocomplete suggestions found.");
    suggestionBox.classList.add("d-none"); // Hide if no results
    return;
  }

  suggestionBox.classList.remove("d-none"); // Ensure it's visible

  suggestions.forEach((title) => {
    const item = document.createElement("div");
    item.classList.add("list-group-item", "list-group-item-action");
    item.textContent = title;
    item.addEventListener("click", () => {
      const movieInput = document.getElementById("movie-input");
      if (movieInput) {
        movieInput.value = title;
      }
      suggestionBox.innerHTML = "";
      suggestionBox.classList.add("d-none");
      getRecommendations(); // Now correctly imported
    });
    suggestionBox.appendChild(item);
  });
}


