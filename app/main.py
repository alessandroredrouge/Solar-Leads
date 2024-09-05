# Purpose: Acts as the entry point for your application. It sets up a web server using Flask, handles user role selection (Canvasser or Manager), and routes users to the appropriate interface. Canvassers are directed to the Data Collection page, while Managers are directed to the Analytics page. It also facilitates navigation between Data Collection, Field Support, and Analytics pages based on user roles.
# Interacts with: data_processing.py, google_maps.py, database.py, /templates/role_selection.html, /templates/data_collection.html, /templates/field_support.html, /templates/analytics.html.
# Programming Language: Python (Flask).

from flask import Flask, render_template, request, redirect, url_for, session
# from data_processing import process_data
# from google_maps import get_map_data
# from database import init_db, save_data
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secret key for session management

# Initialize the database from database.py
# init_db()

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

# Route for Canvasser View
@app.route('/canvasser_view')
def canvasser_view():
    """
    Renders the Canvasser view template.
    """
    return render_template('canvasser_view.html')

# Route for Manager View
@app.route('/manager_view')
def manager_view():
    """
    Renders the Manager view template.
    """
    return render_template('manager_view.html')

# Route for Data Collection Page
@app.route('/data_collection')
def data_collection():
    """
    Renders the Data Collection page.
    Only accessible to users who have selected a role.
    """
    if 'role' not in session:
        return redirect(url_for('role_selection'))
    return render_template('data_collection.html')

# Route for Field Support Page
@app.route('/field_support')
def field_support():
    """
    Renders the Field Support page.
    Only accessible to users who have selected a role.
    """
    if 'role' not in session:
        return redirect(url_for('role_selection'))
    return render_template('field_support.html')

# Route for Analytics Page
@app.route('/analytics')
def analytics():
    """
    Renders the Analytics page.
    Only accessible to Managers.
    """
    if 'role' not in session or session['role'] != 'Manager':
        return redirect(url_for('role_selection'))
    return render_template('analytics.html')

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)