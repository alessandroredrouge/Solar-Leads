# Purpose: Contains Python functions for data processing, such as calculating conversion probabilities and generating optimized canvassing routes.
# Interacts with: database.py (to retrieve data), google_maps.py (to send processed data for route optimization).
# Programming Language: Python.

import os
import pandas as pd
from pymongo import MongoClient
from datetime import datetime, timedelta
from dotenv import load_dotenv
from collections import defaultdict, Counter
from statistics import mean


# Load environment variables from .env file
load_dotenv()

# Get the MongoDB URI from environment variables
MONGO_URI = os.getenv('MONGO_URI')

# Create a MongoClient instance
client = MongoClient(MONGO_URI)

# Select the database and collection
db = client['solar_d2d_lead_generation_tracker']
#TODO: remember to change the collection name to 'prospects' when the real data is being collected
collection = db['fake_data_for_demo'] # 'prospects' is the collection with the real data collected from the field, 'fake_data_for_demo' is the temporarily one with fake data

# Local cache
local_df = None
last_sync_time = None

#General fuctions
def sync_local_cache():
    global local_df, last_sync_time
    if last_sync_time:
        data = list(collection.find({"timestamp": {"$gt": last_sync_time}}))
    else:
        data = list(collection.find())
    
    if not data:
        return False  # No new data to sync

    new_df = pd.DataFrame(data)
    if local_df is None:
        local_df = new_df
    else:
        local_df = pd.concat([local_df, new_df]).drop_duplicates(subset='_id', keep='last')
    
    last_sync_time = datetime.now()
    return True  # New data was synced

# Functions for the Field Support webpage

def get_one_day_performance(role, nickname, selected_date):
    if isinstance(selected_date, str):
        selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
    
    start_of_day = datetime.combine(selected_date, datetime.min.time())
    end_of_day = start_of_day + timedelta(days=1)

    # Get all submissions for the selected date
    all_submissions = list(collection.find({
        "timestamp": {"$gte": start_of_day, "$lt": end_of_day}
    }))

    # Create dictionaries of users and their performance
    user_appointments = {}
    user_doors_knocked = {}
    for submission in all_submissions:
        user = submission['Submitted by']
        if user not in user_appointments:
            user_appointments[user] = 0
            user_doors_knocked[user] = 0
        user_doors_knocked[user] += 1
        if submission['prospect_response'] == "Appointment set":
            user_appointments[user] += 1

    # Get the current user's performance
    current_user = f"{role} {nickname}"
    doors_knocked = user_doors_knocked.get(current_user, 0)
    appointments_set = user_appointments.get(current_user, 0)

    # Calculate ranks
    sorted_doors = sorted(user_doors_knocked.items(), key=lambda x: x[1], reverse=True)
    sorted_appointments = sorted(user_appointments.items(), key=lambda x: x[1], reverse=True)
    rank_doors_knocked = next((i for i, (user, _) in enumerate(sorted_doors) if user == current_user), len(sorted_doors)) + 1
    rank_appointments_set = next((i for i, (user, _) in enumerate(sorted_appointments) if user == current_user), len(sorted_appointments)) + 1

    # Calculate doors away from daily goal
    daily_goal = 100  # Adjust as needed
    doors_away = max(0, daily_goal - doors_knocked)
                     
    # Calculate conversion rate
    conv_rate = f"{(appointments_set / doors_knocked * 100):.2f}%" if doors_knocked > 0 else "0.00%"

    performance = {"doors_knocked": doors_knocked, "appointments_set": appointments_set, "rank_doors_knocked": rank_doors_knocked,
        "rank_appointments_set": rank_appointments_set, "doors_away": doors_away, "conv_rate": conv_rate}

    return performance

def get_overall_performance(role, nickname):
    current_user = f"{role} {nickname}"
    
    # Get all submissions for the current user
    all_submissions = list(collection.find({"Submitted by": current_user}))
    
    # Calculate metrics
    doors_knocked = len(all_submissions)
    appointments_set = sum(1 for submission in all_submissions if submission['prospect_response'] == "Appointment set")
    conv_rate = f"{(appointments_set / doors_knocked * 100):.2f}%" if doors_knocked > 0 else "0.00%"
    
    # Calculate days since started
    if all_submissions:
        # Convert string timestamps to datetime objects if necessary
        timestamps = []
        for submission in all_submissions:
            timestamp = submission['timestamp']
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            timestamps.append(timestamp)
        
        first_submission = min(timestamps)
        days_since_started = (datetime.now(first_submission.tzinfo) - first_submission).days + 1
    else:
        days_since_started = 0

    overall_performance = {
        "total_doors_knocked": doors_knocked,
        "total_appointments_set": appointments_set,
        "average_conv_rate": conv_rate,
        "days_since_started": days_since_started
    }

    return overall_performance

