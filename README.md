# Solar Leads MVP

This is an MVP for a software designed to improve door-to-door (D2D) lead generation for solar sales teams. It helps Canvassers collect data, get real-time support on the field, and keep track of their performances. It also helps Team Leaders in qualifying prospects, and Managers to keep track of the team's performances.

## Features

- Data collection from door-to-door interactions
- Field support with maps, optimized canvassing routes, personal performance tracking, addresses worth returning
- Prospect qualification tools like prospect personas, charts to visualize data distribution, buckets to collect initiatives
- Analytics dashboard for team's performance tracking
- Role-based access control (Canvasser, Team Leader, Manager)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/solar-leads-mvp.git
   ```

2. Navigate to the project directory:
   ```bash
   cd solar-leads-mvp
   ```

3. Create a virtual environment:
   ```bash
   python -m venv venv-solar-leads
   ```

4. Activate the virtual environment:
   - On Windows:
     ```bash
     venv-solar-leads\Scripts\activate
     ```
   - On macOS and Linux:
     ```bash
     source venv-solar-leads/bin/activate
     ```

5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

6. Set up environment variables:
   - Copy the `.env.example` file to `.env`
   - Fill in the required environment variables in the `.env` file

7. Set up the config.js file:
   - Copy `app/static/config.js.example` to `app/static/config.js`
   - Replace `__GEOAPIFY_API_KEY__` with your actual Geoapify API key

## Usage

1. Activate the virtual environment (if not already activated)

2. Run the server:
   ```bash
   python app/main.py
   ```

3. Open a web browser and navigate to `http://localhost:5000`

4. Select a role (Canvasser, Team Leader, or Manager) to access different features of the application

## Folder Structure
```bash
/solar-leads-mvp/
│
├── app/ # Main application folder
│ ├── static/ # Static files (CSS, JS, images)
│ │ ├── images/ # Image files
│ │ ├── config.js # Configuration file for API keys
│ │ ├── maps.js # JavaScript for map functionality
│ │ ├── script.js # Main JavaScript file
│ │ └── style.css # CSS styles
│ ├── templates/ # HTML templates
│ │ ├── analytics.html # Analytics page template
│ │ ├── data_collection.html # Data collection page template
│ │ ├── field_support.html # Field support page template
│ │ ├── login.html # Login page template
│ │ ├── prospect_qualification.html # Prospect qualification page template
│ │ └── role_selection.html # Role selection page template
│ ├── init.py # Initializes the Python package
│ ├── data_processing.py # Data processing functions
│ ├── database.py # Database operations
│ ├── main.py # Main entry point for the Flask application
│ ├── ML_model.py # Machine learning model functions
│ ├── test_ML_model.py # Tests for the ML model
│ └── train_ML_model.py # Run it to train the ML model
│
├── venv-solar-leads/ # Virtual environment (not tracked in git)
├── .env # Environment variables (not tracked in git)
├── .gitignore # Git ignore file
├── build.js # Build script for frontend assets
├── Detailed Documentation.md # Detailed project documentation
├── README.md # Project documentation (this file)
├── requirements.txt # Python dependencies
└── solar_lead_predictor.joblib # Pre-trained ML model (running train_ML_model.py will overwrite this file)
```