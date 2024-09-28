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
    
    pipeline = [
        {"$match": {
            "Submitted by": f"{role} {nickname}",
            "timestamp": {
                "$gte": datetime.combine(selected_date, datetime.min.time()),
                "$lt": datetime.combine(selected_date + timedelta(days=1), datetime.min.time())
            }
        }},
        {"$group": {
            "_id": None,
            "doors_knocked": {"$sum": 1},
            "appointments_set": {"$sum": {"$cond": [{"$eq": ["$prospect_response", "Appointment set"]}, 1, 0]}}
        }}
    ]
    result = list(collection.aggregate(pipeline))
    return result[0] if result else {"doors_knocked": 0, "appointments_set": 0}

# Add more functions for complex calculations using local_df as needed