# Functions for the Prospect Qualification webpage

def get_prospect_personas():
    all_data = list(collection.find())
    
    def get_normalized_data(field):
        total_counts = Counter()
        appointment_counts = Counter()
        non_appointment_counts = Counter()
        
        for d in all_data:
            if d['prospect_response'] not in ['No answer', 'Request to Return later']:
                value = d.get(field)
                if value is not None and value != '':
                    total_counts[str(value)] += 1
                    if d['prospect_response'] == 'Appointment set':
                        appointment_counts[str(value)] += 1
                    else:
                        non_appointment_counts[str(value)] += 1
        
        normalized_data_best = {}
        normalized_data_worst = {}
        for option, total_count in total_counts.items():
            appointment_count = appointment_counts.get(option, 0)
            normalized_data_best[option] = appointment_count / total_count if total_count > 0 else 0
            non_appointment_count = non_appointment_counts.get(option, 0)
            normalized_data_worst[option] = non_appointment_count / total_count if total_count > 0 else 0
        
        return {'best': normalized_data_best, 'worst': normalized_data_worst}
    
    def get_best_worst(normalized_data):
        sorted_data = sorted(normalized_data.items(), key=lambda x: x[1], reverse=True)
        return sorted_data[0][0]
    
    fields = ['solar_panels_on_roof', 'roof_type_condition', 'shading_issues', 'appliances',
              'number_of_decision_makers', 'approximate_age', 'number_inhabitants']
    
    best_persona = {}
    worst_persona = {}
    
    for field in fields:
        normalized_data = get_normalized_data(field)
        best, worst = get_best_worst(normalized_data['best']), get_best_worst(normalized_data['worst'])
        best_persona[field] = best
        worst_persona[field] = worst
    
    # Handle electricity bill estimate separately
    appointment_bills = [float(d['electricity_bill_estimate']) for d in all_data if d['prospect_response'] == 'Appointment set' and d['electricity_bill_estimate'] not in ['', 'n/a', None]]
    non_appointment_bills = [float(d['electricity_bill_estimate']) for d in all_data if d['prospect_response'] not in ['Appointment set', 'No answer', 'Request to Return later'] and d['electricity_bill_estimate'] not in ['', 'n/a', None]]
    
    best_persona['electricity_bill_estimate'] = round(mean(appointment_bills), 2) if appointment_bills else 'n/a'
    worst_persona['electricity_bill_estimate'] = round(mean(non_appointment_bills), 2) if non_appointment_bills else 'n/a'

    return {'best': best_persona, 'worst': worst_persona}

# Functions for the Analytics webpage

def get_team_overview():
    # Get all submissions
    all_submissions = list(collection.find())

    # Calculate metrics
    team_members = len(set(sub['Submitted by'] for sub in all_submissions))
    total_doors = len(all_submissions)
    total_appointments = sum(1 for sub in all_submissions if sub['prospect_response'] == "Appointment set")

    # Calculate date range
    if all_submissions:
        # Convert string timestamps to datetime objects if necessary
        timestamps = []
        for submission in all_submissions:
            timestamp = submission['timestamp']
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            timestamps.append(timestamp)
        
        first_submission = min(timestamps)
        last_submission = max(timestamps)
        days_since_started = (last_submission - first_submission).days + 1
    else:
        days_since_started = 0

    # Calculate averages
    avg_doors_per_day_employee = total_doors / (days_since_started * team_members) if days_since_started and team_members else 0
    avg_appointments_per_day_employee = total_appointments / (days_since_started * team_members) if days_since_started and team_members else 0
    avg_conversion_rate = (total_appointments / total_doors * 100) if total_doors else 0

    team_overview = {
        "team_members": team_members,
        "total_doors": total_doors,
        "total_appointments": total_appointments,
        "avg_doors_per_day_employee": round(avg_doors_per_day_employee, 2),
        "avg_appointments_per_day_employee": round(avg_appointments_per_day_employee, 2),
        "avg_conversion_rate": f"{avg_conversion_rate:.2f}%",
        "days_of_collection": days_since_started
    }

    return team_overview

