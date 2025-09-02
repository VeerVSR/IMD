# IMD Weather Warning & Analysis Tool

![IMD-Final-Map-Visualization](https://raw.githubusercontent.com/VeerVSR/IMD/master/IMD-Final/html/imd/complete_map.png)

This project is a comprehensive web-based tool designed to fetch, visualize, and analyze weather warnings from the India Meteorological Department (IMD). It provides an interactive map interface to overlay weather warning polygons on district maps of Punjab and Haryana, identify affected areas, and generate detailed reports in both PDF and DOCX formats.

---

## ✨ Features

* **🛰️ Real-time Data Fetching**: Automatically fetches the latest weather warning data in GeoJSON format.
* **🗺️ Interactive Map Interface**: Utilizes Leaflet.js to display an interactive map with tools for drawing and editing custom polygonal areas.
* **🌍 Geospatial Analysis**: Performs intersection analysis between weather warning polygons and district boundaries to pinpoint affected regions.
* **📊 Dynamic Visualization**: Color-codes affected districts on the map and displays detailed warning information in a structured table.
* **📄 Report Generation**: Dynamically generates and allows users to download comprehensive analysis reports in **PDF** and **DOCX** formats using PHP.
* **🚀 Robust Backend**: Powered by a lightweight Flask backend to handle data processing and API requests.
* **⚙️ High-Performance Serving**: Served using Nginx for efficient and reliable performance.

---

## 🛠️ Technology Stack

| Category      | Technology                                                                                                    |
|---------------|---------------------------------------------------------------------------------------------------------------|
| **Backend** | ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white) |
| **Frontend** | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) |
| **Mapping** | ![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white)         |
| **Server** | ![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)               |
| **Doc Gen** | ![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white) (PHPWord, FPDF)       |
| **Data** | GeoJSON, Microsoft Excel                                                                                      |

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

* Python 3.8+ and Pip
* Nginx
* PHP and Composer

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/IMD-Final.git](https://github.com/your-username/IMD-Final.git)
    cd IMD-Final
    ```

2.  **Set up the Python Backend:**
    * Create and activate a virtual environment:
        ```sh
        # For Windows
        python -m venv venv
        .\venv\Scripts\activate

        # For macOS/Linux
        python3 -m venv venv
        source venv/bin/activate
        ```
    * Install the required Python packages:
        ```sh
        pip install Flask Flask-Cors
        ```
        *(Note: A `requirements.txt` file should be created for easier dependency management.)*

3.  **Set up the PHP Dependencies:**
    * Navigate to the `html` directory and install Composer packages:
        ```sh
        cd html
        composer install
        ```

4.  **Configure Nginx:**
    * Open the `conf/nginx.conf` file.
    * Ensure the `root` directive points to the `html` directory inside your project folder.
    * Configure the `location` blocks to correctly handle requests for PHP files and the Flask backend API.
    * Start the Nginx server by running `nginx.exe`.

5.  **Run the Application:**
    * Start the Flask backend server:
        ```sh
        python app.py
        ```
    * Open your web browser and navigate to the address configured in your Nginx setup (e.g., `http://localhost`).

---

## 📂 Project Structure

Here's a breakdown of the key files and directories in the project:
