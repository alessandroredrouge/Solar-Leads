# Purpose: Acts as the entry point for your application. It sets up a web server using Flask, handles user role selection (Canvasser or Manager), and routes users to the appropriate interface. Canvassers are directed to the Data Collection page, while Managers are directed to the Analytics page. It also facilitates navigation between Data Collection, Field Support, and Analytics pages based on user roles.
# Interacts with: data_processing.py, google_maps.py, database.py, /templates/role_selection.html, /templates/data_collection.html, /templates/field_support.html, /templates/analytics.html.
# Programming Language: Python (Flask).

from flask import Flask, render_template, request, session, redirect, url_for, session, flash, jsonify
from data_processing import process_data
from google_maps import get_map_data
from database import init_db, save_data, delete_data, delete_ALL_data
import os
import csv

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secret key for session management

# Initialize the database from database.py
init_db()

@app.route('/', methods=['GET', 'POST'])
def role_selection():
    """
    Handles the role selection form submission. Sets the user role in the session
    and redirects the user to the appropriate page based on the selected role.
    """
    if request.method == 'POST':
        selected_role = request.form['role']  # Get the role selected by the user
        selected_nickname = request.form['nickname']  # Get the nickname selected by the user
        session['role'] = selected_role  # Store the role in the session
        session['nickname'] = selected_nickname  # Store the nickname in the session
        # Redirect to role-specific view
        if selected_role == 'Canvasser':
            return redirect(url_for('data_collection'))
        elif selected_role == 'Manager':
            return redirect(url_for('analytics'))
        
    return render_template('role_selection.html')

# Routes for Data Collection, Field Support and Analytics Pages
@app.route('/data_collection')
def data_collection():
    """
    Renders the Data Collection page.
    Only accessible to users who have selected a role.
    """
    role = session.get('role')
    nickname = session.get('nickname')
    if not role:
        return redirect(url_for('role_selection'))
    
    # Load data from CSV file if it exists
    data = []
    file_path = 'field_data.csv'
    if os.path.exists(file_path):
        with open(file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            next(reader)  # Skip the header row because we render it directly in the HTML template
            data = list(reader)  # Get the data from the CSV file

    return render_template('data_collection.html', data=data, role=role, nickname=nickname)

@app.route('/field_support')
def field_support():
    """
    Renders the Field Support page.
    Only accessible to users who have selected a role.
    """
    role = session.get('role')
    nickname = session.get('nickname')
    if not role:
        return redirect(url_for('role_selection'))
    return render_template('field_support.html', role=role, nickname=nickname)

@app.route('/analytics')
def analytics():
    """
    Renders the Analytics page.
    Only accessible to Managers.
    """
    role = session.get('role')
    nickname = session.get('nickname')
    if not role or role != 'Manager':
        return redirect(url_for('role_selection'))  # Only accessible for managers
    return render_template('analytics.html', role=role, nickname=nickname)

# Routes for Data handling
@app.route('/submit_data', methods=['POST'])
def submit_data():
    """
    Handles the submission of data from the data collection form.
    Processes and saves the data to the database.
    """
    role = session.get('role')
    nickname = session.get('nickname')
    collected_data = request.form.to_dict()  # Convert form data to dictionary
    save_data(collected_data, role, nickname)  # Save processed data to CSV using pandas
    flash('Data submitted successfully!', 'success')  # Optional: Feedback to user
    return redirect(url_for('data_collection'))  # Redirect back to data collection page

@app.route('/delete/<int:prospect_id>', methods=['DELETE'])
def delete_prospect(prospect_id):
    """
    Handles the deletion of a row of data from the data stored so far.
    Processes and deletes the row of data indicated by the user from the database.
    """
    delete_data(prospect_id)
    flash('Data eliminated successfully!', 'success')  # Optional: Feedback to user 
    return jsonify({'success': True}), 200

@app.route('/delete-ALL', methods=['DELETE'])
def delete_table():
    """
    Handles the deletion of a row of data from the data stored so far.
    Processes and deletes the row of data indicated by the user from the database.
    """
    delete_ALL_data()
    flash('All data eliminated successfully!', 'success')  # Optional: Feedback to user 
    return jsonify({'success': True}), 200
  
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