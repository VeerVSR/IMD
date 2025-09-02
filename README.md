IMD Weather Warning & Analysis Tool
This project is a comprehensive web-based tool designed to fetch, visualize, and analyze weather warnings from the India Meteorological Department (IMD). It provides an interactive map interface to overlay weather warning polygons on district maps of Punjab and Haryana, identify affected areas, and generate detailed reports in both PDF and DOCX formats.

✨ Features
🛰️ Real-time Data Fetching: Automatically fetches the latest weather warning data in GeoJSON format.

🗺️ Interactive Map Interface: Utilizes Leaflet.js to display an interactive map with tools for drawing and editing custom polygonal areas.

🌍 Geospatial Analysis: Performs intersection analysis between weather warning polygons and district boundaries to pinpoint affected regions.

📊 Dynamic Visualization: Color-codes affected districts on the map and displays detailed warning information in a structured table.

📄 Report Generation: Dynamically generates and allows users to download comprehensive analysis reports in PDF and DOCX formats using PHP.

🚀 Robust Backend: Powered by a lightweight Flask backend to handle data processing and API requests.

⚙️ High-Performance Serving: Served using Nginx for efficient and reliable performance.

🛠️ Technology Stack
Category	Technology
Backend	
Frontend	
Mapping	
Server	
Doc Gen	(PHPWord, FPDF)
Data	GeoJSON, Microsoft Excel

Export to Sheets
🚀 Getting Started
Follow these instructions to get a copy of the project up and running on your local machine.

Prerequisites
Python 3.8+ and Pip

Nginx

PHP and Composer

Installation
Clone the repository:

Bash

git clone https://github.com/your-username/IMD-Final.git
cd IMD-Final
Set up the Python Backend:

Create and activate a virtual environment:

Bash

# For Windows
python -m venv venv
.\venv\Scripts\activate

# For macOS/Linux
python3 -m venv venv
source venv/bin/activate
Install the required Python packages:

Bash

pip install Flask Flask-Cors
(Note: A requirements.txt file should be created for easier dependency management.)

Set up the PHP Dependencies:

Navigate to the html directory and install Composer packages:

Bash

cd html
composer install
Configure Nginx:

Open the conf/nginx.conf file.

Ensure the root directive points to the html directory inside your project folder.

Configure the location blocks to correctly handle requests for PHP files and the Flask backend API.

Start the Nginx server by running nginx.exe.

Run the Application:

Start the Flask backend server:

Bash

python app.py
Open your web browser and navigate to the address configured in your Nginx setup (e.g., http://localhost).

📂 Project Structure
Here's a breakdown of the key files and directories in the project:

└── IMD-Final/
    ├── app.py                      # Main Flask backend application
    ├── intersection_map.py         # Python script for geospatial analysis
    ├── fetch_latest_geojson.py     # Script to fetch IMD warning data
    ├── html/
    │   ├── imd/
    │   │   ├── index.html          # Main frontend HTML file
    │   │   ├── script.js           # Core frontend JavaScript logic
    │   │   ├── styles.css          # CSS styles for the frontend
    │   │   └── data/               # GeoJSON, shapefiles, and processed data
    │   ├── generate.php            # PHP script for DOCX/PDF report generation
    │   └── vendor/                 # PHP dependencies (PHPWord, FPDF)
    ├── conf/
    │   └── nginx.conf              # Nginx server configuration
    ├── database.xlsx               # Excel-based data store
    └── ...                         # Other configuration and log files
⚙️ How It Works
Data Fetching: The fetch_latest_geojson.py script runs periodically to download the latest weather warning data from the IMD source.

Backend API: The Flask app.py serves as the backend API. It handles requests for data processing, such as running the geospatial intersection logic from intersection_map.py.

Frontend Visualization: The user interacts with index.html, which uses script.js and Leaflet.js to render the map. It loads district boundaries and overlays the fetched weather warnings.

User Interaction: The user can draw custom polygons on the map. This user-drawn GeoJSON is sent to the Flask backend.

Analysis: The backend determines the intersection between the warning polygons (either fetched or user-drawn) and the district boundaries of Punjab and Haryana.

Report Generation: When a report is requested, the processed data is sent to generate.php. This script uses the PHPWord and FPDF libraries to create and serve a downloadable DOCX or PDF file summarizing the warnings and affected areas.

📜 License
This project is distributed under the MIT License. See docs/LICENSE for more information.
