# Purpose: Manages data storage using pandas and storing data on MongoDB. 
# Interacts with: main.py, data_processing.py.
# Programming Language: Python

import os
from pymongo import MongoClient
from dotenv import load_dotenv
from bson.objectid import ObjectId
from bson import json_util
import json
from datetime import datetime
import pandas as pd

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

def save_data(data, role, nickname):
    # Assign the 'Submitted by' field
    data['Submitted by'] = f'{role} {nickname}'
    
    # Insert the data into the MongoDB collection
    result = collection.insert_one(data)
    
    print(f"Data saved successfully with ID: {result.inserted_id}")

# Function to eliminate a specific row of data from the MongoDB database
def delete_data(prospect_id):
    try:
        prospect_id = ObjectId(prospect_id)
    except Exception as e:
        print(f"Invalid Prospect ID: {prospect_id}. Error: {e}")
        return False

    result = collection.delete_one({'_id': prospect_id})
    if result.deleted_count > 0:
        print(f"Data with Prospect ID {prospect_id} deleted successfully.")
        return True
    else:
        print(f"No data found with Prospect ID {prospect_id}.")
        return False

# Function to eliminate ALL data from the MongoDB database
def delete_ALL_data():
    result = collection.delete_many({})
    print(f"All data deleted successfully. Documents deleted: {result.deleted_count}")

# Function to load data from the MongoDB database
def load_data():
    # Retrieve all documents from the MongoDB collection
    data = list(collection.find().sort('_id', -1))
    return data

# Functions to load data from the MongoDB database with pagination for the tables 
def load_num_of_data(page=1, per_page=100):
    # Calculate the number of documents to skip
    skip = (page - 1) * per_page
    # Retrieve paginated documents from the MongoDB collection
    data = list(collection.find().sort('_id', -1).skip(skip).limit(per_page))
    # Get the total count of documents
    total_count = collection.count_documents({})
    # Calculate total pages
    total_pages = (total_count + per_page - 1) // per_page
    return {
        'data': data,
        'total_pages': total_pages,
        'current_page': page,
        'per_page': per_page,
        'total_count': total_count
    }

def load_ML_prediction_data(page=1, per_page=20, prospect_responses=['No answer', 'Request to Return later']):
    skip = (page - 1) * per_page
    query = {
        'prospect_response': {'$in': prospect_responses},
        'ML_model_pred_worth_returning': 'Yes'
    }
    data = list(collection.find(query)
                .sort('ML_model_pred_prob_of_app', -1)
                .skip(skip)
                .limit(per_page))
    total_count = collection.count_documents(query)
    total_pages = (total_count + per_page - 1) // per_page
    return {
        'data': data,
        'total_pages': total_pages,
        'current_page': page,
        'per_page': per_page,
        'total_count': total_count
    }

#FIXME: this function is not working, it always returns the current date instead of the date with the last available data for the user
def get_last_available_date_for_user(role, nickname): 
    user_data = collection.find({'Submitted by': f'{role} {nickname}'}).sort('timestamp', -1).limit(1)
    user_count = collection.count_documents({'Submitted by': f'{role} {nickname}'})
    if user_count > 0:
        return user_data[0]['timestamp'].date().isoformat()
    return datetime.now().date().isoformat()

# Function to load data for the maps
def get_map_data():
    data = load_data()
    # Convert ObjectId and datetime objects to strings
    for item in data:
        item['_id'] = str(item['_id'])
        # for key, value in item.items():
        #     if isinstance(value, datetime):
        #         item[key] = value.isoformat()
        item['timestamp'] = str(item['timestamp'])
        item['appointment_time'] = str(item['appointment_time'])
        item['follow_up_time'] = str(item['follow_up_time'])
        item['ML_model_pred_prob_of_app'] = item.get('ML_model_pred_prob_of_app', 'n/a')
        item['ML_model_pred_worth_returning'] = item.get('ML_model_pred_worth_returning', 'n/a')
    
    return json.loads(json_util.dumps(data))

# Function to fetch relevant data for predictions
def get_prediction_data():
    data = list(collection.find({
        'prospect_response': {'$in': ['No answer', 'Request to Return later']}
    }))
    return pd.DataFrame(data)

def update_prediction_fields(document_id, probability, worth_returning):
    collection.update_one(
        {'_id': document_id},
        {'$set': {
            'ML_model_pred_prob_of_app': probability,
            'ML_model_pred_worth_returning': worth_returning
        }}
    )