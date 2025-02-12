import os
import pandas as pd
import numpy as np

from flask import Flask, send_from_directory, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ------------------------------------------------------------------------
# 1. Flask App Setup
#    - Specify static_folder to serve index.html
# ------------------------------------------------------------------------
app = Flask(__name__, static_folder='static')


# ------------------------------------------------------------------------
# 2. Load Data & Build Similarity Model (At App Startup)
# ------------------------------------------------------------------------
def load_and_preprocess_data(csv_file="netflix_titles.csv"):
    """Loads Netflix dataset, cleans and prepares it for TF-IDF."""
    df = pd.read_csv(csv_file)
    
    # Drop duplicates by title
    df.drop_duplicates(subset='title', keep='first', inplace=True)
    
    # Fill missing text fields with 'unknown'
    text_cols = ['director', 'cast', 'country', 'listed_in', 'description']
    for col in text_cols:
        df[col] = df[col].fillna('unknown').astype(str).str.lower()
    
    # Combine text features
    df['combined_features'] = (
        df['director'] + ' ' +
        df['cast'] + ' ' +
        df['listed_in'] + ' ' +
        df['description']
    )
    return df

def build_tfidf_and_similarity(df):
    """Builds TF-IDF matrix + cosine similarity, returns them plus title-index mapping."""
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df['combined_features'])
    
    cosine_sim_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)
    
    # Map title -> index (use lowercase to avoid mismatch)
    title_to_index = pd.Series(df.index, index=df['title'].str.lower()).drop_duplicates()
    
    return tfidf_matrix, cosine_sim_matrix, title_to_index

# Load once at startup
df = load_and_preprocess_data("netflix_titles.csv")
_, cosine_sim_matrix, title_to_index = build_tfidf_and_similarity(df)


# ------------------------------------------------------------------------
# 3. Recommendation Function
# ------------------------------------------------------------------------
def get_recommendations(title, df, title_to_index, cosine_sim_matrix, top_n=10):
    """
    Returns a list of dicts: [
      {
        "title": <string>,
        "similarity": <float>,
        "description": <string>,
        "genre": <string>,
        "director": <string>
      },
      ...
    ]
    """
    title_lower = title.lower()
    if title_lower not in title_to_index:
        return []
    
    idx = title_to_index[title_lower]

    # Pairwise similarity scores
    sim_scores = list(enumerate(cosine_sim_matrix[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:top_n+1]

    # Build the list of recommended items
    recommendations = []
    for movie_idx, score in sim_scores:
        recommendations.append({
            "title": df['title'].iloc[movie_idx],
            "similarity": score,
            "description": df['description'].iloc[movie_idx],
            "genre": df['listed_in'].iloc[movie_idx],
            "director": df['director'].iloc[movie_idx]
        })

    return recommendations


# ------------------------------------------------------------------------
# 4. Flask Routes
# ------------------------------------------------------------------------

# Serve index.html (the front-end) from the static folder
@app.route('/')
def serve_frontend():
    """Return index.html from static/ folder."""
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/recommend', methods=['GET'])
def recommend():
    title = request.args.get("title", "").strip()
    if not title:
        return jsonify({
            "message": "Please provide a title parameter, e.g. /recommend?title=Inception",
            "recommendations": []
        }), 400
    
    recs = get_recommendations(title, df, title_to_index, cosine_sim_matrix, top_n=10)

    if not recs:
        return jsonify({
            "message": f"Title '{title}' not found in dataset.",
            "recommendations": []
        }), 404
    
    return jsonify({"message": "Success", "recommendations": recs})

@app.route('/search', methods=['GET'])
def search_titles():
    query = request.args.get("q", "").strip().lower()
    if not query:
        return jsonify([])
    
    # Filter df for titles that contain the query
    # e.g., "inc" -> "Inception"
    filtered = df[df['title'].str.lower().str.contains(query, na=False)]
    
    # Return just the top 10 matches
    suggestions = filtered['title'].head(10).tolist()
    
    return jsonify(suggestions)

# ------------------------------------------------------------------------
# 5. Run the App
# ------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5020)