# FIXME: average data from team_overview are slightly different from these ones, find out why
# If you noticed this, and you went to the source code to find out why, chapeau to you, you found my secret easter egg that I was too lazy to correct hahah
def get_team_performance():
    all_submissions = list(collection.find())
    team_performance = defaultdict(lambda: {"appointments": 0, "doors": 0, "days": set()})
    timestamps = []

    for submission in all_submissions:
        member = submission['Submitted by']
        team_performance[member]["doors"] += 1
        if submission['prospect_response'] == "Appointment set":
            team_performance[member]["appointments"] += 1
        
        timestamp = submission['timestamp']
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        timestamps.append(timestamp)
        team_performance[member]["days"].add(timestamp.date())

    if timestamps:
        first_submission = min(timestamps)
        last_submission = max(timestamps)
        days_since_started = (last_submission - first_submission).days + 1
    else:
        days_since_started = 0

    result = []
    for member, data in team_performance.items():
        active_days = len(data["days"])
        result.append({
            "member": member,
            "appointments": {
                "total": data["appointments"],
                "daily": round(data["appointments"] / active_days, 2) if active_days else 0
            },
            "doors": {
                "total": data["doors"],
                "daily": round(data["doors"] / active_days, 2) if active_days else 0
            },
            "conversion": {
                "total": round(data["appointments"] / data["doors"] * 100, 2) if data["doors"] else 0,
                "daily": round(data["appointments"] / data["doors"] * 100, 2) if data["doors"] else 0
            }
        })

    # Calculate team average
    if result:
        team_avg = {
            "member": "Team Average",
            "appointments": {
                "total": round(sum(m["appointments"]["total"] for m in result) / len(result), 2),
                "daily": round(sum(m["appointments"]["daily"] for m in result) / len(result), 2)
            },
            "doors": {
                "total": round(sum(m["doors"]["total"] for m in result) / len(result), 2),
                "daily": round(sum(m["doors"]["daily"] for m in result) / len(result), 2)
            },
            "conversion": {
                "total": round(sum(m["conversion"]["total"] for m in result) / len(result), 2),
                "daily": round(sum(m["conversion"]["daily"] for m in result) / len(result), 2)
            },
            "days_since_started": days_since_started
        }
        result.append(team_avg)

    return result

def get_prospect_responses():
    all_submissions = list(collection.find())
    response_counts = defaultdict(int)
    for submission in all_submissions:
        response_counts[submission['prospect_response']] += 1
    
    total_responses = sum(response_counts.values())
    response_percentages = {k: round(v / total_responses * 100, 2) for k, v in response_counts.items()}
    
    return response_percentages

def get_reasons_of_no():
    all_submissions = list(collection.find({"prospect_response": {"$ne": "Appointment set"}}))
    reason_counts = defaultdict(int)
    for submission in all_submissions:
        reasons = submission['reason_of_no']
        if ' - ' in reasons:
            # Split if there are multiple reasons
            reasons = reasons.split(' - ')
        else:
            # Treat as a single reason
            reasons = [reasons]
        for reason in reasons:
            reason = reason.strip()  # Remove any leading/trailing whitespace
            if reason:  # Only count non-empty reasons
                reason_counts[reason] += 1
    
    total_reasons = sum(reason_counts.values())
    if total_reasons > 0:
        reason_percentages = {k: round(v / total_reasons * 100, 2) for k, v in reason_counts.items()}
    else:
        reason_percentages = {}
    
    return reason_percentages

# Functions for the ML model

def prepare_data_for_prediction(prospect_data, case_type):
    features = {
        'solar_panels_on_roof': prospect_data.get('solar_panels_on_roof'),
        'roof_type_condition': prospect_data.get('roof_type_condition'),
        'shading_issues': prospect_data.get('shading_issues'),
        'appliances': prospect_data.get('appliances', ''),
    }
    
    if case_type == 'Request to Return later':
        features.update({
            'electricity_bill_estimate': prospect_data.get('electricity_bill_estimate'),
            'number_of_decision_makers': prospect_data.get('number_of_decision_makers'),
            'approximate_age': prospect_data.get('approximate_age'),
            'number_inhabitants': prospect_data.get('number_inhabitants'),
        })
    
    return features
