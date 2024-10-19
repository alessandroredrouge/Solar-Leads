# Purpose: Acts as the entry point for your application. It sets up a web server using Flask, handles user role selection (Canvasser or Manager), and routes users to the appropriate interface. Canvassers are directed to the Data Collection page, while Managers are directed to the Analytics page. It also facilitates navigation between Data Collection, Field Support, and Analytics pages based on user roles.
# Interacts with: data_processing.py, google_maps.py, database.py, /templates/role_selection.html, /templates/data_collection.html, /templates/field_support.html, /templates/analytics.html.
# Programming Language: Python (Flask).

from flask import Flask, render_template, request, session, redirect, url_for, session, flash, jsonify
from data_processing import sync_local_cache, get_one_day_performance, get_overall_performance, get_team_overview, get_team_performance, get_prospect_responses, get_reasons_of_no, prepare_data_for_prediction, get_prospect_personas, get_prospects_data_distribution_data
from database import save_data, delete_data, delete_ALL_data, load_data, load_num_of_data, load_ML_prediction_data, get_map_data, get_last_available_date_for_user
from datetime import datetime
from ML_model import load_trained_model
import os



app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secret key for session management
ml_model = load_trained_model()

# Route for Login Page
@app.route('/', methods=['GET', 'POST'])
def login():
    """
    Handles the login / demo testing.
    """
    return render_template('login.html')

# Route for Role Selection Page
@app.route('/role_selection', methods=['GET', 'POST'])
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
        elif selected_role == 'Team Leader':
            return redirect(url_for('prospect_qualification'))
        elif selected_role == 'Manager':
            return redirect(url_for('analytics'))
        
    return render_template('role_selection.html')

# Routes for Data Collection, Field Support, Prospect Qualification and Analytics Pages
@app.route('/data_collection')
def data_collection():
    """
    Renders the Data Collection page.
    Only accessible to Canvassers and Team Leaders.
    """
    role = session.get('role')
    nickname = session.get('nickname')
    if not role or role == 'Manager':
        return redirect(url_for('role_selection')) # only accessible for canvassers and team leaders
    page = request.args.get('page', 1, type=int)
    per_page = 100  # Number of rows per page
    result = load_num_of_data(page, per_page)
    data = result['data']
    for item in data:
        item['_id'] = str(item['_id'])  # Change the MongoDB ID Object to a string to display it in the HTML
    return render_template('data_collection.html', 
                           data=data, 
                           role=role, 
                           nickname=nickname,
                           current_page=result['current_page'],
                           per_page=per_page,
                           total_pages=result['total_pages'],
                           total_count=result['total_count'])

@app.route('/field_support')
def field_support():
    """
    Renders the Field Support page.
    Only accessible to Canvassers and Team Leaders.
    """
    role = session.get('role')
    nickname = session.get('nickname')
    if not role or role == 'Manager':
        return redirect(url_for('role_selection')) # only accessible for canvassers and team leaders
    selected_date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    performance = get_one_day_performance(role, nickname, selected_date)
    page = request.args.get('page', 1, type=int)
    per_page = 20  # Number of rows per page
    ml_prediction_data = load_ML_prediction_data(page, per_page)
    for item in ml_prediction_data['data']:
        item['_id'] = str(item['_id'])

    return render_template('field_support.html', 
                           role=role, 
                           nickname=nickname, 
                           performance=performance, 
                           selected_date=selected_date,
                           data=ml_prediction_data['data'],
                           current_page=ml_prediction_data['current_page'],
                           total_pages=ml_prediction_data['total_pages'],
                           per_page=ml_prediction_data['per_page'],
                           total_count=ml_prediction_data['total_count'])

@app.route('/prospect_qualification')
def prospect_qualification():
    """
    Renders the Prospect Qualification page.
    Only accessible to Team Leaders and Managers.
    """
    role = session.get('role')
    nickname = session.get('nickname')
    if not role or role == 'Canvasser':
        return redirect(url_for('role_selection'))  # Only accessible for team leaders and managers
    return render_template('prospect_qualification.html', role=role, nickname=nickname)

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

# Routes for Data Handling
@app.route('/submit_data', methods=['POST'])
def submit_data():
    """
    Handles the submission of data from the data collection form.
    Processes and saves the data to the database.
    """
    role = session.get('role')
    nickname = session.get('nickname')
    collected_data = request.form.to_dict()  # Convert form data to dictionary
    reasons = request.form.getlist('reason_of_no[]')
    collected_data['reason_of_no'] = ' - '.join(reasons)
    collected_data.pop('reason_of_no[]', None)
    home_characteristics = request.form.getlist('appliances[]')
    collected_data['appliances'] = ' - '.join(home_characteristics)
    collected_data.pop('appliances[]', None)
    
    # Add ML model prediction if applicable
    if collected_data['prospect_response'] in ['No answer', 'Request to Return later']:
        probability = ml_model.predict(collected_data, collected_data['prospect_response'])
        collected_data['ML_model_pred_prob_of_app'] = probability
        collected_data['ML_model_pred_worth_returning'] = "Yes" if probability > 0.5 else "No"
    else:
        collected_data['ML_model_pred_prob_of_app'] = 'n/a'
        collected_data['ML_model_pred_worth_returning'] = 'n/a'

    # Extract latitude and longitude and transform them into float
    collected_data['latitude'] = float(collected_data.get('latitude', 0))
    collected_data['longitude'] = float(collected_data.get('longitude', 0))
    
    save_data(collected_data, role, nickname)  # Save processed data to MongoDB
    flash('Data submitted successfully!', 'success')  # Feedback to user
    return redirect(url_for('data_collection'))  # Redirect back to data collection page

