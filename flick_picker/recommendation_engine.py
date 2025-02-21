import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import joblib
import os
import logging
import re
from scipy.sparse import csr_matrix

# Setup logging
logger = logging.getLogger(__name__)

def normalize_title(title):
    """Convert title to lowercase, strip spaces, and normalize '&' for consistency."""
    title = title.lower().strip()
    title = re.sub(r"[^\w\s&]", "", title)  # Keep '&' but remove other special characters
    title = re.sub(r"\s+", " ", title)  # Replace multiple spaces with a single space
    title = title.replace("&", "and")  # Normalize '&' to 'and'
    return title

def load_and_preprocess_data(csv_file="netflix_titles.csv"):
    """Loads Netflix dataset, cleans, and prepares it for TF-IDF."""
    try:
        df = pd.read_csv(csv_file)
        logger.info(f"Loaded dataset from {csv_file} with {len(df)} rows.")
        
        # Drop duplicates by title
        df.drop_duplicates(subset='title', keep='first', inplace=True)
        
        # Fill missing text fields with 'unknown'
        text_cols = ['director', 'cast', 'country', 'listed_in', 'description']
        for col in text_cols:
            df[col] = df[col].fillna('unknown').astype(str).str.lower()
        
        # Combine text features for recommendations
        df['combined_features'] = (
            df['director'] + ' ' +
            df['cast'] + ' ' +
            df['listed_in'] + ' ' +
            df['description']
        )

        return df
    
    except FileNotFoundError:
        logger.error(f"Dataset file '{csv_file}' not found.")
        raise FileNotFoundError(f"Dataset file '{csv_file}' not found.")
    except Exception as e:
        logger.error(f"Error loading data from {csv_file}: {str(e)}")
        raise Exception(f"Error loading data: {str(e)}")

def build_or_load_model(df, cache_file="cosine_sim_cache.pkl"):
    """Builds or loads TF-IDF matrix and cosine similarity, with caching."""
    if os.path.exists(cache_file):
        try:
            tfidf_matrix, cosine_sim_matrix, title_to_index = joblib.load(cache_file)
            logger.info(f"Loaded cached model from {cache_file}.")
            return tfidf_matrix, cosine_sim_matrix, title_to_index
        except Exception as e:
            logger.warning(f"Failed to load cache from {cache_file}: {str(e)}. Rebuilding model.")
    
    # Build model if cache doesn’t exist or fails
    try:
        tfidf = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),  # Capture word pairs (bigrams) for better similarity
            min_df=2  # Ignore rare words appearing in only 1 document
        )
        tfidf_matrix = tfidf.fit_transform(df['combined_features'])
        
        # Ensure matrix is valid
        if tfidf_matrix.shape[0] == 0 or tfidf_matrix.shape[1] == 0:
            raise ValueError("TF-IDF matrix is empty! Check feature extraction.")

        # Compute cosine similarity
        cosine_sim_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)
        
        # Convert to sparse matrix for efficiency
        cosine_sim_matrix = csr_matrix(cosine_sim_matrix)

        # Map normalized titles -> index
        df["normalized_title"] = df["title"].apply(normalize_title)
        title_to_index = pd.Series(df.index, index=df["normalized_title"]).drop_duplicates()

        # Debugging logs
        logger.info(f"Sample normalized titles in title_to_index: {list(title_to_index.keys())[:20]}")
        logger.info(f"Checking if 'carole and tuesday' exists in title_to_index: {'carole and tuesday' in title_to_index}")
        
        # Cache the results
        joblib.dump((tfidf_matrix, cosine_sim_matrix, title_to_index), cache_file)
        logger.info(f"Built and cached model to {cache_file}.")
        
        return tfidf_matrix, cosine_sim_matrix, title_to_index
    
    except Exception as e:
        logger.error(f"Error building model: {str(e)}")
        raise

def get_recommendations(title, df, title_to_index, cosine_sim_matrix, top_n=10, content_type=None, fields=None):
    """Returns a list of recommendation dictionaries based on cosine similarity."""
    
    if not all([df is not None, title_to_index is not None, cosine_sim_matrix is not None]):
        logger.error("One or more critical components (df, title_to_index, cosine_sim_matrix) are None!")
        raise ValueError("DataFrame, title_to_index, and cosine_sim_matrix must not be None.")

    if not isinstance(top_n, int) or top_n <= 0:
        raise ValueError("top_n must be a positive integer.")

    if not isinstance(title, str) or not title.strip():
        raise ValueError("Title must be a non-empty string.")

    # Normalize title for lookup
    title = normalize_title(title)

    # Ensure title exists
    if title not in title_to_index:
        logger.warning(f"'{title}' NOT found in title_to_index!")
        return []

    idx = title_to_index[title]
    
    # Get similarity scores
    try:
        sim_scores = list(enumerate(cosine_sim_matrix[idx].toarray()[0]))
    except Exception as e:
        logger.error(f"Error computing similarity scores for '{title}': {str(e)}")
        return []

    logger.info(f"🔍 Raw similarity scores for '{title}': {sim_scores[:10]}")

    # Sort by similarity
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:]  # Exclude the input title itself

    logger.info(f"🔍 Sorted similarity scores for '{title}': {sim_scores[:10]}")

    # If all similarity scores are 0, issue a warning
    if all(score[1] == 0 for score in sim_scores):
        logger.warning(f"⚠️ All similarity scores for '{title}' are 0! No recommendations possible.")
        return []

    # Build recommendations list
    recommendations = []
    for movie_idx, score in sim_scores:
        if content_type and df['type'].iloc[movie_idx].lower() != content_type.lower():
            continue

        recommendation = {field: df[field].iloc[movie_idx] for field in (fields or ['title']) if field in df.columns}
        recommendation['similarity'] = float(score)
        recommendations.append(recommendation)

        if len(recommendations) >= top_n:
            break

    logger.info(f"Found {len(recommendations)} recommendations for '{title}'")
    return recommendations
