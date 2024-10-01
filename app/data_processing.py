# Purpose: Contains Python functions for data processing, such as calculating conversion probabilities and generating optimized canvassing routes.
# Interacts with: database.py (to retrieve data), google_maps.py (to send processed data for route optimization).
# Programming Language: Python.

import os
import pandas as pd
from pymongo import MongoClient
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the MongoDB URI from environment variables
MONGO_URI = os.getenv('MONGO_URI')

# Create a MongoClient instance
client = MongoClient(MONGO_URI)

# Select the database and collection
db = client['solar_d2d_lead_generation_tracker']
#TODO: remember to change the collection name to 'prospects' when the real data is being collected
collection = db['fictitious_data'] # 'prospects' is the collection with the real data collected from the field, 'fictitious_data' is the temporarily one with fake data

# Local cache
local_df = None
last_sync_time = None

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

def get_performance(role, nickname, selected_date):
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

# Add more functions for complex calculations using local_df as needed