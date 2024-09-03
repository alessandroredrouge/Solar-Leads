# Solar D2D Lead Generation MVP

This is an MVP for a software designed to improve door-to-door (D2D) lead generation for solar sales teams. It helps canvassers collect data, optimize routes, and analyze performance.

## Features
- Data collection from door-to-door interactions
- Optimized canvassing routes using Google Maps API
- Analytics dashboard for performance tracking

## Installation
1. Clone the repository: `git clone https://github.com/yourusername/solar-d2d-mvp.git`
2. Navigate to the project directory: `cd solar-d2d-mvp`
3. Install dependencies: `pip install -r requirements.txt`

## Usage
Run the server:
```bash
python app/main.py
```

## Folder Structure
```bash
/solar-d2d-mvp/
│
├── /app/                  # Main application folder
│   ├── __init__.py        # Initializes the Python package
│   ├── main.py            # Main entry point for the backend server
│   ├── data_processing.py # Python script for data processing and route optimization
│   ├── google_maps.py     # Python script for interacting with the Google Maps API
│   ├── models.py          # Python script for data models (if using ORM)
│   ├── database.py        # Python script for data storage management
│   ├── /static/           # Folder for static files (CSS, JS)
│   │   ├── style.css      # CSS for web app styling
│   │   └── script.js      # JavaScript for web app interactivity (if needed)
│   └── /templates/        # Folder for HTML templates
│       └── index.html     # Main HTML page for the web interface
│
├── requirements.txt       # Dependencies for the project
├── README.md              # Project documentation
└── .gitignore             # Git ignore file for sensitive and unnecessary files
```