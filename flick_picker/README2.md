# 🎬 Movie Recommendation System

A Flask-based movie recommendation system that uses **TF-IDF and cosine similarity** to suggest movies based on a given title.

## 📌 Features
- **Content-based recommendations** using text features (director, cast, genre, description)
- **Fast search functionality** for movie titles
- **REST API endpoints** for recommendations and search
- **Flask web server** for handling requests

---

## ⚡ Installation

### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/yourusername/flick_picker.git
cd flick_picker
```

### **2️⃣ (Optional) Create a Virtual Environment**
It is **highly recommended** to use a virtual environment to isolate dependencies.

```bash
python3.12 -m venv venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows (PowerShell)
```

### **3️⃣ Install Dependencies**
Once inside the project directory, install all required packages:
```bash
pip install -r requirements.txt
```

---

## 🚀 Running the App

### **1️⃣ Start the Flask Server**
Run the following command:
```bash
python3.12 recommend_app.py
```

### **2️⃣ Access the Web Interface**
Open your browser and go to:
```
http://127.0.0.1:5020/
```

---

## 📡 API Endpoints

### **🔍 Search for Titles**
Find movie titles that contain a search query:
```http
GET /search?q=<query>
```
**Example:**
```
http://127.0.0.1:5020/search?q=Inception
```
**Response:**
```json
["Inception", "In the Mood for Love", "Inside Out"]
```

---

### **🎥 Get Movie Recommendations**
Retrieve similar movies based on a given title.
```http
GET /recommend?title=<movie_name>
```
**Example:**
```
http://127.0.0.1:5020/recommend?title=Inception
```
**Response:**
```json
{
    "message": "Success",
    "recommendations": [
        {"title": "Interstellar", "similarity": 0.92, "description": "A space epic...", "genre": "Sci-Fi", "director": "Christopher Nolan"},
        {"title": "The Prestige", "similarity": 0.87, "description": "Two magicians...", "genre": "Thriller", "director": "Christopher Nolan"}
    ]
}
```

---

## 🛑 Stopping the Server
To stop the Flask app, press **Ctrl + C** in the terminal.

If you're using a virtual environment, deactivate it with:
```bash
deactivate
```

---

## 🏗️ Deployment (Production)
For deployment, use **Gunicorn** instead of Flask’s built-in development server:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5020 recommend_app:app
```

---

## 🛠 Troubleshooting

### **1️⃣ Flask Not Found After Activating Virtual Environment**
Ensure you're using the correct Python environment:
```bash
which python
which pip
```
If they don't point to the virtual environment (`venv/bin/python`), try:
```bash
source venv/bin/activate
```

### **2️⃣ Dependencies Not Installed Correctly**
Ensure `pip` is up to date:
```bash
pip install --upgrade pip
```
Then, reinstall:
```bash
pip install -r requirements.txt
```
