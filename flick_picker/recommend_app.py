import os
import logging
from flask import Flask, send_from_directory, request, jsonify
from recommendation_engine import load_and_preprocess_data, build_or_load_model, get_recommendations
from collections import Counter
import re

def normalize_title(title):
    """Convert title to lowercase, strip spaces, and normalize '&' to 'and' for consistency."""
    title = title.lower().strip()
    title = re.sub(r"[^\w\s&]", "", title)  # Keep '&' but remove other special characters
    title = re.sub(r"\s+", " ", title)  # Replace multiple spaces with a single space
    title = title.replace("&", "and")  # Normalize '&' to 'and'
    return title

# Configure logging once
logging.basicConfig(
    level=logging.INFO,
    filename="app.log",
    filemode="a",
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static')

# Load data and model at startup
try:
    df = load_and_preprocess_data("netflix_titles.csv")
    _, cosine_sim_matrix, title_to_index = build_or_load_model(df, "cosine_sim_cache.pkl")
    logger.info("Application started successfully with data and model loaded.")
except Exception as e:
    logger.error(f"Startup failed: {str(e)}")
    raise

@app.route('/')
def serve_frontend():
    """Serve the frontend index.html from the static folder."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/recommend', methods=['GET'])
def recommend():
    raw_title = request.args.get("title", "").strip()
    title = normalize_title(raw_title)  # Normalize once
    
    limit = int(request.args.get("limit", 10))
    offset = int(request.args.get("offset", 0))
    content_type = request.args.get("type", None)
    fields = request.args.getlist("fields")

    # 🚀 Debugging logs
    logger.info(f"Received API request: {request.url}")
    logger.info(f"Raw title received: '{raw_title}'")
    logger.info(f"Normalized title used for lookup: '{title}'")
    print(f"API request received: {request.url}")
    print(f"RAW title received: '{raw_title}'")
    print(f"Normalized title for lookup: '{title}'")
    print(f"Checking if '{title}' exists in title_to_index:", title in title_to_index)

    if not title:
        return jsonify({"message": "Title required", "recommendations": []}), 400

    # 🚀 Print available keys to debug mismatches
    if title not in title_to_index or title_to_index[title] is None:
        logger.error(f"Title '{title}' is missing from title_to_index or maps to None!")
        return jsonify({"message": f"'{raw_title}' not found", "recommendations": []}), 404
        print(f"'{title}' NOT FOUND in title_to_index!")

        # Debugging - Print first 20 keys in title_to_index
        print("Sample titles available in title_to_index:")
        print(list(title_to_index.keys())[:20])

        return jsonify({"message": f"'{raw_title}' not found", "recommendations": []}), 404

    try:
        recs = get_recommendations(
            title, df, title_to_index, cosine_sim_matrix,
            top_n=limit + offset, content_type=content_type, fields=fields or None
        )
        if not recs:
            logger.warning(f"No recommendations found for '{title}'")
            print(f"⚠️ No recommendations found for '{title}'")
            return jsonify({"message": f"'{raw_title}' not found", "recommendations": []}), 404

        return jsonify({
            "message": "Similar Movies",
            "recommendations": recs[offset:offset + limit],
            "total": len(recs)
        })
    except Exception as e:
        logger.error(f"Error generating recommendations for '{title}': {str(e)}")
        print(f"ERROR generating recommendations for '{title}': {str(e)}")
        return jsonify({"message": f"Server error: {str(e)}", "recommendations": []}), 500


@app.route('/search', methods=['GET'])
def search_titles():
    """Return title suggestions based on a query."""
    query = request.args.get("q", "").strip().lower()
    if not query:
        return jsonify([])
    
    try:
        filtered = df[df['title'].str.lower().str.contains(query, na=False)]
        suggestions = filtered['title'].head(10).tolist()
        return jsonify(suggestions)
    except Exception as e:
        logger.error(f"Error in search for '{query}': {str(e)}")
        return jsonify([]), 500

@app.route('/visualizations', methods=['GET'])
def get_visualizations():
    """Return data for visualizations (genre, type, country distributions)."""
    try:
        # Genre Distribution (top 10)
        genres = df['listed_in'].str.split(', ').explode().value_counts().head(10).to_dict()
        
        # Type Distribution
        types = df['type'].value_counts().to_dict()
        
        # Top Countries (top 5)
        countries = df['country'].str.split(', ').explode().value_counts().head(5).to_dict()
        
        logger.info("Generated visualization data successfully.")
        return jsonify({
            "message": "Success",
            "genre_distribution": genres,
            "type_distribution": types,
            "top_countries": countries
        })
    except Exception as e:
        logger.error(f"Visualization error: {str(e)}")
        return jsonify({"message": f"Error generating visualizations: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5020)