@app.route('/delete/<prospect_id>', methods=['DELETE'])
def delete_prospect(prospect_id):
    """
    Handles the deletion of a row of data from the data stored so far.
    Processes and deletes the row of data indicated by the user from the database.
    """
    delete_data(prospect_id)
    flash('Data eliminated successfully!', 'success')  # Feedback to user 
    return jsonify({'success': True}), 200

@app.route('/delete-ALL', methods=['DELETE'])
def delete_all():
    """
    Handles the deletion of a row of data from the data stored so far.
    Processes and deletes the row of data indicated by the user from the database.
    """
    delete_ALL_data()
    flash('All data eliminated successfully!', 'success')  # Feedback to user 
    return jsonify({'success': True}), 200
  
# Routes for Data Processing
@app.route('/get_one_day_performance', methods=['POST'])
def get_one_day_performance_data():
    role = session.get('role')
    nickname = session.get('nickname')
    if not role or not nickname:
        return jsonify({"error": "Not authenticated"}), 401
    selected_date = request.json['date']
    performance = get_one_day_performance(role, nickname, selected_date)
    return jsonify(performance)

@app.route('/get_overall_performance', methods=['GET'])
def get_overall_performance_data():
    role = session.get('role')
    nickname = session.get('nickname')
    if not role or not nickname:
        return jsonify({"error": "Not authenticated"}), 401
    overall_performance = get_overall_performance(role, nickname)
    return jsonify(overall_performance)

@app.route('/get_prospect_personas')
def get_prospect_personas_data():
    role = session.get('role')
    if not role or role == 'Canvasser':
        return jsonify({"error": "Unauthorized"}), 403
    personas = get_prospect_personas()
    return jsonify(personas)

@app.route('/get_prospects_data_distribution/<field>')
def get_prospects_data_distribution(field):
    role = session.get('role')
    if not role or role == 'Canvasser':
        return jsonify({"error": "Unauthorized"}), 403
    data = get_prospects_data_distribution_data(field)
    return jsonify(data)

@app.route('/get_team_overview', methods=['GET'])
def get_team_overview_data():
    if session.get('role') != 'Manager':
        return jsonify({"error": "Unauthorized"}), 403
    team_overview = get_team_overview()
    return jsonify(team_overview)

@app.route('/get_team_performance', methods=['GET'])
def get_team_performance_data():
    if session.get('role') != 'Manager':
        return jsonify({"error": "Unauthorized"}), 403
    team_performance = get_team_performance()
    return jsonify(team_performance)

@app.route('/get_prospect_responses', methods=['GET'])
def get_prospect_responses_data():
    if session.get('role') != 'Manager':
        return jsonify({"error": "Unauthorized"}), 403
    data = get_prospect_responses()
    return jsonify(data)

@app.route('/get_reasons_of_no', methods=['GET'])
def get_reasons_of_no_data():
    if session.get('role') != 'Manager':
        return jsonify({"error": "Unauthorized"}), 403
    data = get_reasons_of_no()
    return jsonify(data)

#FIXME: this function is not working, it always returns the current date instead of the date with the last available data for the user
@app.route('/get_last_available_date', methods=['GET'])
def get_last_available_date():
    role = session.get('role')
    nickname = session.get('nickname')
    last_date = get_last_available_date_for_user(role, nickname)
    return jsonify({'last_date': last_date})

@app.route('/sync_data', methods=['POST'])
def sync_data():
    try:
        if sync_local_cache():
            return jsonify({"message": "Data synced successfully"}), 200
        else:
            return jsonify({"message": "No new data to sync"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Routes for Map related features
@app.route('/get_map_data')
def get_all_map_data():
    data = get_map_data()
    return jsonify(data)

# Routes for ML model predictions
@app.route('/predict', methods=['POST'])
def predict():
    prospect_data = request.json
    case_type = prospect_data.pop('prospect_response', None)
    if case_type not in ['No answer', 'Request to Return later']:
        return jsonify({'error': 'Invalid prospect_response'}), 400
    formatted_data = prepare_data_for_prediction(prospect_data, case_type)
    probability = ml_model.predict(formatted_data, case_type)
    return jsonify({'probability': probability})

# Routes for Error Handling and User Feedback
@app.errorhandler(404)
def page_not_found(e):
    flash('Page not found!')
    return redirect(url_for('role_selection'))

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)