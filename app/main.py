# Purpose: Acts as the entry point for your application. It sets up a web server using Flask, handles user role selection (Canvasser or Manager), and routes users to the appropriate interface. Canvassers are directed to the Data Collection page, while Managers are directed to the Analytics page. It also facilitates navigation between Data Collection, Field Support, and Analytics pages based on user roles.
# Interacts with: data_processing.py, google_maps.py, database.py, /templates/role_selection.html, /templates/data_collection.html, /templates/field_support.html, /templates/analytics.html.
# Programming Language: Python (Flask).

from flask import Flask, render_template, request, redirect, url_for, session, flash
from data_processing import process_data
from google_maps import get_map_data
from database import init_db, save_data
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secret key for session management

# Initialize the database from database.py
init_db()

# Routes for Role Selection and Navigation
@app.route('/')
def role_selection():
    """
    Renders the role selection page where users can choose their role as either Canvasser or Manager.
    """
    return render_template('role_selection.html')

@app.route('/select_role', methods=['POST'])
def select_role():
    """
    Handles the role selection form submission. Sets the user role in the session
    and redirects the user to the appropriate page based on the selected role.
    """
    selected_role = request.form['role']  # Get the role selected by the user
    session['role'] = selected_role  # Store the role in the session

    # Redirect to role-specific view
    if selected_role == 'Canvasser':
        return redirect(url_for('canvasser_view'))
    elif selected_role == 'Manager':
        return redirect(url_for('manager_view'))
    return redirect(url_for('role_selection'))

# Routes for Canvasser and Manager Views
@app.route('/canvasser_view')
def canvasser_view():
    """
    Renders the Canvasser view template.
    """
    return render_template('canvasser_view.html')

@app.route('/manager_view')
def manager_view():
    """
    Renders the Manager view template.
    """
    return render_template('manager_view.html')

# Routes for Data Collection, Field Support and Analytics Pages
@app.route('/data_collection')
def data_collection():
    """
    Renders the Data Collection page.
    Only accessible to users who have selected a role.
    """
    if 'role' not in session:
        return redirect(url_for('role_selection'))
    return render_template('data_collection.html')

@app.route('/field_support')
def field_support():
    """
    Renders the Field Support page.
    Only accessible to users who have selected a role.
    """
    if 'role' not in session:
        return redirect(url_for('role_selection'))
    return render_template('field_support.html')

@app.route('/analytics')
def analytics():
    """
    Renders the Analytics page.
    Only accessible to Managers.
    """
    if 'role' not in session or session['role'] != 'Manager':
        return redirect(url_for('role_selection'))
    return render_template('analytics.html')

# Routes for Data handling
@app.route('/submit_data', methods=['POST'])
def submit_data():
    """
    Handles the submission of data from the data collection form.
    Processes and saves the data to the database.
    """
    collected_data = request.form.to_dict()  # Convert form data to dictionary
    processed_data = process_data(collected_data)  # Process the data (ensure this returns a dict)
    save_data(processed_data)  # Save processed data to CSV using pandas
    flash('Data submitted successfully!', 'success')  # Optional: Feedback to user
    return redirect(url_for('data_collection'))  # Redirect back to data collection page

# Routes for Google Maps Data
@app.route('/get_map')
def get_map():
    """
    Retrieves and displays map data using Google Maps API.
    """
    map_data = get_map_data()  # Function from google_maps.py
    return render_template('map.html', map_data=map_data)  # You'll need to create map.html

# Routes for Error Handling and User Feedback
@app.errorhandler(404)
def page_not_found(e):
    flash('Page not found!')
    return redirect(url_for('role_selection'))


# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)